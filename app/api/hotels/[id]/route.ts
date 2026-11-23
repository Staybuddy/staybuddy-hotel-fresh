import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebaseAdmin';
import { applyMarginToRoom } from '@/lib/occupancyPricing';
import { getCached, setCached, invalidateCache } from '@/lib/cache';
import { getDateStr, getStayNights, isHotelBlockedForDates, getRoomBlockedCountForNight } from '@/lib/inventoryBlocks';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const rawId = (resolvedParams.id || '').trim();
    let decodedId = rawId;
    try {
      decodedId = decodeURIComponent(rawId).trim();
    } catch (_) {}

    // Ultra-fast In-Memory Cache (5s TTL for deduplication only, no client browser caching)
    const cacheKey = `hotel_detail_${request.url}`;
    const cachedResponse = getCached<any>(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'X-Cache': 'HIT',
        },
      });
    }
    
    // Check if the id is a document ID
    let hotelDoc = await db.collection('hotels').doc(decodedId).get();
    if (!hotelDoc.exists && rawId !== decodedId) {
      hotelDoc = await db.collection('hotels').doc(rawId).get();
    }
    let hotel: any = null;

    if (hotelDoc.exists) {
      hotel = { ...hotelDoc.data(), _id: hotelDoc.id, id: hotelDoc.id };
    } else {
      const searchIds = Array.from(new Set([decodedId, rawId].filter(Boolean)));
      for (const field of ['_id', 'id', 'hotelId', 'slug']) {
        const snapshot = await db.collection('hotels').where(field, 'in', searchIds).limit(1).get();
        if (!snapshot.empty) {
          hotel = { ...snapshot.docs[0].data(), _id: snapshot.docs[0].id, id: snapshot.docs[0].id };
          break;
        }
      }
    }

    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

    // Fetch rooms from Firestore rooms collection (supporting both resolvedParams.id and hotel._id)
    const possibleHotelIds = Array.from(new Set([
      resolvedParams.id,
      hotel._id,
      hotelDoc?.id,
      hotel.id
    ].filter(Boolean)));

    let collRooms: any[] = [];
    try {
      const roomsSnapshot = await db.collection('rooms')
        .where('hotelId', 'in', possibleHotelIds)
        .get();
      collRooms = roomsSnapshot.docs
        .map(doc => ({ _id: doc.id, ...doc.data() }))
        .filter((r: any) => r.isActive !== false);
    } catch (rErr) {
      console.warn('Error fetching rooms collection:', rErr);
    }

    let rooms: any[] = [];
    let reviews: any[] = [];
    if (hotel.rooms && Array.isArray(hotel.rooms) && hotel.rooms.length > 0) {
      // Merge hotel.rooms with collRooms (Partner Extranet CRM rooms collection is primary source of truth)
      const usedRoomIds = new Set<string>();
      rooms = hotel.rooms.map((hr: any, rIdx: number) => {
        // Find matching collection room by exact ID first, then by type if not already used
        const matchingColl = collRooms.find((cr: any) => 
          (cr._id && (cr._id === hr._id || cr._id === hr.id)) ||
          (cr.id && (cr.id === hr._id || cr.id === hr.id)) ||
          (cr.type && hr.type && cr.type.toLowerCase().trim() === hr.type.toLowerCase().trim() && !usedRoomIds.has(cr._id || cr.id))
        );

        // Strictly preserve room-specific photos uploaded by partner
        const roomImgs = (Array.isArray(matchingColl?.images) && matchingColl.images.length > 0)
          ? matchingColl.images
          : (Array.isArray(hr.images) && hr.images.length > 0)
          ? hr.images
          : (Array.isArray(hr.photos) && hr.photos.length > 0)
          ? hr.photos
          : (Array.isArray(matchingColl?.photos) && matchingColl.photos.length > 0)
          ? matchingColl.photos
          : [];

        // Rates: prioritize live Partner Extranet CRM prices from collRooms
        const pSingle = Number(matchingColl?.priceSingle) > 0
          ? Number(matchingColl.priceSingle)
          : Number(hr.priceSingle !== undefined && hr.priceSingle !== '' ? hr.priceSingle : (matchingColl?.priceSingle || 0)) || 0;

        const pDouble = Number(matchingColl?.priceDouble) > 0
          ? Number(matchingColl.priceDouble)
          : Number(hr.priceDouble !== undefined && hr.priceDouble !== '' ? hr.priceDouble : (matchingColl?.priceDouble || 0)) || 0;

        const pTriple = Number(matchingColl?.priceTriple) > 0
          ? Number(matchingColl.priceTriple)
          : Number(hr.priceTriple !== undefined && hr.priceTriple !== '' ? hr.priceTriple : (matchingColl?.priceTriple || 0)) || 0;

        // Rate plan: prioritize explicit ratePlan if set, ensuring breakfast (CP) is honored
        const effectiveRatePlan = hr.ratePlan || matchingColl?.ratePlan || 'EP';

        // Guarantee a unique, collision-free ID for EVERY room
        let roomId = hr._id || hr.id;
        if (!roomId && matchingColl && !usedRoomIds.has(matchingColl._id || matchingColl.id)) {
          roomId = matchingColl._id || matchingColl.id;
        }
        if (!roomId || usedRoomIds.has(roomId)) {
          roomId = `${hr._id || hr.id || matchingColl?._id || 'room'}_${effectiveRatePlan}_${rIdx}`;
        }
        usedRoomIds.add(roomId);

        return {
          ...hr,
          ...(matchingColl || {}),
          ...hr, // Hotel doc's hr is authoritative over stale collection fields!
          ratePlan: effectiveRatePlan,
          images: roomImgs,
          _id: roomId,
          id: roomId,
          priceSingle: pSingle,
          priceDouble: pDouble,
          priceTriple: pTriple,
        };
      });
      // Do not re-add rooms from collRooms that were deleted by admin from hotel.rooms
    } else {
      rooms = collRooms;
    }

    // Image fallback: if hotel.images is empty, fallback to room images
    if (!hotel.images || hotel.images.length === 0) {
      const roomImages = rooms.flatMap((r: any) => r.images || []).filter(Boolean);
      if (roomImages.length > 0) {
        hotel.images = roomImages;
      }
    }
    
    // Fetch active bookings & inventory blocks to calculate live availability for each room
    try {
      const searchParams = new URL(request.url).searchParams;
      const searchCheckIn = searchParams.get('checkIn');
      const searchCheckOut = searchParams.get('checkOut');
      const todayStr = getDateStr(new Date());
      const stayNights = getStayNights(searchCheckIn, searchCheckOut);
      const hasExplicitDates = Boolean(searchCheckIn && searchCheckOut);

      const targetHotelId = hotel._id || resolvedParams.id;
      const [bookingsSnap, blocksSnap, rSnap] = await Promise.all([
        db.collection('bookings')
          .where('hotelId', '==', hotel._id)
          .where('status', '==', 'confirmed')
          .get(),
        db.collection('inventory_blocks')
          .where('hotelId', '==', hotel._id)
          .get()
          .catch(() => ({ docs: [] as any[] })),
        db.collection('reviews')
          .where('hotelId', '==', targetHotelId)
          .get()
          .catch(() => ({ docs: [] as any[] })),
      ]);

      const confirmedBookings = bookingsSnap.docs.map((doc: any) => doc.data());
      const hotelBlocks = blocksSnap.docs.map((doc: any) => doc.data());

      const propertyBlockStatus = isHotelBlockedForDates(hotel, hotelBlocks, stayNights, hasExplicitDates);
      hotel.isBlockedForSelectedDates = propertyBlockStatus.blocked;
      hotel.blockReason = propertyBlockStatus.reason;

      // Update rooms with exact night-by-night availability
      rooms = rooms.map(room => {
        if (propertyBlockStatus.blocked) {
          return {
            ...room,
            availableRooms: 0,
            isBlockedForDates: true,
          };
        }

        const baseAlloc = Number(room.staybuddyAllocation !== undefined ? room.staybuddyAllocation : (room.totalRooms || 0));
        
        // Calculate available capacity for each night of the requested stay
        const availabilities = stayNights.map(nightStr => {
          // Extra inventory applies only if the night being evaluated is today
          const extraForNight = (nightStr === todayStr) ? Number(room.extraInventoryToday || 0) : 0;
          const nightCapacity = baseAlloc + extraForNight;

          // Subtract rooms blocked by partner extranet on this night
          const blockedOnNight = getRoomBlockedCountForNight(room._id, nightStr, hotelBlocks, nightCapacity);

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

          return Math.max(0, nightCapacity - bookedOnNight - blockedOnNight);
        });

        // The stay availability is the bottleneck (minimum) across all requested nights
        const minAvailable = Math.min(...availabilities);

        return {
          ...room,
          availableRooms: minAvailable
        };
      });

      // Parse reviews fetched concurrently
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

    } catch (e) {
      console.error('Error calculating room availability', e);
      // Fallback to allocation if error
      rooms = rooms.map(room => ({ ...room, availableRooms: (Number(room.staybuddyAllocation) || 0) + (Number(room.extraInventoryToday) || 0) }));
    }

    const margin = Number(hotel.marginPercentage) || 0;
    rooms = rooms.map(room => applyMarginToRoom(room, margin));
    if (hotel.rooms && Array.isArray(hotel.rooms)) {
      hotel.rooms = hotel.rooms.map((r: any) => applyMarginToRoom(r, margin));
    }

    // Always sort rooms so lowest price / lowest occupancy room is first (e.g. Standard Room before Deluxe Room)
    const getSortPrice = (r: any) => {
      const candidates = [
        Number(r.priceSingle),
        Number(r.priceDouble),
        Number(r.priceTriple),
        Number(r.price),
        Number(r.clientPrice),
        Number(r.b2bPriceSingle),
        Number(r.b2bPriceDouble),
        Number(r.b2bPrice),
      ].filter(p => !isNaN(p) && p > 0);
      return candidates.length > 0 ? Math.min(...candidates) : 999999;
    };
    rooms.sort((a, b) => getSortPrice(a) - getSortPrice(b));
    if (hotel.rooms && Array.isArray(hotel.rooms)) {
      hotel.rooms.sort((a: any, b: any) => getSortPrice(a) - getSortPrice(b));
    }

    const responsePayload = { hotel, rooms, reviews };
    setCached(cacheKey, responsePayload, 15);

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache': 'LIVE',
      },
    });
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
    delete updateData.providedRating;
    delete updateData.avgRating;
    delete updateData.totalReviews;
    updateData.updatedAt = new Date().toISOString();

    if (updateData.contactEmail || updateData.partnerEmail) {
      const emailVal = (updateData.contactEmail || updateData.partnerEmail).trim().toLowerCase();
      updateData.contactEmail = emailVal;
      updateData.partnerEmail = emailVal;
    }
    if (updateData.contactPhone || updateData.partnerPhone) {
      const phoneVal = (updateData.contactPhone || updateData.partnerPhone).trim();
      updateData.contactPhone = phoneVal;
      updateData.partnerPhone = phoneVal;
    }
    if (updateData.contactName || updateData.partnerName) {
      const nameVal = (updateData.contactName || updateData.partnerName).trim();
      updateData.contactName = nameVal;
      updateData.partnerName = nameVal;
    }

    const isAdmin = Boolean(body.isAdmin || body.isAdminAction || body.approvePendingRooms);
    const isOnboarder = Boolean((body.isOnboarder || body.role === 'onboarder') && !isAdmin);

    // If an onboarder or non-admin partner makes changes, store as pending approval and alert Admin
    if (isOnboarder && updateData.rooms && Array.isArray(updateData.rooms)) {
      const existingRooms = Array.isArray(docSnap.data()?.rooms) ? docSnap.data().rooms : [];
      const liveRoomTypes = new Set(existingRooms.map((r: any) => (r.type || '').trim().toLowerCase()));
      const newRoomTypes = new Set(updateData.rooms.map((r: any) => (r.type || '').trim().toLowerCase()));

      const deletedRooms = existingRooms.filter((r: any) => !newRoomTypes.has((r.type || '').trim().toLowerCase()));
      const addedRooms = updateData.rooms.filter((r: any) => !liveRoomTypes.has((r.type || '').trim().toLowerCase()));

      const changeParts: string[] = [];
      if (deletedRooms.length > 0) {
        changeParts.push(`Removed: ${deletedRooms.map((r: any) => r.type).join(', ')}`);
      }
      if (addedRooms.length > 0) {
        changeParts.push(`Added: ${addedRooms.map((r: any) => `${r.type} (${r.ratePlan === 'CP' ? 'CP Breakfast' : 'EP'})`).join(', ')}`);
      }
      if (changeParts.length === 0) {
        changeParts.push('Updated pricing / inventory');
      }
      const summary = changeParts.join(' • ');

      await docRef.update({
        hasPendingRoomUpdates: true,
        pendingRoomsCount: (docSnap.data()?.pendingRoomsCount || 0) + 1,
        pendingRooms: updateData.rooms,
        pendingRoomChangesSummary: summary,
        pendingUpdatedBy: body.updatedBy || body.onboardedBy || 'Onboarder Executive',
        pendingUpdatedAt: new Date().toISOString()
      });

      invalidateCache();
      return NextResponse.json({ 
        message: 'Changes submitted for Admin Approval',
        pendingApproval: true,
        summary 
      });
    }

    // ADMIN ACTION or DIRECT APPROVAL:
    // If rooms are sent in the update, sync them with the rooms collection and delete any removed rooms
    if (updateData.rooms && Array.isArray(updateData.rooms)) {
      const roomPhotos = updateData.rooms.flatMap((r: any) => Array.isArray(r.images) ? r.images : []).filter(Boolean);
      if ((!updateData.images || updateData.images.length === 0) && roomPhotos.length > 0) {
        updateData.images = Array.from(new Set(roomPhotos));
      }

      // Check which room IDs are being kept
      const keptRoomIds = new Set(
        updateData.rooms
          .map((r: any) => r._id || r.id)
          .filter((id: any) => id && !String(id).startsWith('new_'))
      );

      const batch = db.batch();

      // Find all existing rooms in the collection for this hotel
      const existingRoomsSnap = await db.collection('rooms')
        .where('hotelId', 'in', [docRef.id, resolvedParams.id])
        .get();

      // Permanently delete any rooms from the collection that were removed by the Admin!
      existingRoomsSnap.docs.forEach((rDoc: any) => {
        if (!keptRoomIds.has(rDoc.id)) {
          batch.delete(rDoc.ref);
        }
      });

      for (const r of updateData.rooms) {
        const roomId = r._id || r.id;
        if (roomId && !String(roomId).startsWith('new_')) {
          const rRef = db.collection('rooms').doc(String(roomId));
          const { _id: r_id, id: rId, ...rFields } = r;
          batch.set(rRef, { 
            ...rFields, 
            hotelId: docRef.id, 
            isActive: true, 
            approvalStatus: 'approved',
            updatedAt: new Date().toISOString() 
          }, { merge: true });
        } else {
          const newRoomRef = db.collection('rooms').doc();
          const { _id: r_id, id: rId, ...rFields } = r;
          r._id = newRoomRef.id;
          r.id = newRoomRef.id;
          batch.set(newRoomRef, {
            ...rFields,
            _id: newRoomRef.id,
            hotelId: docRef.id,
            isActive: true,
            approvalStatus: 'approved',
            createdAt: new Date().toISOString()
          });
        }
      }
      await batch.commit().catch(console.error);

      // Reset pending state since Admin applied it directly
      updateData.hasPendingRoomUpdates = false;
      updateData.pendingRoomsCount = 0;
      updateData.pendingRoomChangesSummary = null;
      updateData.pendingRooms = null;
      updateData.rooms = updateData.rooms.map((r: any) => ({ ...r, approvalStatus: 'approved', isActive: true }));
    }
    
    // If admin is approving pending room changes
    if (updateData.approvePendingRooms) {
      updateData.hasPendingRoomUpdates = false;
      updateData.pendingRoomsCount = 0;
      updateData.pendingRoomChangesSummary = null;
      updateData.pendingRooms = null;
      if (Array.isArray(updateData.rooms)) {
        updateData.rooms = updateData.rooms.map((r: any) => ({ ...r, approvalStatus: 'approved', isActive: true }));
      }
      delete updateData.approvePendingRooms;
    }

    if (updateData.rejectPendingRooms) {
      updateData.hasPendingRoomUpdates = false;
      updateData.pendingRoomsCount = 0;
      updateData.pendingRoomChangesSummary = null;
      updateData.pendingRooms = null;
      delete updateData.rejectPendingRooms;
    }

    await docRef.update(updateData);
    const updated = await docRef.get();
    
    invalidateCache();
    try {
      revalidatePath('/');
      revalidatePath('/hotels');
      revalidatePath(`/hotels/${docRef.id}`);
      revalidatePath(`/hotels/${resolvedParams.id}`);
    } catch (e) {
      console.warn('revalidatePath note:', e);
    }

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

    const hotelId = docRef.id;

    // 1. Delete all associated rooms
    const roomsSnap = await db.collection('rooms').where('hotelId', '==', hotelId).get();
    if (!roomsSnap.empty) {
      const roomBatch = db.batch();
      roomsSnap.docs.forEach((doc: any) => roomBatch.delete(doc.ref));
      await roomBatch.commit().catch(console.error);
    }

    // 2. Delete any associated reviews
    const reviewsSnap = await db.collection('reviews').where('hotelId', '==', hotelId).get();
    if (!reviewsSnap.empty) {
      const revBatch = db.batch();
      reviewsSnap.docs.forEach((doc: any) => revBatch.delete(doc.ref));
      await revBatch.commit().catch(console.error);
    }
    
    // 3. Delete the hotel
    await docRef.delete();
    invalidateCache('hotel_detail_');
    invalidateCache('hotels_search_');
    invalidateCache('approved_hotels_directory');
    return NextResponse.json({ success: true, message: 'Hotel and all associated rooms deleted successfully' });
  } catch (error: any) {
    console.error('Hotel DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
