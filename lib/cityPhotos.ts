// Smart City Photo Resolver for StayBuddy
// Maps city names to real, high-resolution landmark photography

export interface CityPhotoInfo {
  url: string;
  landmark: string;
  state?: string;
}

// Verified high-resolution photos of major destinations (tested HTTP 200)
export const CURATED_CITY_PHOTOS: Record<string, CityPhotoInfo> = {
  mumbai: {
    url: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
    landmark: 'Gateway of India',
    state: 'Maharashtra',
  },
  goa: {
    url: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80',
    landmark: 'Palolem Beach & Palms',
    state: 'Goa',
  },
  delhi: {
    url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
    landmark: 'India Gate',
    state: 'National Capital Region',
  },
  'new delhi': {
    url: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80',
    landmark: 'India Gate',
    state: 'National Capital Region',
  },
  jaipur: {
    url: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
    landmark: 'Hawa Mahal (Pink City)',
    state: 'Rajasthan',
  },
  manali: {
    url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=600&q=80',
    landmark: 'Solang Valley & Himalayas',
    state: 'Himachal Pradesh',
  },
  kerala: {
    url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
    landmark: 'Alleppey Backwaters & Houseboat',
    state: 'Kerala',
  },
  hyderabad: {
    url: 'https://images.unsplash.com/photo-1616190419596-e2839e7380d7?auto=format&fit=crop&w=600&q=80',
    landmark: 'Charminar & City of Pearls',
    state: 'Telangana',
  },
  shamshabad: {
    url: 'https://images.unsplash.com/photo-1616190419596-e2839e7380d7?auto=format&fit=crop&w=600&q=80',
    landmark: 'Rajiv Gandhi Int. Airport Area',
    state: 'Telangana',
  },
  bangalore: {
    url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
    landmark: 'Vidhana Soudha & Garden City',
    state: 'Karnataka',
  },
  bengaluru: {
    url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80',
    landmark: 'Vidhana Soudha & Garden City',
    state: 'Karnataka',
  },
  chennai: {
    url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
    landmark: 'Marina Beach & Heritage',
    state: 'Tamil Nadu',
  },
  kolkata: {
    url: 'https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&w=600&q=80',
    landmark: 'Victoria Memorial & Howrah',
    state: 'West Bengal',
  },
  udaipur: {
    url: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?auto=format&fit=crop&w=600&q=80',
    landmark: 'Lake Pichola Palace',
    state: 'Rajasthan',
  },
  agra: {
    url: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=600&q=80',
    landmark: 'Taj Mahal',
    state: 'Uttar Pradesh',
  },
  varanasi: {
    url: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=600&q=80',
    landmark: 'Ganga Ghats & Evening Aarti',
    state: 'Uttar Pradesh',
  },
  shimla: {
    url: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=600&q=80',
    landmark: 'Mall Road & Snow Pines',
    state: 'Himachal Pradesh',
  },
  ooty: {
    url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
    landmark: 'Nilgiri Hills & Tea Plantations',
    state: 'Tamil Nadu',
  },
  amritsar: {
    url: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?auto=format&fit=crop&w=600&q=80',
    landmark: 'Golden Temple (Harmandir Sahib)',
    state: 'Punjab',
  },
  pune: {
    url: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?auto=format&fit=crop&w=600&q=80',
    landmark: 'Sinhagad & Deccan Hills',
    state: 'Maharashtra',
  },
};

// Localities, neighborhoods, airport hubs & suburbs mapped to their primary Metropolitan City
export const SUBURB_TO_CITY_MAP: Record<string, string> = {
  // Hyderabad & surrounding hubs
  'shamshabad': 'Hyderabad',
  'secunderabad': 'Hyderabad',
  'begumpet': 'Hyderabad',
  'hitec city': 'Hyderabad',
  'hitech city': 'Hyderabad',
  'gachibowli': 'Hyderabad',
  'madhapur': 'Hyderabad',
  'banjara hills': 'Hyderabad',
  'jubilee hills': 'Hyderabad',
  'kukatpally': 'Hyderabad',
  'kondapur': 'Hyderabad',
  'cyberabad': 'Hyderabad',
  'hyd': 'Hyderabad',
  'charminar': 'Hyderabad',
  'ameerpet': 'Hyderabad',
  'dilsukhnagar': 'Hyderabad',
  'miyapur': 'Hyderabad',
  'manikonda': 'Hyderabad',
  'somajiguda': 'Hyderabad',

  // Mumbai & MMR
  'andheri': 'Mumbai',
  'bandra': 'Mumbai',
  'juhu': 'Mumbai',
  'powai': 'Mumbai',
  'thane': 'Mumbai',
  'navi mumbai': 'Mumbai',
  'borivali': 'Mumbai',
  'dadar': 'Mumbai',
  'colaba': 'Mumbai',
  'bkc': 'Mumbai',
  'goregaon': 'Mumbai',
  'malad': 'Mumbai',
  'kurla': 'Mumbai',
  'santacruz': 'Mumbai',
  'vile parle': 'Mumbai',
  'worli': 'Mumbai',
  'chembur': 'Mumbai',
  'kandivali': 'Mumbai',
  'mulund': 'Mumbai',
  'ghatkopar': 'Mumbai',
  'lower parel': 'Mumbai',
  'bom': 'Mumbai',
  'bombay': 'Mumbai',

  // Delhi & NCR
  'new delhi': 'Delhi',
  'gurgaon': 'Delhi',
  'gurugram': 'Delhi',
  'noida': 'Delhi',
  'greater noida': 'Delhi',
  'faridabad': 'Delhi',
  'ghaziabad': 'Delhi',
  'dwarka': 'Delhi',
  'connaught place': 'Delhi',
  'karol bagh': 'Delhi',
  'saket': 'Delhi',
  'rohini': 'Delhi',
  'aerocity': 'Delhi',
  'south extension': 'Delhi',
  'del': 'Delhi',
  'ncr': 'Delhi',

  // Bangalore / Bengaluru
  'whitefield': 'Bangalore',
  'koramangala': 'Bangalore',
  'indiranagar': 'Bangalore',
  'electronic city': 'Bangalore',
  'hsr layout': 'Bangalore',
  'marathahalli': 'Bangalore',
  'yelahanka': 'Bangalore',
  'bellandur': 'Bangalore',
  'jayanagar': 'Bangalore',
  'mg road': 'Bangalore',
  'hebbal': 'Bangalore',
  'jp nagar': 'Bangalore',
  'banashankari': 'Bangalore',
  'sarjapur': 'Bangalore',
  'bengaluru': 'Bangalore',
  'blr': 'Bangalore',

  // Chennai
  'valasaravakkam': 'Chennai',
  't nagar': 'Chennai',
  't. nagar': 'Chennai',
  'adyar': 'Chennai',
  'velachery': 'Chennai',
  'anna nagar': 'Chennai',
  'guindy': 'Chennai',
  'omr': 'Chennai',
  'tambaram': 'Chennai',
  'egmore': 'Chennai',
  'mylapore': 'Chennai',
  'nungambakkam': 'Chennai',
  'porur': 'Chennai',
  'madras': 'Chennai',
  'maa': 'Chennai',

  // Kolkata
  'salt lake': 'Kolkata',
  'new town': 'Kolkata',
  'howrah': 'Kolkata',
  'park street': 'Kolkata',
  'rajarhat': 'Kolkata',
  'ballygunge': 'Kolkata',
  'alipore': 'Kolkata',
  'dum dum': 'Kolkata',
  'calcutta': 'Kolkata',
  'ccu': 'Kolkata',

  // Goa
  'calangute': 'Goa',
  'baga': 'Goa',
  'candolim': 'Goa',
  'panaji': 'Goa',
  'panjim': 'Goa',
  'anjuna': 'Goa',
  'vagator': 'Goa',
  'colva': 'Goa',
  'margao': 'Goa',
  'morjim': 'Goa',
  'arambol': 'Goa',
  'north goa': 'Goa',
  'south goa': 'Goa',

  // Jaipur
  'amer': 'Jaipur',
  'amber': 'Jaipur',
  'malviya nagar': 'Jaipur',
  'mansarovar': 'Jaipur',
  'vaishali nagar': 'Jaipur',
  'c scheme': 'Jaipur',
  'c-scheme': 'Jaipur',
  'tonk road': 'Jaipur',

  // Pune
  'hinjewadi': 'Pune',
  'wakad': 'Pune',
  'viman nagar': 'Pune',
  'baner': 'Pune',
  'kothrud': 'Pune',
  'shivaji nagar': 'Pune',
  'koregaon park': 'Pune',
  'hadapsar': 'Pune',
  'pimpri': 'Pune',
  'chinchwad': 'Pune',
  'pcmc': 'Pune',

  // Kochi
  'ernakulam': 'Kochi',
  'fort kochi': 'Kochi',
  'kakkanad': 'Kochi',
  'aluva': 'Kochi',
  'mattancherry': 'Kochi',

  // Varanasi
  'banaras': 'Varanasi',
  'kashi': 'Varanasi',
  'sarnath': 'Varanasi',

  // Ahmedabad
  'gandhinagar': 'Ahmedabad',
  'sg highway': 'Ahmedabad',
  'bodakdev': 'Ahmedabad',
  'vastrapur': 'Ahmedabad',
};

// Default high-quality travel scenic fallback
export const DEFAULT_CITY_PHOTO = 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=600&q=80';

/**
 * Smartly resolves any locality, suburb, or address string into its canonical parent metropolitan city.
 * For example:
 * - "shamshabad" -> "Hyderabad"
 * - "Begumpet , hyderabad" -> "Hyderabad"
 * - "Valasaravakkam , Chennai 600087" -> "Chennai"
 * - "Shamshabad , Hyd" -> "Hyderabad"
 * - "Andheri East" -> "Mumbai"
 */
export function resolveParentCity(rawLocation: string): string {
  if (!rawLocation) return '';

  const cleaned = rawLocation
    .toLowerCase()
    .replace(/\b\d{4,6}\b/g, '') // remove postal codes
    .replace(/[,\-_/]/g, ' ')   // replace separators
    .trim();

  // 1. Direct match with exact suburb key
  if (SUBURB_TO_CITY_MAP[cleaned]) {
    return SUBURB_TO_CITY_MAP[cleaned];
  }

  // 2. Check multi-word phrase inclusions (e.g. "hitec city", "salt lake", "navi mumbai")
  for (const [suburb, parent] of Object.entries(SUBURB_TO_CITY_MAP)) {
    if (cleaned.includes(suburb)) {
      return parent;
    }
  }

  // 3. Check individual tokens
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  for (const token of tokens) {
    if (SUBURB_TO_CITY_MAP[token]) {
      return SUBURB_TO_CITY_MAP[token];
    }
  }

  // 4. Check known parent cities directly in the string
  const knownCities = [
    'Hyderabad', 'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata',
    'Goa', 'Jaipur', 'Manali', 'Kerala', 'Udaipur', 'Agra', 'Varanasi',
    'Shimla', 'Ooty', 'Amritsar', 'Pune', 'Kochi', 'Ahmedabad', 'Chandigarh'
  ];
  for (const city of knownCities) {
    if (cleaned.includes(city.toLowerCase())) {
      return city;
    }
  }

  // 5. Default fallback: capitalize the primary token
  const primary = tokens[0] || rawLocation.trim();
  return primary.charAt(0).toUpperCase() + primary.slice(1).toLowerCase();
}

/**
 * Normalizes city name to lowercase key, stripping pin/zip codes and extra punctuation
 */
export function normalizeCityName(cityName: string): string {
  if (!cityName) return '';
  const parent = resolveParentCity(cityName);
  return parent.toLowerCase();
}

/**
 * Synchronous photo resolver (instant render from curated map or fallback)
 */
export function getCityPhotoSync(cityName: string): string {
  const parent = resolveParentCity(cityName).toLowerCase();
  
  if (CURATED_CITY_PHOTOS[parent]) {
    return CURATED_CITY_PHOTOS[parent].url;
  }
  
  return DEFAULT_CITY_PHOTO;
}

/**
 * Retrieves landmark info if available
 */
export function getCityLandmark(cityName: string): string {
  const parent = resolveParentCity(cityName).toLowerCase();
  return CURATED_CITY_PHOTOS[parent]?.landmark || 'Popular Destination';
}
