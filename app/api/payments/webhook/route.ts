import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebaseAdmin';
import { reconcileBookingPayment } from '@/lib/bookingPaymentReconcile';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        console.warn('Razorpay webhook signature mismatch');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    console.log(`[Razorpay Webhook] Received event: ${eventType}`);

    // We care about successful payment/order events
    if (eventType === 'payment.captured' || eventType === 'order.paid' || eventType === 'payment.authorized') {
      const paymentEntity = event.payload?.payment?.entity;
      const orderEntity = event.payload?.order?.entity;

      const paymentId = paymentEntity?.id;
      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentMethod = paymentEntity?.method || 'razorpay';

      // 1. Try to extract bookingId from notes
      let bookingId =
        paymentEntity?.notes?.bookingId ||
        paymentEntity?.notes?.booking_id ||
        orderEntity?.notes?.bookingId ||
        orderEntity?.notes?.booking_id;

      // 2. Try to extract bookingId from receipt (e.g. BK-SB-001 or receipt_...)
      if (!bookingId && orderEntity?.receipt) {
        bookingId = orderEntity.receipt.replace(/^receipt_/, '').replace(/^BK-/, '');
      }

      // 3. Fallback: Search Firestore for booking with razorpayOrderId
      if (!bookingId && orderId) {
        const snap = await db.collection('bookings').where('razorpayOrderId', '==', orderId).limit(1).get();
        if (!snap.empty) {
          bookingId = snap.docs[0].id;
        }
      }

      // 4. Fallback: If bookingId is a human-readable code (e.g. SB-001) instead of doc ID
      if (bookingId) {
        const docCheck = await db.collection('bookings').doc(bookingId).get();
        if (!docCheck.exists) {
          const snap = await db.collection('bookings').where('bookingId', '==', bookingId).limit(1).get();
          if (!snap.empty) {
            bookingId = snap.docs[0].id;
          }
        }
      }

      if (bookingId) {
        console.log(`[Razorpay Webhook] Reconciling booking: ${bookingId} for payment: ${paymentId}`);
        await reconcileBookingPayment(bookingId, {
          paymentId,
          orderId,
          paymentMethod,
          source: 'razorpay_webhook',
          rawDetails: event
        });
        return NextResponse.json({ success: true, reconciled: true, bookingId });
      } else {
        console.warn('[Razorpay Webhook] Could not find associated bookingId for payment:', paymentId, 'order:', orderId);
      }
    }

    return NextResponse.json({ success: true, processed: true });
  } catch (error: any) {
    console.error('[Razorpay Webhook] Error processing event:', error);
    return NextResponse.json({ error: error.message || 'Webhook processing failed' }, { status: 500 });
  }
}
