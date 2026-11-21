import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebaseAdmin';
import { getCached, setCached } from '@/lib/cache';
import { calculateSmartScore, getSignificantTokens } from '@/lib/smartSearch';

const POPULAR_FALLBACK_CITIES = [
  'Vijayawada', 'Hyderabad', 'Chennai', 'Kerala'
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

    const qTokens = getSignificantTokens(q);

    // Smart AI Hotel Matching (handles phonetic, typos, extra words like 'hotel', reverse order)
    const scoredHotels = (allHotels || [])
      .map((h: any) => {
        const hName = (h.name || '').trim();
        const hCity = (h.city || '').trim();
        const hArea = (h.area || '').trim();
        const hAddress = (h.address || '').trim();

        const nameScore = calculateSmartScore(q, hName);
        const cityScore = calculateSmartScore(q, hCity);
        const areaScore = calculateSmartScore(q, hArea);
        const addressScore = calculateSmartScore(q, hAddress);

        let tokenBonus = 0;
        if (qTokens.length > 0) {
          const hCombined = `${hName} ${hCity} ${hArea} ${hAddress}`.toLowerCase();
          const matchesAll = qTokens.every(tok => hCombined.includes(tok));
          if (matchesAll) tokenBonus = 25;
        }

        const maxScore = Math.max(nameScore, cityScore * 0.9, areaScore * 0.9, addressScore * 0.8) + tokenBonus;
        return { ...h, name: hName, city: hCity, area: hArea, searchScore: maxScore };
      })
      .filter((h: any) => h.searchScore >= 75)
      .sort((a: any, b: any) => b.searchScore - a.searchScore)
      .slice(0, 8);

    const hotels = scoredHotels.map((h: any) => ({
      _id: h._id,
      name: h.name,
      city: h.city,
      isAiMatch: h.searchScore >= 75 && !h.name?.toLowerCase().includes(qLower),
    }));

    // Smart AI City Matching
    const candidateCities = Array.from(new Set([
      ...(allHotels || []).map((h: any) => (h.city || '').trim()),
      ...(allHotels || []).map((h: any) => (h.area || '').trim()),
      ...POPULAR_FALLBACK_CITIES,
    ].filter(Boolean)));

    const scoredCities = candidateCities
      .map((c: string) => {
        const cTrimmed = c.trim();
        let score = calculateSmartScore(q, cTrimmed);
        if (qTokens.length > 0 && qTokens.some(tok => cTrimmed.toLowerCase().includes(tok))) {
          score = Math.max(score, 75);
        }
        return { city: cTrimmed, score };
      })
      .filter((c: any) => c.score >= 75)
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
