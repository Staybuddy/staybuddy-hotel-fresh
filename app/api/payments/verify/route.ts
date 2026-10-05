import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { db } from '@/lib/firebaseAdmin';
import { sendBookingConfirmationEmail, sendPartnerNotificationEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = await request.json();
    
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    let isValid = false;

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
        const razorpay = new Razorpay({
          key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          key_secret: secret,
        });
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        if (payment && (payment.status === 'captured' || payment.status === 'authorized')) {
          isValid = true;
        }
      } catch (err) {
        console.error('Razorpay fallback verification error:', err);
      }
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    
    if (!bookingSnap.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    await bookingRef.update({ paymentStatus: 'paid', status: 'confirmed', updatedAt: new Date().toISOString() });
    const updatedBookingSnap = await bookingRef.get();
    let booking = { _id: updatedBookingSnap.id, ...updatedBookingSnap.data() } as any;

    const hotelSnap = await db.collection('hotels').doc(booking.hotelId).get();
    const hotel = hotelSnap.exists ? { _id: hotelSnap.id, ...(hotelSnap.data() as any) } : null;
    booking.hotelId = hotel;

    const customerSnap = await db.collection('users').doc(booking.customerId).get();
    const customer = customerSnap.exists ? customerSnap.data() : null;
    booking.customerId = customer ? { name: customer.name, email: customer.email, _id: customerSnap.id } : booking.customerId;

    if (booking) {
      sendBookingConfirmationEmail(booking).catch(console.error);

      if (hotel && hotel.partnerId) {
        const partnerSnap = await db.collection('users').doc(hotel.partnerId).get();
        if (partnerSnap.exists && partnerSnap.data()?.email) {
          sendPartnerNotificationEmail(booking, partnerSnap.data()!.email).catch(console.error);
        }
      }

      try {
        if (customer && customer.referredBy && !customer.referralRewardClaimed) {
          const referrerRef = db.collection('users').doc(customer.referredBy);
          const referrerSnap = await referrerRef.get();
          if (referrerSnap.exists) {
            const referrer = referrerSnap.data() as any;
            if (referrer.referralCount < 5) {
              await referrerRef.update({
                walletBalance: (referrer.walletBalance || 0) + 20,
                referralCount: (referrer.referralCount || 0) + 1
              });

              await db.collection('users').doc(booking.customerId).update({ referralRewardClaimed: true });

              const txRef = db.collection('wallet_transactions').doc();
              await txRef.set({
                _id: txRef.id,
                userId: referrerSnap.id,
                amount: 20,
                type: 'referral_reward',
                description: `Referral reward for ${customer.name}'s first booking`,
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      } catch (err) {
        console.error('Referral Reward Error:', err);
      }
    }

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    console.error('Razorpay Verify Error:', error);
    return NextResponse.json({ error: 'Failed to verify payment' }, { status: 500 });
  }
}
