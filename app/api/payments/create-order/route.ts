import { NextRequest, NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/razorpay';
import { db } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    
    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    let bookingRef = db.collection('bookings').doc(bookingId);
    let docSnap = await bookingRef.get();
    
    if (!docSnap.exists) {
      const snap = await db.collection('bookings').where('_id', '==', bookingId).limit(1).get();
      if (snap.empty) {
        return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
      }
      bookingRef = snap.docs[0].ref;
      docSnap = snap.docs[0];
    }
    const booking = docSnap.data() as any;

    const razorpay = getRazorpayClient();

    const options = {
      amount: Math.round(Number(booking.totalPrice) * 100), // Amount in paise
      currency: 'INR',
      receipt: `receipt_${bookingId}`,
      notes: {
        bookingId: String(bookingId),
        customerId: String(booking.customerId || ''),
        hotelId: String(booking.hotelId || ''),
        guestEmail: String(booking.guestEmail || ''),
        guestPhone: String(booking.guestPhone || ''),
      }
    };

    const order = await razorpay.orders.create(options);
    
    // Crucial: Persist razorpayOrderId and receipt onto booking in Firestore
    await bookingRef.update({
      razorpayOrderId: order.id,
      razorpayReceipt: options.receipt,
      paymentMethod: 'razorpay',
      lastOrderCreatedAt: new Date().toISOString()
    });

    return NextResponse.json({ 
      order, 
      id: order.id, 
      amount: order.amount, 
      currency: order.currency 
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    const errorMessage = (error as any)?.error?.description || (error as any)?.message || 'Failed to create payment order';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
