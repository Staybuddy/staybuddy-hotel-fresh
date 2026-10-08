import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');
    if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 });
    
    const snapshot = await db.collection('rooms').where('hotelId', '==', hotelId).where('isActive', '==', true).get();
    const rooms = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    
    return NextResponse.json({ rooms });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { hotelId, type, description, priceSingle, priceDouble, priceTriple, b2bPrice, ratePlan, maxGuests, bedType, size, images, amenities, totalRooms, staybuddyAllocation } = body;

    if (!hotelId || !type || priceSingle === undefined || !maxGuests) {
      return NextResponse.json({ error: 'hotelId, type, priceSingle, maxGuests required' }, { status: 400 });
    }

    const roomRef = db.collection('rooms').doc();
    const newRoom = {
      _id: roomRef.id,
      hotelId, type, description: description || '', 
      priceSingle, priceDouble, priceTriple, b2bPrice, 
      ratePlan: ratePlan || 'EP', maxGuests, bedType: bedType || '', size: size || '', 
      images: images || [], amenities: amenities || [], totalRooms, 
      staybuddyAllocation: staybuddyAllocation || totalRooms, 
      availableRooms: staybuddyAllocation || totalRooms,
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

    const updateFields: any = {};
    if (priceSingle !== undefined) updateFields.priceSingle = priceSingle;
    if (priceDouble !== undefined) updateFields.priceDouble = priceDouble;
    if (priceTriple !== undefined) updateFields.priceTriple = priceTriple;
    if (b2bPrice !== undefined) updateFields.b2bPrice = b2bPrice;
    
    // If updating base allocation, reset available rooms (unless extra inventory is also being set simultaneously)
    if (staybuddyAllocation !== undefined) {
      updateFields.staybuddyAllocation = staybuddyAllocation;
      updateFields.availableRooms = staybuddyAllocation; 
    }
    
    // If adding extra inventory for today, compute new availableRooms
    if (extraInventoryToday !== undefined) {
      updateFields.extraInventoryToday = extraInventoryToday;
      // Fetch the current base allocation to calculate the new total
      const roomSnap = await db.collection('rooms').doc(roomId).get();
      if (roomSnap.exists) {
        const baseAlloc = staybuddyAllocation !== undefined ? staybuddyAllocation : (roomSnap.data()?.staybuddyAllocation || 0);
        updateFields.availableRooms = baseAlloc + Number(extraInventoryToday);
      }
    }

    if (ratePlan !== undefined) updateFields.ratePlan = ratePlan;
    updateFields.updatedAt = new Date().toISOString();

    const roomRef = db.collection('rooms').doc(roomId);
    await roomRef.update(updateFields);
    
    const updatedDoc = await roomRef.get();
    const room = { _id: updatedDoc.id, ...updatedDoc.data() };

    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
