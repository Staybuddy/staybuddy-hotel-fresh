import HomeClient from '@/components/HomeClient';
import connectDB from '@/lib/mongodb';
import Hotel from '@/models/Hotel';
import Room from '@/models/Room';

export const revalidate = 60; // Cache and revalidate every 60 seconds

async function getFeaturedHotels() {
  try {
    await connectDB();
    const hotels = await Hotel.find({ status: 'approved' })
      .sort({ avgRating: -1, createdAt: -1 })
      .limit(6)
      .lean();

    const hotelsWithPrices = await Promise.all(
      hotels.map(async (hotel: any) => {
        const cheapestRoom = await Room.findOne({ hotelId: hotel._id, isActive: true })
          .sort({ priceDouble: 1 })
          .select('priceDouble priceSingle')
          .lean();
        
        return {
          ...hotel,
          startingPrice: cheapestRoom?.priceSingle || cheapestRoom?.priceDouble || null
        };
      })
    );
    
    // Ensure all ObjectIds and Dates are serialized for the Client Component
    return JSON.parse(JSON.stringify(hotelsWithPrices));
  } catch (error) {
    console.error('Failed to fetch featured hotels', error);
    return [];
  }
}

export default async function HomePage() {
  const initialHotels = await getFeaturedHotels();
  return <HomeClient initialHotels={initialHotels} />;
}
