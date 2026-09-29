import HomeClient from '@/components/HomeClient';
import { db } from '@/lib/firebaseAdmin';

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
        
        return {
          ...hotel,
          startingPrice: cheapestRoom?.priceSingle || cheapestRoom?.priceDouble || null
        };
      })
    );
    
    return hotelsWithPrices;
  } catch (error) {
    console.error('Failed to fetch featured hotels', error);
    return [];
  }
}

export default async function HomePage() {
  const initialHotels = await getFeaturedHotels();
  return <HomeClient initialHotels={initialHotels} />;
}
