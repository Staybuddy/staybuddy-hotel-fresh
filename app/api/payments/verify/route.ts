import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import WalletTransaction from '@/models/WalletTransaction';
import { sendBookingConfirmationEmail, sendPartnerNotificationEmail } from '@/lib/email';
import { db } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = await request.json();
    
    const secret = process.env.RAZORPAY_KEY_SECRET || '';
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Update booking in Firestore
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingSnap = await bookingRef.get();
    
    if (!bookingSnap.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    
    await bookingRef.update({ paymentStatus: 'paid', status: 'confirmed', updatedAt: new Date().toISOString() });
    const updatedBookingSnap = await bookingRef.get();
    let booking = { _id: updatedBookingSnap.id, ...updatedBookingSnap.data() } as any;

    // Fetch related docs for email
    const hotelSnap = await db.collection('hotels').doc(booking.hotelId).get();
    const hotel = hotelSnap.exists ? { _id: hotelSnap.id, ...hotelSnap.data() } : null;
    booking.hotelId = hotel;

    await connectDB();
    const customer = await User.findById(booking.customerId);
    booking.customerId = customer ? { name: customer.name, email: customer.email, _id: customer._id } : booking.customerId;

    if (booking) {
      // Send B2C email
      sendBookingConfirmationEmail(booking).catch(console.error);

      // Send B2B email if partner has email
      if (hotel && hotel.partnerId) {
        const partner = await User.findById(hotel.partnerId);
        if (partner && partner.email) {
          sendPartnerNotificationEmail(booking, partner.email).catch(console.error);
        }
      }

      try {
        if (customer && customer.referredBy && !customer.referralRewardClaimed) {
          const referrer = await User.findById(customer.referredBy);
          if (referrer && referrer.referralCount < 5) {
            referrer.walletBalance = (referrer.walletBalance || 0) + 20;
            referrer.referralCount = (referrer.referralCount || 0) + 1;
            await referrer.save();

            customer.referralRewardClaimed = true;
            await customer.save();

            await WalletTransaction.create({
              userId: referrer._id,
              amount: 20,
              type: 'referral_reward',
              description: `Referral reward for ${customer.name}'s first booking`,
            });
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
