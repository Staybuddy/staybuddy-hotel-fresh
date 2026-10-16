import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

function getDateStr(d: Date | string | number): string {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    const targetDateParam = searchParams.get('date');
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 });
    
    const todayStr = getDateStr(new Date());
    const targetDateStr = targetDateParam || todayStr;
    const isToday = targetDateStr === todayStr;

    const snapshot = await db.collection('rooms').where('hotelId', '==', hotelId).where('isActive', '==', true).get();
    let rooms = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

    // Fetch active bookings for this hotel to calculate date-wise occupancy
    const bookingsSnap = await db.collection('bookings')
      .where('hotelId', '==', hotelId)
      .where('status', '==', 'confirmed')
      .get();

    // Map bookings occupied on targetDateStr
    // A booking occupies targetDateStr if: checkIn <= targetDateStr AND checkOut > targetDateStr
    const roomBookingsMap: Record<string, any[]> = {};
    const todayBookingsMap: Record<string, number> = {};

    bookingsSnap.docs.forEach((bDoc: any) => {
      const b = bDoc.data();
      const bIn = b.checkIn ? getDateStr(b.checkIn) : '';
      const bOut = b.checkOut ? getDateStr(b.checkOut) : '';
      const roomId = b.roomId;

      if (!roomId || !bIn || !bOut) return;

      const numRooms = Number(b.rooms || 1);

      // Check occupancy on requested target date
      if (bIn <= targetDateStr && bOut > targetDateStr) {
        if (!roomBookingsMap[roomId]) roomBookingsMap[roomId] = [];
        roomBookingsMap[roomId].push({
          bookingId: b.bookingId || bDoc.id.slice(-8),
          guestName: b.guestName || 'Guest',
          guestPhone: b.guestPhone || '',
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          rooms: numRooms
        });
      }

      // Track today's occupancy for DB sync
      if (bIn <= todayStr && bOut > todayStr) {
        todayBookingsMap[roomId] = (todayBookingsMap[roomId] || 0) + numRooms;
      }
    });

    // Calculate smart availability for each room
    rooms = rooms.map((room: any) => {
      const baseAlloc = Number(room.staybuddyAllocation !== undefined ? room.staybuddyAllocation : (room.totalRooms || 0));
      // Extra inventory applies only to today; future days automatically roll over base allocation
      const extraToday = isToday ? Number(room.extraInventoryToday || 0) : 0;
      const totalAllocation = baseAlloc + extraToday;

      const activeBookingsOnDate = roomBookingsMap[room._id] || [];
      const bookedRooms = activeBookingsOnDate.reduce((sum, item) => sum + item.rooms, 0);
      const availableRooms = Math.max(0, totalAllocation - bookedRooms);

      // Today's calculated available rooms
      const todayTotal = baseAlloc + Number(room.extraInventoryToday || 0);
      const todayBooked = todayBookingsMap[room._id] || 0;
      const todayAvailable = Math.max(0, todayTotal - todayBooked);

      return {
        ...room,
        targetDate: targetDateStr,
        isToday,
        staybuddyAllocation: baseAlloc,
        extraInventoryToday: room.extraInventoryToday || 0,
        bookedRooms,
        availableRooms,
        todayAvailable,
        activeBookings: activeBookingsOnDate
      };
    });
    
    return NextResponse.json({ 
      rooms, 
      targetDate: targetDateStr, 
      isToday,
      todayStr 
    });
  } catch (error) {
    console.error('Rooms GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, type, description, priceSingle, priceDouble, priceTriple, b2bPrice, ratePlan, maxGuests, bedType, size, images, amenities, totalRooms, staybuddyAllocation } = body;

    if (!hotelId || !type || priceSingle === undefined) {
      return NextResponse.json({ error: 'hotelId, type, priceSingle required' }, { status: 400 });
    }

    const roomRef = db.collection('rooms').doc();
    const guests = maxGuests ? parseInt(maxGuests) : 3;
    const numTotal = totalRooms !== undefined && totalRooms !== '' ? Math.max(0, Number(totalRooms)) : 0;
    const baseAlloc = staybuddyAllocation !== undefined && staybuddyAllocation !== '' ? Math.max(0, Number(staybuddyAllocation)) : numTotal;
    const newRoom = {
      _id: roomRef.id,
      hotelId, type, description: description || '', 
      priceSingle, priceDouble, priceTriple, b2bPrice, 
      ratePlan: ratePlan || 'EP', maxGuests: guests, bedType: bedType || '', size: size || '', 
      images: images || [], amenities: amenities || [], totalRooms: numTotal, 
      staybuddyAllocation: baseAlloc, 
      availableRooms: baseAlloc,
      extraInventoryToday: 0,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    await roomRef.set(newRoom);
    return NextResponse.json({ room: newRoom }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, priceSingle, priceDouble, priceTriple, b2bPrice, staybuddyAllocation, ratePlan, extraInventoryToday } = body;

    if (!roomId) {
      return NextResponse.json({ error: 'roomId is required' }, { status: 400 });
    }

    const roomRef = db.collection('rooms').doc(roomId);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }
    const currentRoom = roomSnap.data() || {};

    const updateFields: any = {};
    if (priceSingle !== undefined) updateFields.priceSingle = priceSingle;
    if (priceDouble !== undefined) updateFields.priceDouble = priceDouble;
    if (priceTriple !== undefined) updateFields.priceTriple = priceTriple;
    if (b2bPrice !== undefined) updateFields.b2bPrice = b2bPrice;
    if (ratePlan !== undefined) updateFields.ratePlan = ratePlan;

    const baseAlloc = staybuddyAllocation !== undefined 
      ? Number(staybuddyAllocation) 
      : Number(currentRoom.staybuddyAllocation || 0);

    const extraToday = extraInventoryToday !== undefined 
      ? Number(extraInventoryToday) 
      : Number(currentRoom.extraInventoryToday || 0);

    if (staybuddyAllocation !== undefined) updateFields.staybuddyAllocation = baseAlloc;
    if (extraInventoryToday !== undefined) updateFields.extraInventoryToday = extraToday;

    // Recalculate today's available rooms accounting for today's active bookings
    const todayStr = getDateStr(new Date());
    const bookingsSnap = await db.collection('bookings')
      .where('hotelId', '==', currentRoom.hotelId)
      .where('status', '==', 'confirmed')
      .get();

    let todayBooked = 0;
    bookingsSnap.docs.forEach((bDoc: any) => {
      const b = bDoc.data();
      if (b.roomId === roomId && b.checkIn && b.checkOut) {
        const bIn = getDateStr(b.checkIn);
        const bOut = getDateStr(b.checkOut);
        if (bIn <= todayStr && bOut > todayStr) {
          todayBooked += Number(b.rooms || 1);
        }
      }
    });

    const smartAvailable = Math.max(0, (baseAlloc + extraToday) - todayBooked);
    updateFields.availableRooms = smartAvailable;
    updateFields.updatedAt = new Date().toISOString();

    await roomRef.update(updateFields);
    
    const updatedDoc = await roomRef.get();
    const room = { _id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ room });
  } catch (error) {
    console.error('Rooms PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

