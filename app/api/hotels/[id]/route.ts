import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    // Check if the id is a document ID
    const hotelDoc = await db.collection('hotels').doc(resolvedParams.id).get();
    let hotel: any = null;

    if (hotelDoc.exists) {
      hotel = { _id: hotelDoc.id, ...hotelDoc.data() };
    } else {
      // It might be a string MongoDB ID or we might have indexed it by _id in Firestore
      const snapshot = await db.collection('hotels').where('_id', '==', resolvedParams.id).limit(1).get();
      if (!snapshot.empty) {
        hotel = { _id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
    }

    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

    // Fetch rooms from Firestore rooms collection first
    const roomsSnapshot = await db.collection('rooms').where('hotelId', '==', resolvedParams.id).where('isActive', '==', true).get();
    let rooms: any[] = roomsSnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    if (rooms.length === 0 && hotel.rooms && hotel.rooms.length > 0) {
      rooms = hotel.rooms;
    }

    // Image fallback: if hotel.images is empty, fallback to room images
    if (!hotel.images || hotel.images.length === 0) {
      const roomImages = rooms.flatMap((r: any) => r.images || []).filter(Boolean);
      if (roomImages.length > 0) {
        hotel.images = roomImages;
      }
    }
    
    // Fetch active bookings to calculate live availability for each room
    try {
      const searchParams = new URL(request.url).searchParams;
      const searchCheckIn = searchParams.get('checkIn');
      const searchCheckOut = searchParams.get('checkOut');
      const todayStr = (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })();

      const getDateStr = (d: Date | string | number) => {
        const date = new Date(d);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };

      // Determine stay nights to evaluate
      let stayNights: string[] = [];
      if (searchCheckIn && searchCheckOut) {
        const start = new Date(searchCheckIn);
        const end = new Date(searchCheckOut);
        const curr = new Date(start);
        while (curr < end) {
          stayNights.push(getDateStr(curr));
          curr.setDate(curr.getDate() + 1);
        }
      }
      if (stayNights.length === 0) {
        stayNights = [todayStr];
      }

      const bookingsSnap = await db.collection('bookings')
        .where('hotelId', '==', hotel._id)
        .where('status', '==', 'confirmed')
        .get();

      const confirmedBookings = bookingsSnap.docs.map((doc: any) => doc.data());

      // Update rooms with exact night-by-night availability
      rooms = rooms.map(room => {
        const baseAlloc = Number(room.staybuddyAllocation !== undefined ? room.staybuddyAllocation : (room.totalRooms || 0));
        
        // Calculate available capacity for each night of the requested stay
        const availabilities = stayNights.map(nightStr => {
          // Extra inventory applies only if the night being evaluated is today
          const extraForNight = (nightStr === todayStr) ? Number(room.extraInventoryToday || 0) : 0;
          const nightCapacity = baseAlloc + extraForNight;

          // Find bookings occupying this night: bIn <= nightStr and bOut > nightStr
          let bookedOnNight = 0;
          confirmedBookings.forEach((b: any) => {
            if (b.roomId === room._id && b.checkIn && b.checkOut) {
              const bIn = getDateStr(b.checkIn);
              const bOut = getDateStr(b.checkOut);
              if (bIn <= nightStr && bOut > nightStr) {
                bookedOnNight += Number(b.rooms || 1);
              }
            }
          });

          return Math.max(0, nightCapacity - bookedOnNight);
        });

        // The stay availability is the bottleneck (minimum) across all requested nights
        const minAvailable = Math.min(...availabilities);

        return {
          ...room,
          availableRooms: minAvailable
        };
      });

    } catch (e) {
      console.error('Error calculating room availability', e);
      // Fallback to allocation if error
      rooms = rooms.map(room => ({ ...room, availableRooms: (Number(room.staybuddyAllocation) || 0) + (Number(room.extraInventoryToday) || 0) }));
    }

    // Fetch reviews for the hotel
    let reviews: any[] = [];
    try {
      const targetHotelId = hotel._id || resolvedParams.id;
      const rSnap = await db.collection('reviews')
        .where('hotelId', '==', targetHotelId)
        .get();
      
      reviews = rSnap.docs.map(doc => {
        const data = doc.data();
        return {
          _id: doc.id,
          ...data,
          customerId: {
            _id: data.customerId,
            name: data.guestName || data.userName || 'Guest',
            image: data.customerImage || data.userAvatar || ''
          }
        };
      });
      reviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } catch (rErr) {
      console.warn('Error fetching hotel reviews:', rErr);
    }

    return NextResponse.json({ hotel, rooms, reviews });
  } catch (error) {
    console.error('Hotels [id] GET error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    let docRef = db.collection('hotels').doc(resolvedParams.id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      // Fallback query
      const snapshot = await db.collection('hotels').where('_id', '==', resolvedParams.id).limit(1).get();
      if (snapshot.empty) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      docRef = db.collection('hotels').doc(snapshot.docs[0].id);
    }

    const { _id, id, ...updateData } = body;
    updateData.updatedAt = new Date().toISOString();

    // If rooms are sent in the update, sync them with the rooms collection
    if (updateData.rooms && Array.isArray(updateData.rooms)) {
      const batch = db.batch();
      for (const r of updateData.rooms) {
        const roomId = r._id || r.id;
        if (roomId && !String(roomId).startsWith('new_')) {
          const rRef = db.collection('rooms').doc(String(roomId));
          const { _id: r_id, id: rId, ...rFields } = r;
          batch.set(rRef, { ...rFields, hotelId: docRef.id, updatedAt: new Date().toISOString() }, { merge: true });
        } else {
          const newRoomRef = db.collection('rooms').doc();
          const { _id: r_id, id: rId, ...rFields } = r;
          batch.set(newRoomRef, {
            ...rFields,
            _id: newRoomRef.id,
            hotelId: docRef.id,
            isActive: true,
            createdAt: new Date().toISOString()
          });
        }
      }
      await batch.commit().catch(console.error);
    }
    
    await docRef.update(updateData);
    const updated = await docRef.get();
    
    return NextResponse.json({ hotel: { _id: updated.id, ...updated.data() } });
  } catch (error) {
    console.error('Hotels [id] PUT error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    let docRef = db.collection('hotels').doc(resolvedParams.id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      const snapshot = await db.collection('hotels').where('_id', '==', resolvedParams.id).limit(1).get();
      if (snapshot.empty) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      docRef = db.collection('hotels').doc(snapshot.docs[0].id);
    }
    
    await docRef.delete();
    return NextResponse.json({ message: 'Hotel deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
