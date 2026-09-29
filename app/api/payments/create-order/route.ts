import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { db } from '@/lib/firebaseAdmin';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    
    const docSnap = await db.collection('bookings').doc(bookingId).get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    const booking = docSnap.data() as any;

    const options = {
      amount: booking.totalPrice * 100, // Amount in paise
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json({ order });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
