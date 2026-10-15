import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { getRazorpayClient } from '@/lib/razorpay';
import { reconcileBookingPayment } from '@/lib/bookingPaymentReconcile';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, customerId, razorpayPaymentId } = body;

    if (!bookingId && !customerId && !razorpayPaymentId) {
      return NextResponse.json({ error: 'bookingId, customerId, or razorpayPaymentId is required' }, { status: 400 });
    }

    const razorpay = getRazorpayClient();

    // 1. Direct verification via Razorpay Payment ID (e.g. from Razorpay confirmation email)
    if (razorpayPaymentId) {
      try {
        const payment: any = await razorpay.payments.fetch(razorpayPaymentId);
        if (payment && (payment.status === 'captured' || payment.status === 'authorized')) {
          let targetBookingId = bookingId || payment.notes?.bookingId;
          if (!targetBookingId && payment.order_id) {
            const snap = await db.collection('bookings').where('razorpayOrderId', '==', payment.order_id).limit(1).get();
            if (!snap.empty) {
              targetBookingId = snap.docs[0].id;
            }
          }

          if (targetBookingId) {
            console.log(`[Recheck API] Reconciling booking ${targetBookingId} via direct Razorpay payment ID: ${payment.id}`);
            const { booking } = await reconcileBookingPayment(targetBookingId, {
              paymentId: payment.id,
              orderId: payment.order_id,
              paymentMethod: payment.method || 'upi',
              source: 'background_recheck',
              rawDetails: payment
            });
            return NextResponse.json({
              success: true,
              verified: true,
              verifiedCount: 1,
              verifiedBookings: [booking],
              message: `Payment ${payment.id} verified from Razorpay! Booking confirmed.`
            });
          }
        }
      } catch (pErr: any) {
        console.warn(`[Recheck API] Error fetching payment ${razorpayPaymentId}:`, pErr?.message || pErr);
      }
    }

    const bookingsToCheck: any[] = [];

    if (bookingId) {
      let bSnap = await db.collection('bookings').doc(bookingId).get();
      if (!bSnap.exists) {
        const query = await db.collection('bookings').where('_id', '==', bookingId).limit(1).get();
        if (!query.empty) bSnap = query.docs[0];
      }
      if (bSnap.exists) {
        bookingsToCheck.push({ _id: bSnap.id, ...bSnap.data() });
      }
    } else if (customerId) {
      // Find all pending bookings for this customer
      const query = await db.collection('bookings')
        .where('customerId', '==', customerId)
        .get();

      query.docs.forEach(doc => {
        const data = doc.data();
        if (data.paymentStatus === 'pending' || data.status === 'pending') {
          bookingsToCheck.push({ _id: doc.id, ...data });
        }
      });
    }

    const verifiedBookings: any[] = [];

    for (const b of bookingsToCheck) {
      // If already paid, nothing to do
      if (b.paymentStatus === 'paid' && b.status === 'confirmed') {
        continue;
      }

      let orderId = b.razorpayOrderId;
      let orderReceipt = b.razorpayReceipt || `receipt_${b._id}`;

      // If orderId is not stored on booking, try to find the order by receipt from Razorpay
      if (!orderId) {
        try {
          // Check if an order with this receipt exists
          // Razorpay orders API doesn't support direct receipt filter, so we use notes if available
        } catch (_) {}
      }

      if (!orderId) {
        continue;
      }

      try {
        // Query Razorpay API for all payments belonging to this order
        const paymentsResponse: any = await razorpay.orders.fetchPayments(orderId);
        const paymentsList = Array.isArray(paymentsResponse?.items) ? paymentsResponse.items : [];

        // Check if any payment was captured or authorized (e.g. PhonePe / UPI success)
        const successfulPayment = paymentsList.find(
          (p: any) => p.status === 'captured' || p.status === 'authorized'
        );

        if (successfulPayment) {
          console.log(`[Recheck API] Found successful Razorpay payment ${successfulPayment.id} for booking ${b._id}`);
          const { booking } = await reconcileBookingPayment(b._id, {
            paymentId: successfulPayment.id,
            orderId,
            paymentMethod: successfulPayment.method || 'upi',
            source: 'background_recheck',
            rawDetails: successfulPayment
          });
          verifiedBookings.push(booking);
        }
      } catch (rErr: any) {
        console.warn(`[Recheck API] Razorpay order payments check failed for order ${orderId}:`, rErr?.message || rErr);
      }
    }

    const isSingleCheck = Boolean(bookingId);
    const verified = verifiedBookings.length > 0;

    return NextResponse.json({
      success: true,
      verified,
      verifiedCount: verifiedBookings.length,
      verifiedBookings,
      message: verified
        ? `Payment verified and ${verifiedBookings.length} booking(s) marked confirmed!`
        : (isSingleCheck 
            ? 'No completed payment found on Razorpay for this booking. If your account was debited, please wait 1-2 minutes and re-check.' 
            : 'All bookings are up to date.')
    });
  } catch (error: any) {
    console.error('Payment Recheck Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to recheck payments' }, { status: 500 });
  }
}
