import { NextResponse } from 'next/server';
import { 
  TRANSIT_DATABASE, 
  TransitPoint, 
  haversineDistanceKm, 
  detectCityFromCoordinates, 
  CITIES_WITH_METRO 
} from '@/lib/transitHubs';

function estimateTravelTimeMins(distanceKm: number, type: string): number {
  // City driving speeds: 20-25 km/h for inner city, 40-50 km/h for highways/airport
  const speed = type === 'airport' ? 40 : 25;
  const mins = Math.round((distanceKm / speed) * 60);
  return Math.max(5, mins);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name = '',
      propertyType = 'Hotel',
      starRating = '3',
      category = 'standard',
      totalPropertyRooms = '',
      city = '',
      area = '',
      address = '',
      lat: inputLat,
      lng: inputLng,
      amenities = [],
      extraAmenities = ''
    } = body;

    let latitude = parseFloat(String(inputLat || ''));
    let longitude = parseFloat(String(inputLng || ''));
    let detectedCity = city || '';
    let detectedArea = area || '';

    const hasCoordinates = !isNaN(latitude) && !isNaN(longitude) && (latitude !== 0 || longitude !== 0);

    // 1. Instantly detect city from coordinates if available
    if (hasCoordinates) {
      const fromCoords = detectCityFromCoordinates(latitude, longitude);
      if (fromCoords && !detectedCity) {
        detectedCity = fromCoords;
      }
    }

    // 2. If coordinates are valid, optionally reverse geocode if city or area is missing
    if (hasCoordinates && (!detectedCity || !detectedArea)) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          {
            signal: controller.signal,
            headers: {
              'User-Agent': 'StayBuddy-Extranet-AI/1.0 (contact@staybuddy.in)'
            }
          }
        );
        clearTimeout(timeout);
        if (geoRes.ok) {
          const geoData = await geoRes.json();
          const addr = geoData.address || {};
          if (!detectedCity) {
            detectedCity = addr.city || addr.town || addr.municipality || addr.state_district || '';
          }
          if (!detectedArea) {
            detectedArea = addr.suburb || addr.neighbourhood || addr.residential || addr.county || '';
          }
        }
      } catch {
        // Geocode fallback - silent continue
      }
    }

    // 3. Filter candidate points strictly by city
    let candidatePoints = TRANSIT_DATABASE;
    if (detectedCity) {
      const cityMatches = TRANSIT_DATABASE.filter(
        p => p.city && p.city.toLowerCase() === detectedCity.toLowerCase()
      );
      if (cityMatches.length > 0) {
        candidatePoints = cityMatches;
        // If no coordinates were provided, estimate coordinates from first match
        if (!hasCoordinates && cityMatches[0]) {
          latitude = cityMatches[0].lat + 0.02;
          longitude = cityMatches[0].lng + 0.02;
        }
      }
    }

    const cityLower = (detectedCity || '').toLowerCase().trim();
    const isMetroCity = CITIES_WITH_METRO.has(cityLower);

    // Calculate nearest points with strict maximum radius to avoid cross-city glitches
    const findNearest = (type: TransitPoint['type'], maxAllowedKm: number) => {
      let nearest: (TransitPoint & { distanceKm: number; durationMins: number }) | null = null;
      let minDistance = Infinity;

      for (const p of candidatePoints) {
        if (p.type === type) {
          const dist = hasCoordinates
            ? haversineDistanceKm(latitude, longitude, p.lat, p.lng)
            : 4.5;
          if (dist <= maxAllowedKm && dist < minDistance) {
            minDistance = dist;
            nearest = {
              ...p,
              distanceKm: dist,
              durationMins: estimateTravelTimeMins(dist, type)
            };
          }
        }
      }

      // Check national database ONLY within strict maximum radius
      if (!nearest && hasCoordinates) {
        for (const p of TRANSIT_DATABASE) {
          if (p.type === type) {
            const dist = haversineDistanceKm(latitude, longitude, p.lat, p.lng);
            if (dist <= maxAllowedKm && dist < minDistance) {
              minDistance = dist;
              nearest = {
                ...p,
                distanceKm: dist,
                durationMins: estimateTravelTimeMins(dist, type)
              };
            }
          }
        }
      }

      return nearest;
    };

    const nearestRailway = findNearest('railway', 35);
    const nearestBus = findNearest('bus', 30);
    const nearestAirport = findNearest('airport', 65);
    
    // Only search for metro if this city actually has an active metro network
    let nearestMetroOrLandmark: (TransitPoint & { distanceKm: number; durationMins: number }) | null = null;
    if (isMetroCity) {
      nearestMetroOrLandmark = findNearest('metro', 25);
    }
    if (!nearestMetroOrLandmark) {
      nearestMetroOrLandmark = findNearest('landmark', 25);
    }
    // Specific Vijayawada fallback requested by user: SS Convention Centre
    if (!nearestMetroOrLandmark && cityLower.includes('vijayawada')) {
      const ssConv = TRANSIT_DATABASE.find(p => p.name.includes('SS Convention'));
      if (ssConv) {
        const dist = hasCoordinates ? haversineDistanceKm(latitude, longitude, ssConv.lat, ssConv.lng) : 2.5;
        nearestMetroOrLandmark = {
          ...ssConv,
          distanceKm: dist,
          durationMins: estimateTravelTimeMins(dist, 'landmark')
        };
      }
    }

    // Build Formatted Location Bullet Points Description
    const locationBullets: string[] = [];
    if (nearestRailway) {
      locationBullets.push(`• ${nearestRailway.distanceKm} km from ${nearestRailway.name} (approx. ${nearestRailway.durationMins} mins)`);
    }
    if (nearestBus) {
      locationBullets.push(`• ${nearestBus.distanceKm} km from ${nearestBus.name} (approx. ${nearestBus.durationMins} mins)`);
    }
    if (nearestAirport) {
      locationBullets.push(`• ${nearestAirport.distanceKm} km from ${nearestAirport.name} (approx. ${nearestAirport.durationMins} mins)`);
    }
    if (nearestMetroOrLandmark) {
      locationBullets.push(`• ${nearestMetroOrLandmark.distanceKm} km from ${nearestMetroOrLandmark.name}`);
    }

    const localityStr = [detectedArea, detectedCity].filter(Boolean).join(', ') || 'prime location';
    locationBullets.push(`• Strategically located in ${localityStr} with swift connectivity to key commercial hubs and dining centers.`);

    const generatedLocationDescription = locationBullets.join('\n');

    // Build Hotel Property Description tailored to standard and star category
    const starNum = parseInt(String(starRating || '3'), 10) || 3;
    const propertyTitle = name.trim() || 'Our Property';
    const roomCountStr = totalPropertyRooms ? `${totalPropertyRooms} well-appointed rooms` : 'modern and comfortable rooms';
    
    // Pick amenities to highlight
    const keyAmenities = Array.isArray(amenities) && amenities.length > 0 
      ? amenities.slice(0, 5).join(', ')
      : 'Complimentary High-Speed WiFi, Air Conditioning, 24/7 Room Service, and Daily Housekeeping';

    let standardIntro = '';
    let standardTagline = '';

    if (starNum >= 5) {
      standardIntro = `Experience unmatched 5-star luxury and world-class hospitality at ${propertyTitle}, a premier ${propertyType.toLowerCase()} nestled in the heart of ${localityStr}. Offering ${roomCountStr}, our property blends timeless architectural elegance with bespoke contemporary indulgence.`;
      standardTagline = `Whether visiting for international business, leisure escapes, or private celebrations, guests are treated to signature dining, personalized concierge support, and refined tranquility.`;
    } else if (starNum === 4) {
      standardIntro = `Discover contemporary elegance and superior comfort at ${propertyTitle}, an upscale 4-star ${propertyType.toLowerCase()} located in ${localityStr}. Featuring ${roomCountStr}, the hotel is thoughtfully crafted to cater to discerning corporate leaders and vacationing families alike.`;
      standardTagline = `With premium conveniences, versatile event spaces, and dedicated hospitality, we ensure every stay is seamless, relaxing, and productive.`;
    } else if (starNum === 3) {
      standardIntro = `Welcome to ${propertyTitle}, a contemporary 3-star ${propertyType.toLowerCase()} providing ${roomCountStr} in prime ${localityStr}. Ideal for business executives, transit travelers, and families, we offer quality accommodations with genuine warmth and reliability.`;
      standardTagline = `Relax in clean, modern spaces equipped with essential amenities, backed by verified StayBuddy hygiene and comfort standards.`;
    } else {
      standardIntro = `Welcome to ${propertyTitle}, a smart, budget-friendly ${propertyType.toLowerCase()} offering ${roomCountStr} in ${localityStr}. Specially designed for value-conscious travelers who prioritize safety, pristine hygiene, and prime accessibility.`;
      standardTagline = `Enjoy hassle-free lodging, comfortable bedding, prompt assistance, and unbeatable convenience without compromising on quality.`;
    }

    // Clean property description without transit sentences baked in (distances are rendered in their own dedicated visual card)
    const generatedPropertyDescription = `${standardIntro}\n\nGuests enjoy an array of modern amenities including ${keyAmenities}.${extraAmenities ? ` Additionally, ${extraAmenities}.` : ''} ${standardTagline}`;

    return NextResponse.json({
      success: true,
      detectedCity,
      detectedArea,
      transitHubs: {
        railway: nearestRailway,
        bus: nearestBus,
        airport: nearestAirport,
        metroOrLandmark: nearestMetroOrLandmark
      },
      locationDescription: generatedLocationDescription,
      propertyDescription: generatedPropertyDescription
    });
  } catch (error: any) {
    console.error('AI Description API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to auto-generate location distances & description' },
      { status: 500 }
    );
  }
}
