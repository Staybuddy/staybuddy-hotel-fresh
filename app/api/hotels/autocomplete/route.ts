import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebaseAdmin';
import { getCached, setCached } from '@/lib/cache';

const POPULAR_FALLBACK_CITIES = [
  'Mumbai', 'Goa', 'Delhi', 'Jaipur', 'Manali', 'Kerala', 'Hyderabad',
  'Bangalore', 'Udaipur', 'Ooty', 'Agra', 'Varanasi', 'Amritsar', 'Chennai',
  'Kolkata', 'Pune', 'Shimla'
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');

    if (!q || q.length < 2) {
      return NextResponse.json({ hotels: [], cities: [] });
    }

    const qLower = q.toLowerCase();

    // Ultra-fast memory cache (60s TTL): Avoids querying Firestore on every single keystroke
    const CACHE_KEY = 'approved_hotels_directory';
    let allHotels = getCached<any[]>(CACHE_KEY);

    if (!allHotels) {
      try {
        const hotelsSnap = await db.collection('hotels').where('status', '==', 'approved').get();
        allHotels = hotelsSnap.docs
          .filter(doc => doc.data()?.isBlocked !== true)
          .map(doc => {
            const data = doc.data();
            return {
              _id: doc.id,
              name: data.name || '',
              city: data.city || '',
              area: data.area || '',
              address: data.address || '',
            };
          });
        setCached(CACHE_KEY, allHotels, 60);
      } catch (dbError) {
        console.warn('Firestore autocomplete fallback engaged:', dbError);
        const fallbackCities = POPULAR_FALLBACK_CITIES.filter(c => c.toLowerCase().includes(qLower));
        return NextResponse.json({
          hotels: [],
          cities: fallbackCities.slice(0, 5)
        }, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
          }
        });
      }
    }

    const matchedHotels = (allHotels || []).filter((h: any) => 
      h.name?.toLowerCase().includes(qLower) || 
      h.city?.toLowerCase().includes(qLower) || 
      h.area?.toLowerCase().includes(qLower) || 
      h.address?.toLowerCase().includes(qLower)
    ).slice(0, 8);

    const hotels = matchedHotels.map((h: any) => ({ _id: h._id, name: h.name, city: h.city }));
    
    const cityMatches = (allHotels || []).filter((h: any) => h.city?.toLowerCase().includes(qLower)).map((h: any) => h.city);
    const areaMatches = (allHotels || []).filter((h: any) => h.area?.toLowerCase().includes(qLower)).map((h: any) => h.area);
    
    const allLocations = [...cityMatches, ...areaMatches];
    POPULAR_FALLBACK_CITIES.forEach(c => {
      if (c.toLowerCase().includes(qLower)) allLocations.push(c);
    });
    const uniqueLocations = Array.from(new Set(allLocations.filter(Boolean)));

    return NextResponse.json({ 
      hotels, 
      cities: uniqueLocations.slice(0, 5) 
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    console.error('Autocomplete GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
