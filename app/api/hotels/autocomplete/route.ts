import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectDB from '@/lib/mongodb';
import Hotel from '@/models/Hotel';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ hotels: [], cities: [] });
    }

    const regex = new RegExp(q, 'i');

    // Find hotels matching name, city, or address
    const hotels = await Hotel.find({
      status: 'approved',
      $or: [
        { name: { $regex: regex } },
        { city: { $regex: regex } },
        { area: { $regex: regex } },
        { address: { $regex: regex } }
      ]
    })
      .select('_id name city')
      .limit(8)
      .lean();

    // Extract unique cities that match
    const cityMatches = await Hotel.distinct('city', {
      status: 'approved',
      city: { $regex: regex }
    });

    const areaMatches = await Hotel.distinct('area', {
      status: 'approved',
      area: { $regex: regex }
    });

    const allLocations = [...(cityMatches || []), ...(areaMatches || [])];
    const uniqueLocations = Array.from(new Set(allLocations.filter(Boolean)));

    return NextResponse.json({ 
      hotels: hotels || [], 
      cities: uniqueLocations.slice(0, 5) 
    });
  } catch (error) {
    console.error('Autocomplete GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
