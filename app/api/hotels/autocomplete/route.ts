import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ hotels: [], cities: [] });
    }

    const qLower = q.toLowerCase();
    const hotelsSnap = await db.collection('hotels').where('status', '==', 'approved').get();
    
    const allHotels = hotelsSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    
    const matchedHotels = allHotels.filter((h: any) => 
      h.name?.toLowerCase().includes(qLower) || 
      h.city?.toLowerCase().includes(qLower) || 
      h.area?.toLowerCase().includes(qLower) || 
      h.address?.toLowerCase().includes(qLower)
    ).slice(0, 8);

    const hotels = matchedHotels.map((h: any) => ({ _id: h._id, name: h.name, city: h.city }));
    
    const cityMatches = allHotels.filter((h: any) => h.city?.toLowerCase().includes(qLower)).map((h: any) => h.city);
    const areaMatches = allHotels.filter((h: any) => h.area?.toLowerCase().includes(qLower)).map((h: any) => h.area);
    
    const allLocations = [...cityMatches, ...areaMatches];
    const uniqueLocations = Array.from(new Set(allLocations.filter(Boolean)));

    return NextResponse.json({ 
      hotels, 
      cities: uniqueLocations.slice(0, 5) 
    });
  } catch (error) {
    console.error('Autocomplete GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
