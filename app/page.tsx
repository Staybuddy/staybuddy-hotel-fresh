import HomeClient from '@/components/HomeClient';
import { db } from '@/lib/firebaseAdmin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const revalidate = 60; // Cache and revalidate every 60 seconds

async function getFeaturedHotels() {
  try {
    const hotelsSnap = await db.collection('hotels').where('status', '==', 'approved').get();
    let hotels = hotelsSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }) as any);
    hotels.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    hotels = hotels.slice(0, 6);

    const hotelsWithPrices = await Promise.all(
      hotels.map(async (hotel: any) => {
        const roomsSnap = await db.collection('rooms').where('hotelId', '==', hotel._id).where('isActive', '==', true).get();
        const rooms = roomsSnap.docs.map(doc => doc.data());
        rooms.sort((a: any, b: any) => (a.priceDouble || 0) - (b.priceDouble || 0));
        const cheapestRoom = rooms[0];
        let roomsLeft = rooms.reduce((sum: number, r: any) => sum + (r.staybuddyAllocation || 0), 0);

        try {
          const bookingsSnap = await db.collection('bookings')
            .where('hotelId', '==', hotel._id)
            .get();
          
          const today = new Date();
          let activeBookingsCount = 0;

          bookingsSnap.docs.forEach((doc: any) => {
            const b = doc.data();
            if (b.status !== 'cancelled' && b.status !== 'completed') {
              const bCheckOut = new Date(b.checkOut);
              if (bCheckOut > today) {
                activeBookingsCount += (b.rooms || 1);
              }
            }
          });

          roomsLeft = Math.max(0, roomsLeft - activeBookingsCount);
        } catch (e) {
          console.error('Error fetching bookings for availability', e);
        }
        
        return {
          ...hotel,
          startingPrice: cheapestRoom?.priceSingle || cheapestRoom?.priceDouble || null,
          roomsLeft
        };
      })
    );
    
    return hotelsWithPrices;
  } catch (error) {
    console.error('Failed to fetch featured hotels', error);
    return [];
  }
}

async function getRecentReviews() {
  try {
    const reviewsSnap = await db.collection('reviews').get();
    
    let allReviews = reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))
      .filter((r: any) => r.status === 'approved')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6);
    
    return Promise.all(allReviews.map(async (data: any) => {
      let customerName = data.guestName || 'Anonymous';
      let hotelName = 'StayBuddy Hotel';
      
      // Fetch hotel name
      if (data.hotelId) {
        const hDoc = await db.collection('hotels').doc(data.hotelId).get();
        if (hDoc.exists) hotelName = hDoc.data()?.name || hotelName;
      }
      
      return {
        _id: doc.id,
        rating: data.rating || 5,
        title: data.title || 'Great stay!',
        comment: data.comment || '',
        customerName,
        hotelName,
        createdAt: data.createdAt
      };
    }));
  } catch (error) {
    console.error('Failed to fetch recent reviews', error);
    return [];
  }
}

export default async function HomePage() {
  const initialHotels = await getFeaturedHotels();
  const recentReviews = await getRecentReviews();
  
  let wishlistIds: string[] = [];
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const userDoc = await db.collection('users').doc(session.user.id).get();
      if (userDoc.exists) {
        wishlistIds = userDoc.data()?.wishlist || [];
      }
    }
  } catch(e) {
    console.error('Failed to get user wishlist', e);
  }

  return <HomeClient initialHotels={initialHotels} recentReviews={recentReviews} userWishlistIds={wishlistIds} />;
}
