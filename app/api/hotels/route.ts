import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status') || 'approved';
    const partnerId = searchParams.get('partnerId');
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const propertyType = searchParams.get('propertyType');
    const limitParam = parseInt(searchParams.get('limit') || '12');
    const searchCheckIn = searchParams.get('checkIn');
    const searchCheckOut = searchParams.get('checkOut');

    let hotelsRef: any = db.collection('hotels');
    
    if (status && status !== 'all') {
      hotelsRef = hotelsRef.where('status', '==', status);
    }
    if (partnerId) {
      hotelsRef = hotelsRef.where('partnerId', '==', partnerId);
    }
    if (category) hotelsRef = hotelsRef.where('category', '==', category);
    if (propertyType) hotelsRef = hotelsRef.where('propertyType', '==', propertyType);
    
    const snapshot = await hotelsRef.get();
    let hotels = snapshot.docs.map((doc: any) => ({ _id: doc.id, ...doc.data() }));

    // Apply memory filters for things Firestore can't do natively like regex
    if (city) {
      const cityLower = city.toLowerCase();
      hotels = hotels.filter((h: any) => h.city?.toLowerCase().includes(cityLower) || h.area?.toLowerCase().includes(cityLower));
    }

    if (status !== 'all') {
      hotels = hotels.filter((h: any) => h.isBlocked !== true);
    }

    hotels = hotels.sort((a: any, b: any) => (b.avgRating || 0) - (a.avgRating || 0));
    
    const page = parseInt(searchParams.get('page') || '1');
    const total = hotels.length;
    const skip = (page - 1) * limitParam;
    const paginatedHotels = hotels.slice(skip, skip + limitParam);

    // Attach starting prices
    const hotelsWithPrices = await Promise.all(
      paginatedHotels.map(async (hotel: any) => {
        const roomsSnap = await db.collection('rooms').where('hotelId', '==', hotel._id).get();
        const rooms = roomsSnap.docs.map((doc: any) => doc.data());
        
        // Calculate true minimum least rate among all room options
        const validPrices: number[] = [];
        rooms.forEach((r: any) => {
          [r.priceSingle, r.priceDouble, r.priceTriple, r.b2bPrice, r.pricePerNight].forEach(p => {
            const num = Number(p);
            if (!isNaN(num) && num > 0) validPrices.push(num);
          });
        });
        if (hotel.basePrice && Number(hotel.basePrice) > 0) {
          validPrices.push(Number(hotel.basePrice));
        }
        const startingPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

        // Image fallback: if hotel.images is empty, use any uploaded room images
        const roomImages = rooms.flatMap((r: any) => r.images || []).filter(Boolean);
        const hotelImages = (Array.isArray(hotel.images) && hotel.images.length > 0)
          ? hotel.images
          : roomImages;

        let baseAllocation = hotel.staybuddyAllocation 
          ? Number(hotel.staybuddyAllocation) 
          : rooms.reduce((sum: number, r: any) => sum + Number(r.staybuddyAllocation || 0) + Number(r.extraInventoryToday || 0), 0);
        let roomsLeft = baseAllocation;

        try {
          const bookingsSnap = await db.collection('bookings')
            .where('hotelId', '==', hotel._id)
            .get();
          
          let activeBookingsCount = 0;

          bookingsSnap.docs.forEach((doc: any) => {
            const b = doc.data();
            if (b.status === 'confirmed') {
              const bCheckIn = new Date(b.checkIn).getTime();
              const bCheckOut = new Date(b.checkOut).getTime();
              
              let overlap = false;
              if (searchCheckIn && searchCheckOut) {
                const sCheckIn = new Date(searchCheckIn).getTime();
                const sCheckOut = new Date(searchCheckOut).getTime();
                // Overlap: Booking starts before Search ends AND Booking ends after Search starts
                if (bCheckIn < sCheckOut && bCheckOut > sCheckIn) {
                  overlap = true;
                }
              } else {
                // If no dates specified, just check if it's currently active today
                const today = new Date().getTime();
                if (bCheckOut > today) overlap = true;
              }

              if (overlap) {
                activeBookingsCount += (b.rooms || 1);
              }
            }
          });
          roomsLeft = Math.max(0, roomsLeft - activeBookingsCount);
        } catch (e) {
          console.error('Error fetching bookings for availability', e);
        }

        return { ...hotel, images: hotelImages, startingPrice, roomsLeft };
      })
    );

    return NextResponse.json({ hotels: hotelsWithPrices, total, page, pages: Math.ceil(total / limitParam) });
  } catch (error) {
    console.error('Hotels GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, name, description, location, city, area, country, address, images, amenities, extraAmenities, propertyType, category, starRating, checkInTime, checkOutTime, policies, lat, lng, rooms, totalPropertyRooms, staybuddyAllocation, totalFloors, contactName, contactDesignation, contactPhone, contactEmail } = body;

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

    return NextResponse.json({ hotel }, { status: 201 });
  } catch (error: any) {
    console.error('Hotels POST error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
