export interface TransitPoint {
  name: string;
  type: 'railway' | 'bus' | 'airport' | 'metro' | 'landmark';
  lat: number;
  lng: number;
  city?: string;
}

export interface TransitItem {
  type: 'railway' | 'bus' | 'airport' | 'metro' | 'landmark';
  name: string;
  distanceKm: number;
  durationMins?: number;
  icon: string;
}

export interface TransitHubsResult {
  railway: TransitItem | null;
  bus: TransitItem | null;
  airport: TransitItem | null;
  metroOrLandmark: TransitItem | null;
}

// Known cities with bounding coordinates & maximum radius
export const CITY_COORDINATES: Array<{ city: string; lat: number; lng: number; radiusKm: number }> = [
  { city: 'Vijayawada', lat: 16.5062, lng: 80.6480, radiusKm: 35 },
  { city: 'Guntur', lat: 16.3067, lng: 80.4365, radiusKm: 30 },
  { city: 'Visakhapatnam', lat: 17.6868, lng: 83.2185, radiusKm: 40 },
  { city: 'Tirupati', lat: 13.6288, lng: 79.4192, radiusKm: 35 },
  { city: 'Rajahmundry', lat: 17.0005, lng: 81.8040, radiusKm: 35 },
  { city: 'Hyderabad', lat: 17.3850, lng: 78.4867, radiusKm: 60 },
  { city: 'Bangalore', lat: 12.9716, lng: 77.5946, radiusKm: 60 },
  { city: 'Chennai', lat: 13.0827, lng: 80.2707, radiusKm: 55 },
  { city: 'Mumbai', lat: 19.0760, lng: 72.8777, radiusKm: 60 },
  { city: 'Pune', lat: 18.5204, lng: 73.8567, radiusKm: 45 },
  { city: 'Delhi', lat: 28.6139, lng: 77.2090, radiusKm: 65 },
  { city: 'Kolkata', lat: 22.5726, lng: 88.3639, radiusKm: 45 },
  { city: 'Goa', lat: 15.2993, lng: 74.1240, radiusKm: 55 },
  { city: 'Jaipur', lat: 26.9124, lng: 75.7873, radiusKm: 45 },
  { city: 'Ahmedabad', lat: 23.0225, lng: 72.5714, radiusKm: 45 },
  { city: 'Kochi', lat: 9.9312, lng: 76.2673, radiusKm: 45 },
  { city: 'Varanasi', lat: 25.3176, lng: 82.9739, radiusKm: 40 },
  { city: 'Lucknow', lat: 26.8467, lng: 80.9462, radiusKm: 45 },
  { city: 'Chandigarh', lat: 30.7333, lng: 76.7794, radiusKm: 40 },
  { city: 'Agra', lat: 27.1767, lng: 78.0081, radiusKm: 35 },
  { city: 'Amritsar', lat: 31.6340, lng: 74.8723, radiusKm: 35 },
];

export const CITIES_WITH_METRO = new Set([
  'delhi', 'ncr', 'mumbai', 'bangalore', 'bengaluru', 'hyderabad', 'chennai', 'kolkata', 'pune', 'jaipur', 'ahmedabad', 'kochi', 'lucknow'
]);

export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadWindingFactor = 1.25;
  const distance = R * c * roadWindingFactor;
  return Math.round(distance * 10) / 10;
}

export function detectCityFromCoordinates(lat: number, lng: number): string | null {
  if (isNaN(lat) || isNaN(lng) || (lat === 0 && lng === 0)) return null;
  let closestCity: string | null = null;
  let minDistance = Infinity;

  for (const c of CITY_COORDINATES) {
    const dist = haversineDistanceKm(lat, lng, c.lat, c.lng);
    if (dist <= c.radiusKm && dist < minDistance) {
      minDistance = dist;
      closestCity = c.city;
    }
  }
  return closestCity;
}

export const TRANSIT_DATABASE: TransitPoint[] = [
  // --- VIJAYAWADA ---
  { name: 'Vijayawada Junction Railway Station', type: 'railway', lat: 16.5186, lng: 80.6200, city: 'Vijayawada' },
  { name: 'Pandit Nehru Bus Station (PNBS)', type: 'bus', lat: 16.5086, lng: 80.6175, city: 'Vijayawada' },
  { name: 'Vijayawada International Airport (Gannavaram / VGA)', type: 'airport', lat: 16.5304, lng: 80.7968, city: 'Vijayawada' },
  { name: 'SS Convention Centre (MG Road / Labbipet)', type: 'landmark', lat: 16.5008, lng: 80.6534, city: 'Vijayawada' },
  { name: 'Kanaka Durga Temple & Indrakeeladri', type: 'landmark', lat: 16.5152, lng: 80.6056, city: 'Vijayawada' },
  { name: 'Benz Circle Commercial Hub', type: 'landmark', lat: 16.4998, lng: 80.6545, city: 'Vijayawada' },
  { name: 'Trendset Mall & Multiplex', type: 'landmark', lat: 16.5002, lng: 80.6578, city: 'Vijayawada' },
  { name: 'PVP Square Mall & Cinepolis', type: 'landmark', lat: 16.5057, lng: 80.6475, city: 'Vijayawada' },

  // --- GUNTUR ---
  { name: 'Guntur Junction Railway Station', type: 'railway', lat: 16.2974, lng: 80.4438, city: 'Guntur' },
  { name: 'NTR Central Bus Station (Guntur)', type: 'bus', lat: 16.3050, lng: 80.4485, city: 'Guntur' },
  { name: 'Vijayawada International Airport (VGA)', type: 'airport', lat: 16.5304, lng: 80.7968, city: 'Guntur' },
  { name: 'Brindavan Gardens Commercial Center', type: 'landmark', lat: 16.3120, lng: 80.4350, city: 'Guntur' },

  // --- VISAKHAPATNAM ---
  { name: 'Visakhapatnam Junction Railway Station', type: 'railway', lat: 17.7214, lng: 83.2906, city: 'Visakhapatnam' },
  { name: 'Dwaraka Central RTC Bus Complex', type: 'bus', lat: 17.7268, lng: 83.3082, city: 'Visakhapatnam' },
  { name: 'Visakhapatnam International Airport (VTZ)', type: 'airport', lat: 17.7211, lng: 83.2245, city: 'Visakhapatnam' },
  { name: 'RK Beach & Submarine Museum Promenade', type: 'landmark', lat: 17.7126, lng: 83.3283, city: 'Visakhapatnam' },
  { name: 'Jagadamba Junction Commercial Center', type: 'landmark', lat: 17.7145, lng: 83.3022, city: 'Visakhapatnam' },

  // --- TIRUPATI ---
  { name: 'Tirupati Main Railway Station', type: 'railway', lat: 13.6288, lng: 79.4192, city: 'Tirupati' },
  { name: 'Tirupati Central RTC Bus Station', type: 'bus', lat: 13.6264, lng: 79.4230, city: 'Tirupati' },
  { name: 'Tirupati International Airport (Renigunta / TIR)', type: 'airport', lat: 13.6325, lng: 79.5433, city: 'Tirupati' },
  { name: 'Alipiri Footpath Gate & Indiranagar Hub', type: 'landmark', lat: 13.6496, lng: 79.3995, city: 'Tirupati' },

  // --- RAJAHMUNDRY ---
  { name: 'Rajahmundry Railway Station (RJY)', type: 'railway', lat: 16.9912, lng: 81.7758, city: 'Rajahmundry' },
  { name: 'Rajahmundry Central RTC Complex', type: 'bus', lat: 17.0085, lng: 81.7850, city: 'Rajahmundry' },
  { name: 'Rajahmundry Airport (Madhurapudi / RJA)', type: 'airport', lat: 17.1106, lng: 81.8197, city: 'Rajahmundry' },
  { name: 'Godavari Ghat & Pushkar Ghat Promenade', type: 'landmark', lat: 17.0010, lng: 81.7695, city: 'Rajahmundry' },

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
  { name: 'Kempegowda Bus Station (Majestic KSRTC)', type: 'bus', lat: 12.9774, lng: 77.5713, city: 'Bangalore' },
  { name: 'Shantinagar BMTC / KSRTC Bus Station', type: 'bus', lat: 12.9542, lng: 77.5925, city: 'Bangalore' },
  { name: 'Kempegowda International Airport (BLR)', type: 'airport', lat: 13.1986, lng: 77.7066, city: 'Bangalore' },
  { name: 'MG Road Metro Station & Central Hub', type: 'metro', lat: 12.9756, lng: 77.6066, city: 'Bangalore' },
  { name: 'Whitefield IT Corridor', type: 'landmark', lat: 12.9698, lng: 77.7500, city: 'Bangalore' },

  // --- DELHI / NCR ---
  { name: 'New Delhi Railway Station (NDLS)', type: 'railway', lat: 28.6427, lng: 77.2199, city: 'Delhi' },
  { name: 'Old Delhi Railway Station (DLI)', type: 'railway', lat: 28.6609, lng: 77.2289, city: 'Delhi' },
  { name: 'Hazrat Nizamuddin Railway Station (NZM)', type: 'railway', lat: 28.5888, lng: 77.2534, city: 'Delhi' },
  { name: 'Maharana Pratap ISBT (Kashmere Gate)', type: 'bus', lat: 28.6669, lng: 77.2294, city: 'Delhi' },
  { name: 'Swami Vivekanand ISBT (Anand Vihar)', type: 'bus', lat: 28.6483, lng: 77.3159, city: 'Delhi' },
  { name: 'Indira Gandhi International Airport (DEL)', type: 'airport', lat: 28.5562, lng: 77.1000, city: 'Delhi' },
  { name: 'Rajiv Chowk (Connaught Place) Metro Interchange', type: 'metro', lat: 28.6328, lng: 77.2197, city: 'Delhi' },

  // --- CHENNAI ---
  { name: 'Chennai Central Railway Station (Dr. MGR)', type: 'railway', lat: 13.0827, lng: 80.2754, city: 'Chennai' },
  { name: 'Chennai Egmore Railway Station', type: 'railway', lat: 13.0784, lng: 80.2612, city: 'Chennai' },
  { name: 'Koyambedu CMBT Bus Terminus', type: 'bus', lat: 13.0673, lng: 80.1916, city: 'Chennai' },
  { name: 'Chennai International Airport (MAA)', type: 'airport', lat: 12.9941, lng: 80.1709, city: 'Chennai' },
  { name: 'T. Nagar Commercial Shopping Hub', type: 'landmark', lat: 13.0418, lng: 80.2341, city: 'Chennai' },

  // --- KOLKATA ---
  { name: 'Howrah Junction Railway Station', type: 'railway', lat: 22.5830, lng: 88.3426, city: 'Kolkata' },
  { name: 'Sealdah Railway Station', type: 'railway', lat: 22.5675, lng: 88.3711, city: 'Kolkata' },
  { name: 'Esplanade Central Bus Terminus', type: 'bus', lat: 22.5658, lng: 88.3516, city: 'Kolkata' },
  { name: 'Netaji Subhash Chandra Bose International Airport (CCU)', type: 'airport', lat: 22.6547, lng: 88.4467, city: 'Kolkata' },
  { name: 'Park Street Metro & Cultural Hub', type: 'metro', lat: 22.5511, lng: 88.3524, city: 'Kolkata' },

  // --- PUNE ---
  { name: 'Pune Junction Railway Station', type: 'railway', lat: 18.5284, lng: 73.8744, city: 'Pune' },
  { name: 'Swargate Central Bus Station', type: 'bus', lat: 18.5008, lng: 73.8584, city: 'Pune' },
  { name: 'Pune International Airport (PNQ)', type: 'airport', lat: 18.5822, lng: 73.9197, city: 'Pune' },
  { name: 'Shivajinagar Metro Hub', type: 'metro', lat: 18.5326, lng: 73.8529, city: 'Pune' },

  // --- GOA ---
  { name: 'Madgaon Junction Railway Station (MAO)', type: 'railway', lat: 15.2736, lng: 73.9723, city: 'Goa' },
  { name: 'Thivim Railway Station (THVM)', type: 'railway', lat: 15.6267, lng: 73.8525, city: 'Goa' },
  { name: 'Panaji KTC Central Bus Stand', type: 'bus', lat: 15.4989, lng: 73.8340, city: 'Goa' },
  { name: 'Dabolim Airport (GOI)', type: 'airport', lat: 15.3808, lng: 73.8314, city: 'Goa' },
  { name: 'Calangute Beach Coastal Promenade', type: 'landmark', lat: 15.5440, lng: 73.7553, city: 'Goa' },

  // --- JAIPUR ---
  { name: 'Jaipur Junction Railway Station', type: 'railway', lat: 26.9200, lng: 75.7878, city: 'Jaipur' },
  { name: 'Sindhi Camp Central Bus Stand', type: 'bus', lat: 26.9238, lng: 75.8016, city: 'Jaipur' },
  { name: 'Jaipur International Airport (JAI)', type: 'airport', lat: 26.8242, lng: 75.8122, city: 'Jaipur' },
  { name: 'Chandpole Metro Station & Pink City', type: 'metro', lat: 26.9264, lng: 75.8120, city: 'Jaipur' },

  // --- AHMEDABAD ---
  { name: 'Ahmedabad Junction Railway Station (Kalupur)', type: 'railway', lat: 23.0232, lng: 72.6009, city: 'Ahmedabad' },
  { name: 'Geeta Mandir Central Bus Station', type: 'bus', lat: 23.0135, lng: 72.5878, city: 'Ahmedabad' },
  { name: 'Sardar Vallabhbhai Patel International Airport (AMD)', type: 'airport', lat: 23.0772, lng: 72.6347, city: 'Ahmedabad' },
  { name: 'Old High Court Metro Interchange', type: 'metro', lat: 23.0366, lng: 72.5645, city: 'Ahmedabad' },

  // --- KOCHI (COCHIN) ---
  { name: 'Ernakulam Junction (South)', type: 'railway', lat: 9.9678, lng: 76.2891, city: 'Kochi' },
  { name: 'Kochi KSRTC Central Bus Stand', type: 'bus', lat: 9.9723, lng: 76.2874, city: 'Kochi' },
  { name: 'Cochin International Airport (COK)', type: 'airport', lat: 10.1518, lng: 76.3929, city: 'Kochi' },
  { name: 'MG Road Metro Station', type: 'metro', lat: 9.9754, lng: 76.2847, city: 'Kochi' },

  // --- VARANASI ---
  { name: 'Varanasi Junction (Cantt)', type: 'railway', lat: 25.3284, lng: 82.9863, city: 'Varanasi' },
  { name: 'Varanasi Central Bus Stand (Cantt)', type: 'bus', lat: 25.3268, lng: 82.9890, city: 'Varanasi' },
  { name: 'Lal Bahadur Shastri International Airport (VNS)', type: 'airport', lat: 25.4524, lng: 82.8593, city: 'Varanasi' },
  { name: 'Kashi Vishwanath Temple & Dashashwamedh Ghat', type: 'landmark', lat: 25.3109, lng: 83.0107, city: 'Varanasi' }
];

export function getTransitDistancesForHotel(hotel: any): TransitItem[] {
  if (!hotel) return [];

  const rawLat = parseFloat(hotel.coordinates?.lat || hotel.lat || '');
  const rawLng = parseFloat(hotel.coordinates?.lng || hotel.lng || '');
  const hasCoordinates = !isNaN(rawLat) && !isNaN(rawLng) && rawLat !== 0 && rawLng !== 0;

  // Auto-detect city from coordinates if city is ambiguous or missing
  const detectedCityFromCoords = hasCoordinates ? detectCityFromCoordinates(rawLat, rawLng) : null;
  const rawCity = (detectedCityFromCoords || hotel.city || hotel.location || '').toLowerCase().trim();
  const cityCap = detectedCityFromCoords || hotel.city || 'Central';
  const isMetroCity = CITIES_WITH_METRO.has(rawCity);

  // 1. If hotel already has stored transitHubs, sanitize out-of-bounds items
  if (hotel.transitHubs) {
    const th = hotel.transitHubs;
    const items: TransitItem[] = [];

    if (th.railway && Number(th.railway.distanceKm) <= 40) {
      items.push({
        type: 'railway',
        icon: '🚆',
        name: th.railway.name,
        distanceKm: th.railway.distanceKm || 4.5,
        durationMins: th.railway.durationMins
      });
    }

    if (th.bus && Number(th.bus.distanceKm) <= 35) {
      items.push({
        type: 'bus',
        icon: '🚌',
        name: th.bus.name,
        distanceKm: th.bus.distanceKm || 4.5,
        durationMins: th.bus.durationMins
      });
    }

    if (th.airport && Number(th.airport.distanceKm) <= 75) {
      items.push({
        type: 'airport',
        icon: '✈️',
        name: th.airport.name,
        distanceKm: th.airport.distanceKm || 18.0,
        durationMins: th.airport.durationMins
      });
    }

    // Strictly validate 4th item (metro or landmark):
    // Must NOT be from another city (e.g. Ameerpet in Vijayawada!) and must be <= 25 km
    const m = th.metroOrLandmark || th.metro;
    if (m && Number(m.distanceKm) <= 28) {
      const isMismatchedMetro = m.type === 'metro' && !isMetroCity;
      if (!isMismatchedMetro) {
        items.push({
          type: m.type || 'metro',
          icon: m.type === 'landmark' ? '📍' : '🚇',
          name: m.name,
          distanceKm: m.distanceKm || 4.5,
          durationMins: m.durationMins
        });
      }
    }

    // If all items are valid within city radius, return them
    if (items.length === 4) {
      return items;
    }
  }

  // 2. Compute strictly within city boundary
  let candidatePoints = TRANSIT_DATABASE.filter(p => p.city && rawCity.includes(p.city.toLowerCase()));
  if (candidatePoints.length === 0) {
    // Check if detected from coordinates
    if (detectedCityFromCoords) {
      candidatePoints = TRANSIT_DATABASE.filter(p => p.city && p.city.toLowerCase() === detectedCityFromCoords.toLowerCase());
    }
  }

  // Helper to find nearest point of a given type strictly within maximum radius
  const findNearestInCity = (
    type: TransitPoint['type'],
    maxAllowedKm: number,
    fallbackName: string,
    fallbackDist: number,
    icon: string
  ): TransitItem => {
    let nearest: TransitItem | null = null;
    let minDistance = Infinity;

    for (const p of candidatePoints) {
      if (p.type === type) {
        const dist = hasCoordinates
          ? haversineDistanceKm(rawLat, rawLng, p.lat, p.lng)
          : fallbackDist;
        if (dist <= maxAllowedKm && dist < minDistance) {
          minDistance = dist;
          nearest = {
            type,
            name: p.name,
            distanceKm: Math.max(0.8, dist),
            icon
          };
        }
      }
    }

    // Check national database ONLY if distance is within tight city radius
    if (!nearest && hasCoordinates) {
      for (const p of TRANSIT_DATABASE) {
        if (p.type === type) {
          const dist = haversineDistanceKm(rawLat, rawLng, p.lat, p.lng);
          if (dist <= maxAllowedKm && dist < minDistance) {
            minDistance = dist;
            nearest = {
              type,
              name: p.name,
              distanceKm: Math.max(0.8, dist),
              icon
            };
          }
        }
      }
    }

    if (!nearest) {
      nearest = {
        type,
        name: fallbackName,
        distanceKm: fallbackDist,
        icon
      };
    }

    return nearest;
  };

  const railway = findNearestInCity('railway', 35, `${cityCap} Junction Railway Station`, 4.5, '🚆');
  const bus = findNearestInCity('bus', 30, `${cityCap} Central Bus Terminus`, 4.5, '🚌');
  const airport = findNearestInCity('airport', 65, `${cityCap} International Airport`, 16.5, '✈️');

  // 4th item: ONLY search for metro if city has a metro system
  let fourthItem: TransitItem;
  if (isMetroCity) {
    fourthItem = findNearestInCity('metro', 25, `${cityCap} Central Metro Station`, 3.5, '🚇');
  } else {
    // In non-metro cities (e.g. Vijayawada), show prominent local landmark / convention center!
    const defaultLandmark = rawCity.includes('vijayawada') 
      ? 'SS Convention Centre (MG Road / Labbipet)' 
      : `${cityCap} Central Commercial Center`;
    fourthItem = findNearestInCity('landmark', 25, defaultLandmark, 3.2, '📍');
  }

  return [railway, bus, airport, fourthItem];
}
