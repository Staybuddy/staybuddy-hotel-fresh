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

export const TRANSIT_DATABASE: TransitPoint[] = [
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

function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export function getTransitDistancesForHotel(hotel: any): TransitItem[] {
  if (!hotel) return [];

  // 1. If hotel already has stored transitHubs
  if (hotel.transitHubs) {
    const th = hotel.transitHubs;
    const items: TransitItem[] = [];
    if (th.railway) {
      items.push({
        type: 'railway',
        icon: '🚆',
        name: th.railway.name,
        distanceKm: th.railway.distanceKm || 4.5,
        durationMins: th.railway.durationMins
      });
    }
    if (th.bus) {
      items.push({
        type: 'bus',
        icon: '🚌',
        name: th.bus.name,
        distanceKm: th.bus.distanceKm || 4.5,
        durationMins: th.bus.durationMins
      });
    }
    if (th.airport) {
      items.push({
        type: 'airport',
        icon: '✈️',
        name: th.airport.name,
        distanceKm: th.airport.distanceKm || 18.0,
        durationMins: th.airport.durationMins
      });
    }
    if (th.metroOrLandmark || th.metro) {
      const m = th.metroOrLandmark || th.metro;
      items.push({
        type: m.type || 'metro',
        icon: m.type === 'landmark' ? '📍' : '🚇',
        name: m.name,
        distanceKm: m.distanceKm || 4.5,
        durationMins: m.durationMins
      });
    }

    if (items.length >= 2) {
      return items;
    }
  }

  // 2. Compute dynamically from hotel's coordinates or city
  const lat = parseFloat(hotel.coordinates?.lat || hotel.lat || '');
  const lng = parseFloat(hotel.coordinates?.lng || hotel.lng || '');
  const hasCoordinates = !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;

  const cityName = (hotel.city || hotel.location || '').toLowerCase().trim();

  // Find candidate points
  let candidatePoints = TRANSIT_DATABASE;
  let matchingCityPoints = TRANSIT_DATABASE.filter(p => p.city && cityName.includes(p.city.toLowerCase()));
  if (matchingCityPoints.length > 0) {
    candidatePoints = matchingCityPoints;
  }

  // Helper to find nearest point of a given type
  const findNearest = (type: TransitPoint['type'], fallbackDefault: { name: string; dist: number }) => {
    let nearest: TransitItem | null = null;
    let minDistance = Infinity;

    for (const p of candidatePoints) {
      if (p.type === type) {
        const dist = hasCoordinates
          ? haversineDistanceKm(lat, lng, p.lat, p.lng)
          : fallbackDefault.dist;
        if (dist < minDistance) {
          minDistance = dist;
          nearest = {
            type,
            name: p.name,
            distanceKm: Math.max(0.8, dist),
            icon: type === 'railway' ? '🚆' : type === 'bus' ? '🚌' : type === 'airport' ? '✈️' : '🚇'
          };
        }
      }
    }

    // Fallback to all database points if no city match
    if (!nearest && hasCoordinates) {
      for (const p of TRANSIT_DATABASE) {
        if (p.type === type) {
          const dist = haversineDistanceKm(lat, lng, p.lat, p.lng);
          if (dist < minDistance) {
            minDistance = dist;
            nearest = {
              type,
              name: p.name,
              distanceKm: Math.max(0.8, dist),
              icon: type === 'railway' ? '🚆' : type === 'bus' ? '🚌' : type === 'airport' ? '✈️' : '🚇'
            };
          }
        }
      }
    }

    if (!nearest) {
      nearest = {
        type,
        name: fallbackDefault.name,
        distanceKm: fallbackDefault.dist,
        icon: type === 'railway' ? '🚆' : type === 'bus' ? '🚌' : type === 'airport' ? '✈️' : '🚇'
      };
    }

    return nearest;
  };

  // City-specific fallback defaults if city or coords are unknown
  const cityCap = hotel.city || 'Central';
  const railway = findNearest('railway', { name: `${cityCap} Junction Railway Station`, dist: 4.5 });
  const bus = findNearest('bus', { name: `${cityCap} Central Bus Terminus`, dist: 4.5 });
  const airport = findNearest('airport', { name: `${cityCap} International Airport`, dist: 16.5 });
  const metroOrLandmark = findNearest('metro', { name: `${cityCap} Metro Interchange`, dist: 3.5 });

  return [railway, bus, airport, metroOrLandmark];
}
