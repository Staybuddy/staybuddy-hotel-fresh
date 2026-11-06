import HomeClient from '@/components/HomeClient';
import { db } from '@/lib/firebaseAdmin';
import { applyMarginToRoom, getRoomPriceForOccupancy } from '@/lib/occupancyPricing';

export const dynamic = 'force-dynamic';

async function getFeaturedHotels() {
  try {
    const hotelsSnap = await db.collection('hotels').where('status', '==', 'approved').get();
    let hotels = hotelsSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }) as any);
    hotels.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    hotels = hotels.slice(0, 6);
    const hotelIds = hotels.map((h: any) => h._id).filter(Boolean);

    // Batch-load rooms for all 6 featured hotels in 1 query
    const roomsByHotelId: Record<string, any[]> = {};
    if (hotelIds.length > 0) {
      try {
        const roomsSnap = await db.collection('rooms')
          .where('hotelId', 'in', hotelIds)
          .get();
        roomsSnap.docs.forEach((doc: any) => {
          const r = doc.data();
          if (r.isActive !== false && r.hotelId) {
            if (!roomsByHotelId[r.hotelId]) roomsByHotelId[r.hotelId] = [];
            roomsByHotelId[r.hotelId].push(r);
          }
        });
      } catch (e) {
        console.warn('Batch rooms error in getFeaturedHotels', e);
      }
    }

    // Batch-load active bookings for all 6 featured hotels in 1 query
    const bookingsByHotelId: Record<string, any[]> = {};
    if (hotelIds.length > 0) {
      try {
        const bookingsSnap = await db.collection('bookings')
          .where('hotelId', 'in', hotelIds)
          .get();
        bookingsSnap.docs.forEach((doc: any) => {
          const b = doc.data();
          if (b.status !== 'cancelled' && b.status !== 'completed' && b.hotelId) {
            if (!bookingsByHotelId[b.hotelId]) bookingsByHotelId[b.hotelId] = [];
            bookingsByHotelId[b.hotelId].push(b);
          }
        });
      } catch (e) {
        console.warn('Batch bookings error in getFeaturedHotels', e);
      }
    }

    const today = new Date();

    const hotelsWithPrices = hotels.map((hotel: any) => {
      const rooms = roomsByHotelId[hotel._id] || [];
      const margin = Number(hotel.marginPercentage) || 0;
      const roomsWithMargin = rooms.map((r: any) => applyMarginToRoom(r, margin));

      // Calculate true B2C starting rate with admin margin applied (default 2 adults / double occupancy)
      const validPrices: number[] = [];
      roomsWithMargin.forEach((r: any) => {
        const occPrice = getRoomPriceForOccupancy(r, 2);
        if (occPrice > 0) {
          validPrices.push(occPrice);
        } else {
          const pSingle = Number(r.priceSingle) || 0;
          const pFallback = Number(r.price) || Number(r.clientPrice) || 0;
          const price = pSingle > 0 ? pSingle : pFallback;
          if (price > 0) validPrices.push(price);
        }
      });
      if (hotel.basePrice && Number(hotel.basePrice) > 0) {
        const baseNum = Number(hotel.basePrice);
        const baseWithMargin = margin > 0 ? Math.round(baseNum * (1 + margin / 100)) : baseNum;
        validPrices.push(baseWithMargin);
      }
      const startingPrice = validPrices.length > 0 ? Math.min(...validPrices) : null;

      const roomImages = rooms.flatMap((r: any) => r.images || []).filter(Boolean);
      const hotelImages = (Array.isArray(hotel.images) && hotel.images.length > 0)
        ? hotel.images
        : roomImages;

      let roomsLeft = rooms.reduce((sum: number, r: any) => sum + (r.staybuddyAllocation || 0), 0);

      const hotelBookings = bookingsByHotelId[hotel._id] || [];
      let activeBookingsCount = 0;
      hotelBookings.forEach((b: any) => {
        const bCheckOut = new Date(b.checkOut);
        if (bCheckOut > today) {
          activeBookingsCount += (b.rooms || 1);
        }
      });
      roomsLeft = Math.max(0, roomsLeft - activeBookingsCount);

      return {
        ...hotel,
        images: hotelImages,
        startingPrice,
        roomsLeft
      };
    });
    
    return hotelsWithPrices;
  } catch (error) {
    console.error('Failed to fetch featured hotels', error);
    return [];
  }
}

async function getRecentReviews() {
  try {
    const reviewsSnap = await db.collection('reviews').get();
    
    const allReviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
    
    const dbReviews = await Promise.all(allReviews.map(async (data: any) => {
      const customerName = data.guestName || 'Anonymous';
      let hotelName = 'StayBuddy Hotel';
      
      // Fetch hotel name
      if (data.hotelId) {
        const hDoc = await db.collection('hotels').doc(data.hotelId).get();
        if (hDoc.exists) hotelName = hDoc.data()?.name || hotelName;
      }
      
      return {
        _id: data.id,
        rating: data.rating || 5,
        title: data.title || 'Great stay!',
        comment: data.comment || '',
        customerName,
        hotelName,
        createdAt: data.createdAt
      };
    }));

    if (dbReviews.length < 3) {
      const fallbackReviews = [
        {
          _id: 'rev-fb-1',
          rating: 5.0,
          title: 'Exceptional hospitality & clean rooms',
          comment: 'Check-in was lightning fast with StayBuddy voucher. Room was sparkling clean and AC worked perfectly.',
          customerName: 'Rahul Verma',
          hotelName: 'Hotel Pushpa grand',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'rev-fb-2',
          rating: 4.9,
          title: 'Prime transit stay in Shamshabad',
          comment: 'Booked directly through StayBuddy at best rate. Hassle-free check-in and very courteous front desk.',
          customerName: 'Priya Sundaram',
          hotelName: 'Pushpa Grand & Suites',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          _id: 'rev-fb-3',
          rating: 5.0,
          title: 'Best OTA booking experience',
          comment: 'Zero booking drops and WhatsApp voucher received immediately. Highly recommend StayBuddy!',
          customerName: 'Ankit Sharma',
          hotelName: 'StayBuddy Verified Hotel',
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ];
      return [...dbReviews, ...fallbackReviews.slice(0, 3 - dbReviews.length)];
    }

    return dbReviews;
  } catch (error) {
    console.error('Failed to fetch recent reviews', error);
    return [];
  }
}

export default async function HomePage() {
  const initialHotels = await getFeaturedHotels();
  const recentReviews = await getRecentReviews();
  
  return <HomeClient initialHotels={initialHotels} recentReviews={recentReviews} />;
}

// trigger vercel build
