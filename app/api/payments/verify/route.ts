import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getRazorpayClient } from '@/lib/razorpay';
import { reconcileBookingPayment } from '@/lib/bookingPaymentReconcile';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = await request.json();
    
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    let isValid = false;
    let paymentMethod = 'razorpay';

    if (secret && razorpay_order_id && razorpay_payment_id && razorpay_signature) {
      const generated_signature = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      if (generated_signature === razorpay_signature) {
        isValid = true;
      }
    }

    // Direct fallback check with Razorpay API if HMAC check failed or order_id wasn't returned
    if (!isValid && razorpay_payment_id) {
      try {
        const razorpay = getRazorpayClient();
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        if (payment && (payment.status === 'captured' || payment.status === 'authorized')) {
          isValid = true;
          paymentMethod = payment.method || paymentMethod;
        }
      } catch (err) {
        console.error('Razorpay fallback verification error:', err);
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const { booking } = await reconcileBookingPayment(bookingId, {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      signature: razorpay_signature,
      paymentMethod,
      source: 'client_verify'
    });

    return NextResponse.json({ success: true, booking });
  } catch (error: any) {
    console.error('Razorpay Verify Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to verify payment' }, { status: 500 });
  }
}
