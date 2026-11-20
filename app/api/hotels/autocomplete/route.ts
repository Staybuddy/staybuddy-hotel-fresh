import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebaseAdmin';
import { getCached, setCached } from '@/lib/cache';
import { calculateSmartScore } from '@/lib/smartSearch';

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
        const fallbackCities = POPULAR_FALLBACK_CITIES.filter(c => calculateSmartScore(q, c) >= 60);
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

    // Smart AI Hotel Matching (handles phonetic, typos, extra words like 'hotel', reverse order)
    const scoredHotels = (allHotels || [])
      .map((h: any) => {
        const nameScore = calculateSmartScore(q, h.name || '');
        const cityScore = calculateSmartScore(q, h.city || '');
        const areaScore = calculateSmartScore(q, h.area || '');
        const addressScore = calculateSmartScore(q, h.address || '');
        const maxScore = Math.max(nameScore, cityScore * 0.9, areaScore * 0.9, addressScore * 0.8);
        return { ...h, searchScore: maxScore };
      })
      .filter((h: any) => h.searchScore >= 60)
      .sort((a: any, b: any) => b.searchScore - a.searchScore)
      .slice(0, 8);

    const hotels = scoredHotels.map((h: any) => ({
      _id: h._id,
      name: h.name,
      city: h.city,
      isAiMatch: h.searchScore >= 70 && !h.name?.toLowerCase().includes(qLower),
    }));

    // Smart AI City Matching
    const candidateCities = Array.from(new Set([
      ...(allHotels || []).map((h: any) => h.city),
      ...(allHotels || []).map((h: any) => h.area),
      ...POPULAR_FALLBACK_CITIES,
    ].filter(Boolean)));

    const scoredCities = candidateCities
      .map((c: string) => ({ city: c, score: calculateSmartScore(q, c) }))
      .filter((c: any) => c.score >= 60)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 5)
      .map((c: any) => c.city);

    return NextResponse.json({ 
      hotels, 
      cities: scoredCities 
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
