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
        const cheapestRoom = rooms.sort((a: any, b: any) => a.priceDouble - b.priceDouble)[0];
        let baseAllocation = hotel.staybuddyAllocation 
          ? Number(hotel.staybuddyAllocation) 
          : rooms.reduce((sum: number, r: any) => sum + Number(r.staybuddyAllocation || 0), 0);
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

        return { ...hotel, startingPrice: cheapestRoom?.priceSingle || cheapestRoom?.priceDouble, roomsLeft };
      })
    );

    return NextResponse.json({ hotels: hotelsWithPrices, total, page, pages: Math.ceil(total / limitParam) });
  } catch (error) {
    console.error('Hotels GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId, name, description, location, city, area, country, address, images, amenities, extraAmenities, propertyType, category, starRating, checkInTime, checkOutTime, policies, lat, lng, rooms, totalPropertyRooms, staybuddyAllocation, totalFloors, contactName, contactDesignation, contactPhone, contactEmail, providedRating } = body;

    const missing = [];
    if (!partnerId) missing.push('partnerId (user session ID)');
    if (!name) missing.push('Property Name');
    if (!city) missing.push('City');
    if (!description) missing.push('Description');

    if (missing.length > 0) {
      return NextResponse.json({ error: `Missing required fields: ${missing.join(', ')}` }, { status: 400 });
    }

    const coordinates = lat && lng ? { lat: parseFloat(lat), lng: parseFloat(lng) } : undefined;

    const hotelRef = db.collection('hotels').doc();
    const counterRef = db.collection('metadata').doc('counters');

    let hotelIdString = 'SBHO-001';
    try {
      await db.runTransaction(async (t) => {
        const doc = await t.get(counterRef);
        let count = 1;
        if (doc.exists) {
          count = (doc.data()?.hotelCount || 0) + 1;
          t.update(counterRef, { hotelCount: count });
        } else {
          t.set(counterRef, { hotelCount: count });
        }
        hotelIdString = `SBHO-${count.toString().padStart(3, '0')}`;
      });
    } catch (e) {
      console.error('Hotel counter transaction failed, falling back', e);
      hotelIdString = `SBHO-${Math.floor(Math.random() * 900) + 100}`;
    }

    const hotel = {
      _id: hotelRef.id,
      hotelId: hotelIdString,
      partnerId, name, description, location, city, area, country, address, coordinates, images, amenities, extraAmenities, propertyType: propertyType || 'Hotel', category, starRating, checkInTime, checkOutTime, policies, status: 'pending', totalPropertyRooms, staybuddyAllocation: staybuddyAllocation ? parseInt(staybuddyAllocation) : undefined, totalFloors, contactName, contactDesignation, contactPhone, contactEmail, avgRating: providedRating ? parseFloat(providedRating) : 0,
      createdAt: new Date().toISOString()
    };

    await hotelRef.set(hotel);

    if (rooms && Array.isArray(rooms)) {
      const batch = db.batch();
      for (const r of rooms) {
        const roomRef = db.collection('rooms').doc();
        batch.set(roomRef, {
          _id: roomRef.id,
          hotelId: hotelRef.id,
          type: r.type,
          description: r.description || `${r.type} at ${name}`,
          priceSingle: parseInt(r.priceSingle) || 0,
          priceDouble: parseInt(r.priceDouble) || parseInt(r.priceSingle) || 0,
          priceTriple: parseInt(r.priceTriple) || 0,
          b2bPrice: parseInt(r.b2bPrice) || 0,
          maxGuests: parseInt(r.maxGuests) || 2,
          totalRooms: parseInt(r.totalRooms) || 1,
          staybuddyAllocation: parseInt(r.staybuddyAllocation) || parseInt(r.totalRooms) || 1,
          ratePlan: r.ratePlan || 'EP',
          bedType: r.bedType || 'Double',
          size: r.size ? parseInt(r.size) : undefined,
          amenities: r.amenities || [],
          images: r.images || [],
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
