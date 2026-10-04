import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const hotelId = searchParams.get('hotelId');
    const partnerId = searchParams.get('partnerId');
    const status = searchParams.get('status');
    const limitParam = parseInt(searchParams.get('limit') || '20');

    let query: any = db.collection('bookings');
    
    if (customerId) query = query.where('customerId', '==', customerId);
    if (hotelId) query = query.where('hotelId', '==', hotelId);
    if (status) query = query.where('status', '==', status);
    
    if (partnerId) {
      // Need to find all hotels for this partner
      const hotelsSnap = await db.collection('hotels').where('partnerId', '==', partnerId).get();
      const hotelIds = hotelsSnap.docs.map(d => d.id);
      if (hotelIds.length > 0) {
        query = query.where('hotelId', 'in', hotelIds);
      } else {
        return NextResponse.json({ bookings: [], total: 0, page: 1, pages: 1 });
      }
    }

    // Don't order by in Firestore query to avoid composite index requirements
    query = query.limit(limitParam);
    
    const snapshot = await query.get();
    let bookings = snapshot.docs.map((doc: any) => ({ _id: doc.id, ...doc.data() }));

    const now = Date.now();
    let updatesPromises = [];

    // Auto-update bookings to 'completed' if checkOut date has passed
    for (let i = 0; i < bookings.length; i++) {
      if (bookings[i].status === 'confirmed' && bookings[i].checkOut) {
        const checkOutTime = new Date(bookings[i].checkOut).getTime();
        if (checkOutTime < now) {
          bookings[i].status = 'completed';
          updatesPromises.push(
            db.collection('bookings').doc(bookings[i]._id).update({ status: 'completed', updatedAt: new Date().toISOString() })
          );
        }
      }
    }

    if (updatesPromises.length > 0) {
      await Promise.all(updatesPromises).catch(console.error);
    }

    // Sort by createdAt descending in memory
    bookings.sort((a: any, b: any) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    // Populate references (mocked population since Firestore is NoSQL)
    for (let b of bookings) {
      if (b.hotelId) {
        const hSnap = await db.collection('hotels').doc(b.hotelId).get();
        if (hSnap.exists) {
          b.hotelId = { _id: hSnap.id, name: hSnap.data()?.name, city: hSnap.data()?.city, images: hSnap.data()?.images };
        }
      }
    }

    return NextResponse.json({ bookings, total: bookings.length, page: 1, pages: 1 });
  } catch (error) {
    console.error('Bookings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      customerId, hotelId, roomId, checkIn, checkOut, guests, 
      guestName, guestEmail, guestPhone, specialRequests,
      status = 'pending', paymentStatus = 'unpaid',
      gstRegistrationNo, gstCompanyName, gstCompanyAddress 
    } = body;

    if (!customerId || !hotelId || !roomId || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const hotelRef = db.collection('hotels').doc(hotelId);
    const hotelSnap = await hotelRef.get();
    
    if (!hotelSnap.exists) {
      return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
    }
    
    const hotelData = hotelSnap.data();
    let rooms = hotelData?.rooms || [];
    let room = rooms.find((r: any) => r._id === roomId || r.id === roomId);
    
    // If not embedded, fetch from rooms collection
    if (!room) {
      const roomDoc = await db.collection('rooms').doc(roomId).get();
      if (roomDoc.exists) {
        room = { _id: roomDoc.id, ...roomDoc.data() };
      }
    }
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24));

    if (nights < 1) return NextResponse.json({ error: 'Check-out must be after check-in' }, { status: 400 });

    let basePartnerPrice = room.priceDouble || room.priceSingle || room.priceTriple || 0;
    if (body.occupancy === 'single' && room.priceSingle) {
      basePartnerPrice = room.priceSingle;
    } else if (body.occupancy === 'triple' && room.priceTriple) {
      basePartnerPrice = room.priceTriple;
    } else if (body.occupancy === 'double' && room.priceDouble) {
      basePartnerPrice = room.priceDouble;
    }
    
    // In the frontend we removed the margin override, so client price is equal to base partner price
    const clientPrice = basePartnerPrice;
    const totalPrice = Math.round(nights * clientPrice * 1.05);
    const totalPartnerPrice = Math.round(nights * basePartnerPrice);

    const bookingRef = db.collection('bookings').doc();
    const counterRef = db.collection('metadata').doc('counters');

    let bookingIdString = 'SB-001';
    try {
      await db.runTransaction(async (t) => {
        const doc = await t.get(counterRef);
        let count = 1;
        if (doc.exists) {
          count = (doc.data()?.bookingCount || 0) + 1;
          t.update(counterRef, { bookingCount: count });
        } else {
          t.set(counterRef, { bookingCount: count });
        }
        bookingIdString = `SB-${count.toString().padStart(3, '0')}`;
      });
    } catch (e) {
      console.error('Counter transaction failed, falling back to random ID', e);
      bookingIdString = `SB-${Math.floor(Math.random() * 900) + 100}`;
    }
    
    const newBooking = {
      _id: bookingRef.id, // For backwards compatibility with frontend
      bookingId: bookingIdString,
      customerId, hotelId, roomId,
      checkIn: checkInDate.toISOString(), checkOut: checkOutDate.toISOString(),
      guests, nights, pricePerNight: clientPrice, totalPrice,
      partnerPricePerNight: basePartnerPrice, totalPartnerPrice,
      guestName, guestEmail, guestPhone, specialRequests,
      status, paymentStatus,
      gstRegistrationNo, gstCompanyName, gstCompanyAddress,
      createdAt: new Date().toISOString()
    };

    await bookingRef.set(newBooking);



    return NextResponse.json({ booking: newBooking }, { status: 201 });
  } catch (error: any) {
    console.error('Booking POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
