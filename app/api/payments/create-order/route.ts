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

    // Fetch hotel details for clear audit notes in Razorpay
    let hotelName = 'StayBuddy Hotel';
    let hotelIdDisplay = String(booking.hotelId || '');
    let hotelRawId = String(booking.hotelId || '');

    if (booking.hotelId) {
      try {
        let hSnap = await db.collection('hotels').doc(booking.hotelId).get();
        if (!hSnap.exists) {
          const hQuery = await db.collection('hotels').where('_id', '==', booking.hotelId).limit(1).get();
          if (!hQuery.empty) hSnap = hQuery.docs[0];
        }
        if (hSnap.exists) {
          const hData = hSnap.data() as any;
          if (hData.name) hotelName = hData.name;
          hotelRawId = hSnap.id;
          hotelIdDisplay = hData.hotelId || hSnap.id;
        }
      } catch (hErr) {
        console.warn('Error fetching hotel for Razorpay order:', hErr);
      }
    }

    const bookingCode = String(booking.bookingId || docSnap.id);
    const totalPriceNum = Math.round(Number(booking.totalPrice) || 0);
    const formattedAmount = `₹${totalPriceNum.toLocaleString('en-IN')}`;
    const auditDescription = `Hotel ID: ${hotelIdDisplay} | Booking: ${bookingCode} | ${formattedAmount}`;

    const razorpay = getRazorpayClient();

    const options = {
      amount: Math.round(totalPriceNum * 100), // Amount in paise
      currency: 'INR',
      receipt: `BK-${bookingCode}`.slice(0, 40),
      notes: {
        "Hotel ID": String(hotelIdDisplay),
        "Booking ID": String(bookingCode),
        "Amount": formattedAmount,
        "Hotel Name": String(hotelName).slice(0, 50),
        "Audit Note": auditDescription.slice(0, 255),
        // Machine-readable fields for backend & webhook compatibility:
        bookingId: String(docSnap.id),
        hotelId: String(hotelRawId),
        bookingCode: String(bookingCode),
        guestEmail: String(booking.guestEmail || ''),
        guestPhone: String(booking.guestPhone || ''),
        guestName: String(booking.guestName || '')
      }
    };

    const order = await razorpay.orders.create(options);
    
    // Crucial: Persist razorpayOrderId and audit details onto booking in Firestore
    await bookingRef.update({
      razorpayOrderId: order.id,
      razorpayReceipt: options.receipt,
      paymentMethod: 'razorpay',
      lastOrderCreatedAt: new Date().toISOString(),
      hotelIdDisplay,
      bookingAuditRef: auditDescription
    });

    return NextResponse.json({ 
      order, 
      id: order.id, 
      amount: order.amount, 
      currency: order.currency,
      hotelId: hotelIdDisplay,
      hotelName,
      bookingCode,
      formattedAmount,
      auditDescription,
      notes: options.notes
    });
  } catch (error) {
    console.error('Razorpay Create Order Error:', error);
    const errorMessage = (error as any)?.error?.description || (error as any)?.message || 'Failed to create payment order';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
