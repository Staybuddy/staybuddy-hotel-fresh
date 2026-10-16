import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { calculateBookingPricing, calculateMultiRoomPricing } from '@/lib/occupancyPricing';

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

    const requestedRooms = Number(body.rooms || 1);

    const getDateStr = (d: Date | string | number) => {
      const date = new Date(d);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    const todayStr = getDateStr(new Date());

    // Generate all nights for this stay
    const stayNights: string[] = [];
    const currDate = new Date(checkInDate);
    while (currDate < checkOutDate) {
      stayNights.push(getDateStr(currDate));
      currDate.setDate(currDate.getDate() + 1);
    }

    const hasMultiRooms = Array.isArray(body.selectedRooms) && body.selectedRooms.length > 0;
    const requestedAdults = Number(body.adults || body.guests || 1);

    let pricing: any;
    let selectedRoomsPayload: Array<{ roomId: string; roomType: string; quantity: number }> = [];

    if (hasMultiRooms) {
      selectedRoomsPayload = body.selectedRooms.map((sr: any) => ({
        roomId: String(sr.roomId),
        roomType: String(sr.roomType || 'Room'),
        quantity: Math.max(1, Number(sr.quantity || 1)),
      }));

      // Validate capacity for each selected room type
      const loadedRoomItems: Array<{ room: any; quantity: number }> = [];

      for (const sr of selectedRoomsPayload) {
        const roomDocSnap = await db.collection('rooms').doc(sr.roomId).get();
        if (!roomDocSnap.exists) {
          return NextResponse.json({ error: `Room ${sr.roomType} not found` }, { status: 404 });
        }
        const rData: any = { _id: roomDocSnap.id, ...(roomDocSnap.data() || {}) };
        loadedRoomItems.push({ room: rData, quantity: sr.quantity });

        // Existing bookings for this specific room
        const existingBookingsSnap = await db.collection('bookings')
          .where('roomId', '==', sr.roomId)
          .where('status', '==', 'confirmed')
          .get();

        const confirmedBookings = existingBookingsSnap.docs.map((doc: any) => doc.data());
        const baseAlloc = Number(rData.staybuddyAllocation !== undefined ? rData.staybuddyAllocation : (rData.totalRooms || 0));

        for (const nightStr of stayNights) {
          const extraForNight = (nightStr === todayStr) ? Number(rData.extraInventoryToday || 0) : 0;
          const nightCapacity = baseAlloc + extraForNight;

          let bookedOnNight = 0;
          confirmedBookings.forEach((b: any) => {
            if (b.checkIn && b.checkOut) {
              const bIn = getDateStr(b.checkIn);
              const bOut = getDateStr(b.checkOut);
              if (bIn <= nightStr && bOut > nightStr) {
                if (Array.isArray(b.selectedRooms) && b.selectedRooms.length > 0) {
                  const match = b.selectedRooms.find((item: any) => item.roomId === sr.roomId);
                  if (match) bookedOnNight += Number(match.quantity || 1);
                  else if (b.roomId === sr.roomId) bookedOnNight += Number(b.rooms || 1);
                } else if (b.roomId === sr.roomId) {
                  bookedOnNight += Number(b.rooms || 1);
                }
              }
            }
          });

          const remaining = nightCapacity - bookedOnNight;
          if (remaining < sr.quantity) {
            return NextResponse.json({
              error: `Only ${Math.max(0, remaining)} room(s) available for "${rData.type}" on ${nightStr}. Requested: ${sr.quantity}.`
            }, { status: 400 });
          }
        }
      }

      pricing = calculateMultiRoomPricing(loadedRoomItems, requestedAdults, nights);
    } else {
      // Single room booking (fallback)
      selectedRoomsPayload = [{ roomId, roomType: room.type, quantity: requestedRooms }];
      const existingBookingsSnap = await db.collection('bookings')
        .where('roomId', '==', roomId)
        .where('status', '==', 'confirmed')
        .get();

      const confirmedBookings = existingBookingsSnap.docs.map((doc: any) => doc.data());
      const baseAlloc = Number(room.staybuddyAllocation !== undefined ? room.staybuddyAllocation : (room.totalRooms || 0));

      for (const nightStr of stayNights) {
        const extraForNight = (nightStr === todayStr) ? Number(room.extraInventoryToday || 0) : 0;
        const nightCapacity = baseAlloc + extraForNight;

        let bookedOnNight = 0;
        confirmedBookings.forEach((b: any) => {
          if (b.checkIn && b.checkOut) {
            const bIn = getDateStr(b.checkIn);
            const bOut = getDateStr(b.checkOut);
            if (bIn <= nightStr && bOut > nightStr) {
              bookedOnNight += Number(b.rooms || 1);
            }
          }
        });

        const remaining = nightCapacity - bookedOnNight;
        if (remaining < requestedRooms) {
          return NextResponse.json({ 
            error: `Only ${Math.max(0, remaining)} room(s) available on ${nightStr}. Requested: ${requestedRooms}.` 
          }, { status: 400 });
        }
      }

      pricing = calculateBookingPricing(room, requestedAdults, requestedRooms, nights);
    }

    const clientPrice = Math.round(pricing.basePricePerNight / requestedRooms);
    const totalPrice = pricing.totalAmount;
    const totalPartnerPrice = pricing.priceAfterDiscount;
    const basePartnerPrice = clientPrice;

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
      rooms: requestedRooms,
      adults: requestedAdults,
      selectedRooms: selectedRoomsPayload,
      roomSummary: pricing.roomSummaryText || room.type,
      roomBreakdowns: pricing.roomBreakdowns,
      occupancySummary: pricing.summaryText,
      checkIn: checkInDate.toISOString(), checkOut: checkOutDate.toISOString(),
      guests, nights, pricePerNight: clientPrice, totalPrice,
      partnerPricePerNight: basePartnerPrice, totalPartnerPrice,
      guestName, guestEmail, guestPhone, specialRequests,
      status, paymentStatus,
      gstRegistrationNo, gstCompanyName, gstCompanyAddress,
      createdAt: new Date().toISOString()
    };

    await bookingRef.set(newBooking);

    // If today is one of the booked nights, update today's availableRooms in the room docs immediately
    if (stayNights.includes(todayStr)) {
      try {
        const roomsToUpdate = Array.from(new Set(selectedRoomsPayload.map(sr => sr.roomId)));
        for (const rId of roomsToUpdate) {
          const roomDocRef = db.collection('rooms').doc(rId);
          const roomDocSnap = await roomDocRef.get();
          if (roomDocSnap.exists) {
            const rData = roomDocSnap.data() || {};
            const currentBase = Number(rData.staybuddyAllocation || rData.totalRooms || 0);
            const currentExtra = Number(rData.extraInventoryToday || 0);
            const currentTotal = currentBase + currentExtra;

            const existingSnap = await db.collection('bookings')
              .where('roomId', '==', rId)
              .where('status', '==', 'confirmed')
              .get();

            let todayOccupied = 0;
            existingSnap.docs.forEach((d: any) => {
              const b = d.data();
              if (b.checkIn && b.checkOut) {
                const bIn = getDateStr(b.checkIn);
                const bOut = getDateStr(b.checkOut);
                if (bIn <= todayStr && bOut > todayStr) {
                  if (Array.isArray(b.selectedRooms)) {
                    const match = b.selectedRooms.find((item: any) => item.roomId === rId);
                    todayOccupied += match ? Number(match.quantity || 1) : 0;
                  } else if (b.roomId === rId) {
                    todayOccupied += Number(b.rooms || 1);
                  }
                }
              }
            });

            await roomDocRef.update({
              availableRooms: Math.max(0, currentTotal - todayOccupied),
              updatedAt: new Date().toISOString()
            });
          }
        }
      } catch (err) {
        console.error('Failed to update room availableRooms after booking', err);
      }
    }

    return NextResponse.json({ booking: newBooking }, { status: 201 });
  } catch (error: any) {
    console.error('Booking POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
