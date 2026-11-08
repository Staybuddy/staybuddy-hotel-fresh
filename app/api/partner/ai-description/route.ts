import { NextResponse } from 'next/server';

interface TransitPoint {
  name: string;
  type: 'railway' | 'bus' | 'airport' | 'metro' | 'landmark';
  lat: number;
  lng: number;
  city?: string;
}

// Comprehensive database of major Indian transit hubs and landmarks
const TRANSIT_DATABASE: TransitPoint[] = [
  // --- HYDERABAD ---
  { name: 'Secunderabad Railway Station', type: 'railway', lat: 17.4344, lng: 78.5015, city: 'Hyderabad' },
  { name: 'Hyderabad Deccan Railway Station (Nampally)', type: 'railway', lat: 17.3924, lng: 78.4697, city: 'Hyderabad' },
  { name: 'Kacheguda Railway Station', type: 'railway', lat: 17.3916, lng: 78.4975, city: 'Hyderabad' },
  { name: 'Lingampally Railway Station', type: 'railway', lat: 17.4883, lng: 78.3186, city: 'Hyderabad' },
  { name: 'MGBS Central Bus Station (Imlibun)', type: 'bus', lat: 17.3789, lng: 78.4842, city: 'Hyderabad' },
  { name: 'JBS Central Bus Station (Jubilee)', type: 'bus', lat: 17.4503, lng: 78.4998, city: 'Hyderabad' },
  { name: 'Rajiv Gandhi International Airport (HYD)', type: 'airport', lat: 17.2403, lng: 78.4294, city: 'Hyderabad' },
  { name: 'Ameerpet Metro Interchange', type: 'metro', lat: 17.4375, lng: 78.4482, city: 'Hyderabad' },
  { name: 'Hitec City / Cyber Towers Corridor', type: 'landmark', lat: 17.4504, lng: 78.3808, city: 'Hyderabad' },

  // --- MUMBAI & NAVI MUMBAI ---
  { name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', type: 'railway', lat: 18.9401, lng: 72.8354, city: 'Mumbai' },
  { name: 'Mumbai Central Railway Station', type: 'railway', lat: 18.9696, lng: 72.8193, city: 'Mumbai' },
  { name: 'Bandra Terminus', type: 'railway', lat: 19.0560, lng: 72.8428, city: 'Mumbai' },
  { name: 'Dadar Junction', type: 'railway', lat: 19.0178, lng: 72.8478, city: 'Mumbai' },
  { name: 'Lokmanya Tilak Terminus (Kurla LTT)', type: 'railway', lat: 19.0699, lng: 72.8906, city: 'Mumbai' },
  { name: 'Mumbai Central MSRTC Bus Depot', type: 'bus', lat: 18.9702, lng: 72.8189, city: 'Mumbai' },
  { name: 'Borivali MSRTC Central Bus Depot', type: 'bus', lat: 19.2291, lng: 72.8569, city: 'Mumbai' },
  { name: 'Chhatrapati Shivaji Maharaj International Airport (BOM)', type: 'airport', lat: 19.0896, lng: 72.8656, city: 'Mumbai' },
  { name: 'Bandra-Kurla Complex (BKC) Business Hub', type: 'landmark', lat: 19.0657, lng: 72.8687, city: 'Mumbai' },
  { name: 'Andheri Metro Interchange', type: 'metro', lat: 19.1197, lng: 72.8468, city: 'Mumbai' },

  // --- BANGALORE (BENGALURU) ---
  { name: 'KSR Bengaluru City Railway Station (Majestic)', type: 'railway', lat: 12.9784, lng: 77.5694, city: 'Bangalore' },
  { name: 'Yesvantpur Junction Railway Station', type: 'railway', lat: 13.0238, lng: 77.5503, city: 'Bangalore' },
  { name: 'Bengaluru Cantt Railway Station', type: 'railway', lat: 12.9936, lng: 77.5985, city: 'Bangalore' },
  { name: 'KR Puram Railway Station', type: 'railway', lat: 13.0016, lng: 77.6775, city: 'Bangalore' },
  { name: 'Kempegowda Bus Station (Majestic KSRTC)', type: 'bus', lat: 12.9774, lng: 77.5713, city: 'Bangalore' },
  { name: 'Shantinagar BMTC / KSRTC Bus Station', type: 'bus', lat: 12.9542, lng: 77.5925, city: 'Bangalore' },
  { name: 'Kempegowda International Airport (BLR)', type: 'airport', lat: 13.1986, lng: 77.7066, city: 'Bangalore' },
  { name: 'MG Road Metro Station & Central Hub', type: 'metro', lat: 12.9756, lng: 77.6066, city: 'Bangalore' },
  { name: 'Whitefield IT Corridor', type: 'landmark', lat: 12.9698, lng: 77.7500, city: 'Bangalore' },

  // --- DELHI / NCR ---
  { name: 'New Delhi Railway Station (NDLS)', type: 'railway', lat: 28.6427, lng: 77.2199, city: 'Delhi' },
  { name: 'Old Delhi Railway Station (DLI)', type: 'railway', lat: 28.6609, lng: 77.2289, city: 'Delhi' },
  { name: 'Hazrat Nizamuddin Railway Station (NZM)', type: 'railway', lat: 28.5888, lng: 77.2534, city: 'Delhi' },
  { name: 'Anand Vihar Railway Terminal (ANVT)', type: 'railway', lat: 28.6471, lng: 77.3157, city: 'Delhi' },
  { name: 'Maharana Pratap ISBT (Kashmere Gate)', type: 'bus', lat: 28.6669, lng: 77.2294, city: 'Delhi' },
  { name: 'Swami Vivekanand ISBT (Anand Vihar)', type: 'bus', lat: 28.6483, lng: 77.3159, city: 'Delhi' },
  { name: 'Sarai Kale Khan ISBT', type: 'bus', lat: 28.5908, lng: 77.2559, city: 'Delhi' },
  { name: 'Indira Gandhi International Airport (DEL)', type: 'airport', lat: 28.5562, lng: 77.1000, city: 'Delhi' },
  { name: 'Rajiv Chowk (Connaught Place) Metro Interchange', type: 'metro', lat: 28.6328, lng: 77.2197, city: 'Delhi' },
  { name: 'DLF Cyber City Business Hub (Gurugram)', type: 'landmark', lat: 28.4952, lng: 77.0891, city: 'Delhi' },

  // --- CHENNAI ---
  { name: 'Chennai Central Railway Station (Puratchi Thalaivar Dr. MGR)', type: 'railway', lat: 13.0827, lng: 80.2754, city: 'Chennai' },
  { name: 'Chennai Egmore Railway Station', type: 'railway', lat: 13.0784, lng: 80.2612, city: 'Chennai' },
  { name: 'Tambaram Railway Station', type: 'railway', lat: 12.9250, lng: 80.1170, city: 'Chennai' },
  { name: 'Koyambedu CMBT Bus Terminus', type: 'bus', lat: 13.0673, lng: 80.1916, city: 'Chennai' },
  { name: 'Kilambakkam KCBT Bus Terminus', type: 'bus', lat: 12.8655, lng: 80.0805, city: 'Chennai' },
  { name: 'Chennai International Airport (MAA)', type: 'airport', lat: 12.9941, lng: 80.1709, city: 'Chennai' },
  { name: 'T. Nagar Commercial Shopping Hub', type: 'landmark', lat: 13.0418, lng: 80.2341, city: 'Chennai' },

  // --- KOLKATA ---
  { name: 'Howrah Junction Railway Station', type: 'railway', lat: 22.5830, lng: 88.3426, city: 'Kolkata' },
  { name: 'Sealdah Railway Station', type: 'railway', lat: 22.5675, lng: 88.3711, city: 'Kolkata' },
  { name: 'Esplanade Central Bus Terminus', type: 'bus', lat: 22.5658, lng: 88.3516, city: 'Kolkata' },
  { name: 'Netaji Subhash Chandra Bose International Airport (CCU)', type: 'airport', lat: 22.6547, lng: 88.4467, city: 'Kolkata' },
  { name: 'Park Street Dining & Cultural Hub', type: 'landmark', lat: 22.5511, lng: 88.3524, city: 'Kolkata' },

  // --- PUNE ---
  { name: 'Pune Junction Railway Station', type: 'railway', lat: 18.5284, lng: 73.8744, city: 'Pune' },
  { name: 'Shivajinagar Railway Station', type: 'railway', lat: 18.5326, lng: 73.8529, city: 'Pune' },
  { name: 'Swargate Central Bus Station', type: 'bus', lat: 18.5008, lng: 73.8584, city: 'Pune' },
  { name: 'Pune International Airport (PNQ)', type: 'airport', lat: 18.5822, lng: 73.9197, city: 'Pune' },
  { name: 'Hinjawadi IT Park Hub', type: 'landmark', lat: 18.5913, lng: 73.7389, city: 'Pune' },

  // --- GOA ---
  { name: 'Madgaon Junction Railway Station (MAO)', type: 'railway', lat: 15.2736, lng: 73.9723, city: 'Goa' },
  { name: 'Thivim Railway Station (THVM)', type: 'railway', lat: 15.6267, lng: 73.8525, city: 'Goa' },
  { name: 'Karmali Railway Station', type: 'railway', lat: 15.4894, lng: 73.9213, city: 'Goa' },
  { name: 'Panaji KTC Central Bus Stand', type: 'bus', lat: 15.4989, lng: 73.8340, city: 'Goa' },
  { name: 'Margao KTC Bus Stand', type: 'bus', lat: 15.2832, lng: 73.9628, city: 'Goa' },
  { name: 'Manohar International Airport (MOPA / GOX)', type: 'airport', lat: 15.7667, lng: 73.8667, city: 'Goa' },
  { name: 'Dabolim Airport (GOI)', type: 'airport', lat: 15.3808, lng: 73.8314, city: 'Goa' },
  { name: 'Calangute / Baga Coastal Beach Promenade', type: 'landmark', lat: 15.5440, lng: 73.7553, city: 'Goa' },

  // --- JAIPUR ---
  { name: 'Jaipur Junction Railway Station', type: 'railway', lat: 26.9200, lng: 75.7878, city: 'Jaipur' },
  { name: 'Sindhi Camp Central Bus Stand', type: 'bus', lat: 26.9238, lng: 75.8016, city: 'Jaipur' },
  { name: 'Jaipur International Airport (JAI)', type: 'airport', lat: 26.8242, lng: 75.8122, city: 'Jaipur' },
  { name: 'Hawa Mahal & Old Pink City Heritage Center', type: 'landmark', lat: 26.9239, lng: 75.8267, city: 'Jaipur' },

  // --- AHMEDABAD ---
  { name: 'Ahmedabad Junction Railway Station (Kalupur)', type: 'railway', lat: 23.0232, lng: 72.6009, city: 'Ahmedabad' },
  { name: 'Geeta Mandir Central Bus Station', type: 'bus', lat: 23.0135, lng: 72.5878, city: 'Ahmedabad' },
  { name: 'Sardar Vallabhbhai Patel International Airport (AMD)', type: 'airport', lat: 23.0772, lng: 72.6347, city: 'Ahmedabad' },
  { name: 'SG Highway Commercial Corridor', type: 'landmark', lat: 23.0483, lng: 72.5186, city: 'Ahmedabad' },

  // --- KOCHI / ERNAKULAM ---
  { name: 'Ernakulam Junction South Railway Station', type: 'railway', lat: 9.9678, lng: 76.2917, city: 'Kochi' },
  { name: 'KSRTC Central Bus Station (Ernakulam)', type: 'bus', lat: 9.9728, lng: 76.2872, city: 'Kochi' },
  { name: 'Cochin International Airport (COK)', type: 'airport', lat: 10.1557, lng: 76.3905, city: 'Kochi' },
  { name: 'Marine Drive Waterfront Promenade', type: 'landmark', lat: 9.9806, lng: 76.2755, city: 'Kochi' },

  // --- LUCKNOW ---
  { name: 'Lucknow Charbagh Railway Station (LKO)', type: 'railway', lat: 26.8322, lng: 80.9230, city: 'Lucknow' },
  { name: 'Alambagh Central ISBT Bus Station', type: 'bus', lat: 26.8152, lng: 80.9022, city: 'Lucknow' },
  { name: 'Chaudhary Charan Singh International Airport (LKO)', type: 'airport', lat: 26.7606, lng: 80.8893, city: 'Lucknow' },

  // --- VARANASI ---
  { name: 'Varanasi Junction (Cantonment) Station', type: 'railway', lat: 25.3268, lng: 82.9863, city: 'Varanasi' },
  { name: 'Varanasi Cantt Central Bus Stand', type: 'bus', lat: 25.3274, lng: 82.9845, city: 'Varanasi' },
  { name: 'Lal Bahadur Shastri International Airport (VNS)', type: 'airport', lat: 25.4524, lng: 82.8590, city: 'Varanasi' },

  // --- CHANDIGARH ---
  { name: 'Chandigarh Junction Railway Station', type: 'railway', lat: 30.7022, lng: 76.8211, city: 'Chandigarh' },
  { name: 'ISBT Sector 43 Central Bus Terminal', type: 'bus', lat: 30.7188, lng: 76.7447, city: 'Chandigarh' },
  { name: 'Shaheed Bhagat Singh International Airport (IXC)', type: 'airport', lat: 30.6735, lng: 76.7885, city: 'Chandigarh' },

  // --- VISAKHAPATNAM ---
  { name: 'Visakhapatnam Junction Railway Station', type: 'railway', lat: 17.7214, lng: 83.2906, city: 'Visakhapatnam' },
  { name: 'Dwaraka Central RTC Bus Complex', type: 'bus', lat: 17.7268, lng: 83.3082, city: 'Visakhapatnam' },
  { name: 'Visakhapatnam International Airport (VTZ)', type: 'airport', lat: 17.7211, lng: 83.2245, city: 'Visakhapatnam' },

  // --- VIJAYAWADA ---
  { name: 'Vijayawada Junction Railway Station', type: 'railway', lat: 16.5186, lng: 80.6200, city: 'Vijayawada' },
  { name: 'Pandit Nehru Bus Station (PNBS)', type: 'bus', lat: 16.5086, lng: 80.6175, city: 'Vijayawada' },
  { name: 'Vijayawada International Airport (Gannavaram / VGA)', type: 'airport', lat: 16.5304, lng: 80.7968, city: 'Vijayawada' },

  // --- AGRA ---
  { name: 'Agra Cantt Railway Station', type: 'railway', lat: 27.1592, lng: 78.0068, city: 'Agra' },
  { name: 'ISBT Agra Central Bus Stand', type: 'bus', lat: 27.2096, lng: 77.9685, city: 'Agra' },
  { name: 'Agra Airport / Kheria Air Force Station (AGR)', type: 'airport', lat: 27.1558, lng: 77.9656, city: 'Agra' },

  // --- AMRITSAR ---
  { name: 'Amritsar Junction Railway Station', type: 'railway', lat: 31.6340, lng: 74.8723, city: 'Amritsar' },
  { name: 'Amritsar Central Bus Stand', type: 'bus', lat: 31.6262, lng: 74.8872, city: 'Amritsar' },
  { name: 'Sri Guru Ram Dass Jee International Airport (ATQ)', type: 'airport', lat: 31.7096, lng: 74.7973, city: 'Amritsar' }
];

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

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

    // If coordinates are valid, optionally reverse geocode if city or area is missing
    const hasCoordinates = !isNaN(latitude) && !isNaN(longitude) && (latitude !== 0 || longitude !== 0);

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

    // If coordinates are not provided, but city is provided, fallback to city's primary transit points
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

    // Calculate nearest points by type
    const findNearest = (type: TransitPoint['type']) => {
      let nearest: (TransitPoint & { distanceKm: number; durationMins: number }) | null = null;
      let minDistance = Infinity;

      for (const p of candidatePoints) {
        if (p.type === type) {
          const dist = hasCoordinates
            ? haversineDistanceKm(latitude, longitude, p.lat, p.lng)
            : 4.5; // reasonable standard default if no coordinates
          if (dist < minDistance) {
            minDistance = dist;
            nearest = {
              ...p,
              distanceKm: dist,
              durationMins: estimateTravelTimeMins(dist, type)
            };
          }
        }
      }

      // If no match in candidatePoints, search the entire national TRANSIT_DATABASE
      if (!nearest && hasCoordinates) {
        for (const p of TRANSIT_DATABASE) {
          if (p.type === type) {
            const dist = haversineDistanceKm(latitude, longitude, p.lat, p.lng);
            if (dist < minDistance) {
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

    const nearestRailway = findNearest('railway');
    const nearestBus = findNearest('bus');
    const nearestAirport = findNearest('airport');
    const nearestMetroOrLandmark = findNearest('metro') || findNearest('landmark');

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

