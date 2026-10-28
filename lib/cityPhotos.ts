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

// Common city aliases for seamless matching
const CITY_ALIASES: Record<string, string> = {
  bombay: 'mumbai',
  calcutta: 'kolkata',
  madras: 'chennai',
  bengaluru: 'bangalore',
  mysuru: 'mysore',
  puducherry: 'pondicherry',
  banaras: 'varanasi',
  kashi: 'varanasi',
  secunderabad: 'hyderabad',
  cyberabad: 'hyderabad',
  gurgaon: 'delhi',
  noida: 'delhi',
};

// Default high-quality travel scenic fallback
export const DEFAULT_CITY_PHOTO = 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=600&q=80';

/**
 * Normalizes city name to lowercase key
 */
export function normalizeCityName(cityName: string): string {
  if (!cityName) return '';
  return cityName.trim().toLowerCase();
}

/**
 * Synchronous photo resolver (instant render from curated map or fallback)
 */
export function getCityPhotoSync(cityName: string): string {
  const norm = normalizeCityName(cityName);
  const canonical = CITY_ALIASES[norm] || norm;
  
  if (CURATED_CITY_PHOTOS[canonical]) {
    return CURATED_CITY_PHOTOS[canonical].url;
  }
  
  return DEFAULT_CITY_PHOTO;
}

/**
 * Retrieves landmark info if available
 */
export function getCityLandmark(cityName: string): string {
  const norm = normalizeCityName(cityName);
  const canonical = CITY_ALIASES[norm] || norm;
  return CURATED_CITY_PHOTOS[canonical]?.landmark || 'Popular Destination';
}
