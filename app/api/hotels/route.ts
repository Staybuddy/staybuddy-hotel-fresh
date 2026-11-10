import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebaseAdmin';
import { applyMarginToRoom, getRoomPriceForOccupancy } from '@/lib/occupancyPricing';
import { getCached, setCached, invalidateCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 1. Ultra-fast In-Memory Cache (20s TTL)
    const cacheKey = `hotels_search_${request.url}`;
    const cachedResponse = getCached<any>(cacheKey);
    if (cachedResponse) {
      return NextResponse.json(cachedResponse, {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=59',
          'X-Cache': 'HIT',
        },
      });
    }

    const status = searchParams.get('status') || 'approved';
    const partnerId = searchParams.get('partnerId');
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const propertyType = searchParams.get('propertyType');
    const limitParam = parseInt(searchParams.get('limit') || '12');
    const searchCheckIn = searchParams.get('checkIn');
    const searchCheckOut = searchParams.get('checkOut');
    const searchAdults = parseInt(searchParams.get('adults') || '2', 10);
    const searchRooms = parseInt(searchParams.get('rooms') || '1', 10);
    const occPerRoom = Math.max(1, Math.min(3, Math.ceil(searchAdults / Math.max(1, searchRooms))));

    let hotelsRef: any = db.collection('hotels');
    
    if (status && status !== 'all') {
      hotelsRef = hotelsRef.where('status', '==', status);
    }
    if (category && category !== 'business') hotelsRef = hotelsRef.where('category', '==', category);
    if (propertyType) hotelsRef = hotelsRef.where('propertyType', '==', propertyType);
    
    const snapshot = await hotelsRef.get();
    let hotels = snapshot.docs.map((doc: any) => ({ _id: doc.id, ...doc.data() }));

    // Memory filter for partnerId (handles both string and object {_id, name, email} formats)
    if (partnerId) {
      hotels = hotels.filter((h: any) => {
        if (!h.partnerId) return false;
        if (typeof h.partnerId === 'string') {
          return h.partnerId === partnerId;
        }
        if (typeof h.partnerId === 'object') {
          return (
            h.partnerId._id === partnerId ||
            h.partnerId.id === partnerId ||
            (h.partnerId.email && h.partnerId.email.toLowerCase() === partnerId.toLowerCase())
          );
        }
        return false;
      });
    }

    // Apply memory filters for things Firestore can't do natively like regex
    if (city) {
      const cityLower = city.toLowerCase();
      hotels = hotels.filter((h: any) => h.city?.toLowerCase().includes(cityLower) || h.area?.toLowerCase().includes(cityLower));
    }

    if (category === 'business') {
      hotels = hotels.filter((h: any) => 
        !h.category || h.category === 'business' || h.category === 'premium' || h.category === 'standard' ||
        (Array.isArray(h.amenities) && (h.amenities.includes('Free WiFi') || h.amenities.includes('Business Center') || h.amenities.includes('24-hour Front Desk')))
      );
    }

    if (status !== 'all') {
      hotels = hotels.filter((h: any) => h.isBlocked !== true);
    }

    hotels = hotels.sort((a: any, b: any) => (b.avgRating || 0) - (a.avgRating || 0));
    
    const page = parseInt(searchParams.get('page') || '1');
    const total = hotels.length;
    const skip = (page - 1) * limitParam;
    const paginatedHotels = hotels.slice(skip, skip + limitParam);

    // 2. High-Performance Batch Loading: Query rooms & bookings in single operations
    const hotelIds = paginatedHotels.map((h: any) => h._id).filter(Boolean);

    const roomsByHotelId: Record<string, any[]> = {};
    if (hotelIds.length > 0) {
      try {
        const roomsSnap = await db.collection('rooms')
          .where('hotelId', 'in', hotelIds.slice(0, 30))
          .get();
        roomsSnap.docs.forEach((doc: any) => {
          const r = doc.data();
          if (r.isActive !== false && r.hotelId) {
            if (!roomsByHotelId[r.hotelId]) roomsByHotelId[r.hotelId] = [];
            roomsByHotelId[r.hotelId].push(r);
          }
        });
      } catch (rErr) {
        console.warn('Batch rooms fetch error', rErr);
      }
    }

    const bookingsByHotelId: Record<string, any[]> = {};
    if (hotelIds.length > 0) {
      try {
        const bookingsSnap = await db.collection('bookings')
          .where('hotelId', 'in', hotelIds.slice(0, 30))
          .get();
        bookingsSnap.docs.forEach((doc: any) => {
          const b = doc.data();
          if (b.status === 'confirmed' && b.hotelId) {
            if (!bookingsByHotelId[b.hotelId]) bookingsByHotelId[b.hotelId] = [];
            bookingsByHotelId[b.hotelId].push(b);
          }
        });
      } catch (bErr) {
        console.warn('Batch bookings fetch error', bErr);
      }
    }

    // 3. Instant In-Memory Aggregation: 0ms per hotel instead of 100ms
    const hotelsWithPrices = paginatedHotels.map((hotel: any) => {
      let rooms = roomsByHotelId[hotel._id] || [];
      const margin = Number(hotel.marginPercentage) || 0;
      rooms = rooms.map((r: any) => applyMarginToRoom(r, margin));
      
      // Calculate starting rate matching requested occupancy
      const validPrices: number[] = [];
      const fallbackPrices: number[] = [];
      rooms.forEach((r: any) => {
        const occPrice = getRoomPriceForOccupancy(r, occPerRoom);
        if (occPrice > 0) {
          validPrices.push(occPrice);
        }
        const fallback = Number(r.priceDouble) || Number(r.priceSingle) || Number(r.price) || Number(r.clientPrice) || 0;
        if (fallback > 0) fallbackPrices.push(fallback);
      });
      if (validPrices.length === 0 && fallbackPrices.length > 0) {
        validPrices.push(...fallbackPrices);
      }
      if (hotel.basePrice && Number(hotel.basePrice) > 0) {
        const baseNum = Number(hotel.basePrice);
        const baseWithMargin = margin > 0 ? Math.round(baseNum * (1 + margin / 100)) : baseNum;
        if (validPrices.length === 0) {
          validPrices.push(baseWithMargin);
        }
      }
      const startingPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

      // Calculate contracted B2B Net starting price for Partner Extranet view
      const rawRooms = roomsByHotelId[hotel._id] || [];
      const validB2BPrices: number[] = [];
      rawRooms.forEach((r: any) => {
        const b2b = Number(r.b2bPrice) || Number(r.priceSingle) || Number(r.priceDouble) || 0;
        if (b2b > 0) validB2BPrices.push(b2b);
      });
      if (hotel.basePrice && Number(hotel.basePrice) > 0) {
        validB2BPrices.push(Number(hotel.basePrice));
      }
      const startingB2BPrice = validB2BPrices.length > 0 ? Math.min(...validB2BPrices) : startingPrice;

      // Image fallback
      const roomImages = rooms.flatMap((r: any) => r.images || []).filter(Boolean);
      const hotelImages = (Array.isArray(hotel.images) && hotel.images.length > 0)
        ? hotel.images
        : roomImages;

      let baseAllocation = hotel.staybuddyAllocation 
        ? Number(hotel.staybuddyAllocation) 
        : rooms.reduce((sum: number, r: any) => sum + Number(r.staybuddyAllocation || 0) + Number(r.extraInventoryToday || 0), 0);
      let roomsLeft = baseAllocation;

      const hotelBookings = bookingsByHotelId[hotel._id] || [];
      let activeBookingsCount = 0;

      hotelBookings.forEach((b: any) => {
        const bCheckIn = new Date(b.checkIn).getTime();
        const bCheckOut = new Date(b.checkOut).getTime();
        
        let overlap = false;
        if (searchCheckIn && searchCheckOut) {
          const sCheckIn = new Date(searchCheckIn).getTime();
          const sCheckOut = new Date(searchCheckOut).getTime();
          if (bCheckIn < sCheckOut && bCheckOut > sCheckIn) {
            overlap = true;
          }
        } else {
          const today = Date.now();
          if (bCheckOut > today) overlap = true;
        }

        if (overlap) {
          activeBookingsCount += (b.rooms || 1);
        }
      });
      roomsLeft = Math.max(0, roomsLeft - activeBookingsCount);

      return { ...hotel, images: hotelImages, startingPrice, startingB2BPrice, roomsLeft };
    });

    const responsePayload = {
      hotels: hotelsWithPrices,
      total,
      page,
      pages: Math.ceil(total / limitParam),
    };

    setCached(cacheKey, responsePayload, 20);

    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=59',
      },
    });
  } catch (error) {
    console.error('Hotels GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, name, description, location, city, area, country, address, images, amenities, extraAmenities, propertyType, category, starRating, checkInTime, checkOutTime, policies, lat, lng, rooms, totalPropertyRooms, staybuddyAllocation, totalFloors, contactName, contactDesignation, contactPhone, contactEmail, transitHubs } = body;

    let finalPartnerId = partnerId;
    if (!finalPartnerId) {
      try {
        const session = await getServerSession(authOptions);
        finalPartnerId = (session?.user as any)?.id;
        if (!finalPartnerId && session?.user?.email) {
          const userSnap = await db.collection('users').where('email', '==', session.user.email).limit(1).get();
          if (!userSnap.empty) finalPartnerId = userSnap.docs[0].id;
        }
      } catch (e) {
        console.warn('Could not resolve server session:', e);
      }
    }

    if (!finalPartnerId && contactEmail) {
      try {
        const userSnap = await db.collection('users').where('email', '==', contactEmail).limit(1).get();
        if (!userSnap.empty) finalPartnerId = userSnap.docs[0].id;
      } catch (e) {}
    }

    const missing = [];
    if (!finalPartnerId) missing.push('partnerId (user session ID)');
    if (!name) missing.push('Property Name');
    if (!city) missing.push('City');
    if (!description) missing.push('Description');

    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
    }

    const coordinates = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;

    const hotelRef = db.collection('hotels').doc();
    const counterRef = db.collection('metadata').doc('counters');

    let hotelIdString = `SBHO-${Math.floor(Math.random() * 900) + 100}`;
    try {
      const counterPromise = db.runTransaction(async (t) => {
        const doc = await t.get(counterRef);
        let count = 1;
        if (doc.exists) {
          count = (doc.data()?.hotelCount || 0) + 1;
          t.update(counterRef, { hotelCount: count });
        } else {
          t.set(counterRef, { hotelCount: count });
        }
        return `SBHO-${count.toString().padStart(3, '0')}`;
      });
      // Safety timeout: 2000ms max
      hotelIdString = await Promise.race([
        counterPromise,
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
      ]);
    } catch (e) {
      console.warn('Hotel counter transaction skipped or timed out, used fallback ID:', hotelIdString);
    }

    // Ensure no oversized Base64 data URLs are saved into the hotel or room documents
    const sanitizeImage = async (img: string): Promise<string> => {
      if (typeof img === 'string' && img.startsWith('data:image/')) {
        try {
          const parts = img.split(';base64,');
          const contentType = parts[0].replace('data:', '') || 'image/jpeg';
          const base64Data = parts[1];
          if (base64Data) {
            const imgDoc = db.collection('hotel_images').doc();
            await imgDoc.set({
              data: base64Data,
              contentType,
              createdAt: new Date().toISOString()
            });
            return `/api/images/${imgDoc.id}`;
          }
        } catch (err) {
          console.warn('Failed to offload base64 image:', err);
        }
      }
      return img;
    };

    let finalHotelImages = Array.isArray(images) ? images.filter(Boolean) : [];
    if (finalHotelImages.length === 0 && rooms && Array.isArray(rooms)) {
      finalHotelImages = Array.from(new Set(rooms.flatMap((r: any) => Array.isArray(r.images) ? r.images : []).filter(Boolean)));
    }
    finalHotelImages = await Promise.all(finalHotelImages.map(sanitizeImage));

    const hotel = {
      _id: hotelRef.id,
      hotelId: hotelIdString,
      partnerId: finalPartnerId, 
      name, 
      description, 
      location, 
      city, 
      area, 
      country, 
      address, 
      coordinates, 
      images: finalHotelImages, 
      amenities, 
      extraAmenities, 
      propertyType: propertyType || 'Hotel', 
      category, 
      starRating, 
      checkInTime, 
      checkOutTime, 
      policies, 
      status: 'pending', 
      totalPropertyRooms, 
      staybuddyAllocation: staybuddyAllocation ? parseInt(staybuddyAllocation) : undefined, 
      totalFloors, 
      contactName, 
      contactDesignation, 
      contactPhone, 
      contactEmail, 
      partnerEmail: contactEmail || undefined,
      partnerPhone: contactPhone || undefined,
      partnerName: contactName || undefined, 
      transitHubs: transitHubs || undefined,
      avgRating: 0,
      totalReviews: 0,
      createdAt: new Date().toISOString()
    };

    await hotelRef.set(hotel);

    if (rooms && Array.isArray(rooms)) {
      const batch = db.batch();
      for (const r of rooms) {
        const roomRef = db.collection('rooms').doc();
        const sanitizedRoomImages = Array.isArray(r.images)
          ? await Promise.all(r.images.filter(Boolean).map(sanitizeImage))
          : [];

        batch.set(roomRef, {
          _id: roomRef.id,
          hotelId: hotelRef.id,
          type: r.type,
          description: r.description || `${r.type} at ${name}`,
          priceSingle: parseInt(r.priceSingle) || 0,
          priceDouble: parseInt(r.priceDouble) || parseInt(r.priceSingle) || 0,
          priceTriple: parseInt(r.priceTriple) || 0,
          b2bPrice: parseInt(r.b2bPrice) || 0,
          maxGuests: (parseInt(r.priceTriple) || 0) > 0 ? (parseInt(r.maxGuests) || 3) : 2,
          totalRooms: r.totalRooms !== undefined && r.totalRooms !== '' ? Math.max(0, parseInt(r.totalRooms, 10) || 0) : 0,
          staybuddyAllocation: r.staybuddyAllocation !== undefined && r.staybuddyAllocation !== ''
            ? Math.max(0, parseInt(r.staybuddyAllocation, 10) || 0)
            : (r.totalRooms !== undefined && r.totalRooms !== '' ? Math.max(0, parseInt(r.totalRooms, 10) || 0) : 0),
          ratePlan: r.ratePlan || 'EP',
          bedType: r.bedType || 'Double',
          size: r.size ? parseInt(r.size) : undefined,
          amenities: r.amenities || [],
          images: sanitizedRoomImages,
          isActive: true
        });
      }
      await batch.commit();
    }

    // Invalidate search and autocomplete caches so new hotel is instantly visible
    invalidateCache('hotels_search_');
    invalidateCache('approved_hotels_directory');

    return NextResponse.json({ hotel }, { status: 201 });
  } catch (error: any) {
    console.error('Hotels POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
