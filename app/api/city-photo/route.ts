import { NextRequest, NextResponse } from 'next/server';
import { CURATED_CITY_PHOTOS, normalizeCityName, DEFAULT_CITY_PHOTO } from '@/lib/cityPhotos';

export const dynamic = 'force-dynamic';

// Server-side in-memory cache to prevent redundant external API hits
const cityPhotoCache = new Map<string, string>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');

    if (!city || !city.trim()) {
      return NextResponse.json({ success: false, photo: DEFAULT_CITY_PHOTO });
    }

    const norm = normalizeCityName(city);

    // 1. Check in-memory server cache
    if (cityPhotoCache.has(norm)) {
      return NextResponse.json({
        success: true,
        city,
        photo: cityPhotoCache.get(norm),
        source: 'cache',
      });
    }

    // 2. Check Curated High-Res List
    if (CURATED_CITY_PHOTOS[norm]) {
      const url = CURATED_CITY_PHOTOS[norm].url;
      cityPhotoCache.set(norm, url);
      return NextResponse.json({
        success: true,
        city,
        photo: url,
        landmark: CURATED_CITY_PHOTOS[norm].landmark,
        source: 'curated',
      });
    }

    // 3. Smart Dynamic Resolution: Query Wikipedia PageImages API
    // Wikipedia API provides free, authenticated thumbnail images of cities worldwide
    try {
      const encodedCity = encodeURIComponent(city.trim());
      const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodedCity}&prop=pageimages&format=json&pithumbsize=600`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(wikiUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'StayBuddy-Travel-App/1.0 (https://staybuddy.in)',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const pages = data?.query?.pages;
        if (pages) {
          const firstPageId = Object.keys(pages)[0];
          const thumbnail = pages[firstPageId]?.thumbnail?.source;
          if (thumbnail && typeof thumbnail === 'string' && !thumbnail.includes('Flag_of') && !thumbnail.includes('Coat_of_arms')) {
            cityPhotoCache.set(norm, thumbnail);
            return NextResponse.json({
              success: true,
              city,
              photo: thumbnail,
              source: 'wikipedia-pageimage',
            });
          }
        }
      }

      // 4. Try Wikipedia Search Generator if exact title didn't match
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodedCity}%20city&prop=pageimages&pithumbsize=600&format=json`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'User-Agent': 'StayBuddy-Travel-App/1.0' },
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        const pages = searchData?.query?.pages;
        if (pages) {
          for (const pid of Object.keys(pages)) {
            const thumb = pages[pid]?.thumbnail?.source;
            if (thumb && !thumb.includes('Flag_of') && !thumb.includes('Coat_of_arms') && !thumb.includes('Map')) {
              cityPhotoCache.set(norm, thumb);
              return NextResponse.json({
                success: true,
                city,
                photo: thumb,
                source: 'wikipedia-search',
              });
            }
          }
        }
      }
    } catch (apiError) {
      console.warn(`Dynamic photo lookup error for ${city}:`, apiError);
    }

    // 5. Fallback to aesthetic travel photo
    cityPhotoCache.set(norm, DEFAULT_CITY_PHOTO);
    return NextResponse.json({
      success: true,
      city,
      photo: DEFAULT_CITY_PHOTO,
      source: 'default-fallback',
    });
  } catch (err: any) {
    console.error('Error in /api/city-photo:', err);
    return NextResponse.json({ success: false, photo: DEFAULT_CITY_PHOTO }, { status: 500 });
  }
}
