'use client';
import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import DateRangePicker from '@/components/DateRangePicker';
import GuestSelector from '@/components/GuestSelector';
import LocationSearch from '@/components/LocationSearch';
import Image from 'next/image';
import BrandLoader from '@/components/BrandLoader';

const AMENITY_OPTIONS = ['Free WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Parking', 'AC', 'Bar', 'Pet Friendly', 'Breakfast'];
const CATEGORIES = ['all', 'budget', 'standard', 'premium', 'luxury'];

// Client-side cache for ultra-fast instant filter & pagination transitions
const searchClientCache = new Map<string, { hotels: any[]; total: number; pages: number }>();

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Add date';
  const d = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

function HotelSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
    guests: searchParams.get('guests') || '1',
    category: searchParams.get('category') || (searchParams.get('collection') === 'premium' ? 'premium' : ''),
    propertyType: searchParams.get('propertyType') || '',
    minRating: searchParams.get('starRating') || searchParams.get('minRating') || '',
    starRating: searchParams.get('starRating') || searchParams.get('minRating') || '',
    sortBy: 'rating',
    rooms: parseInt(searchParams.get('rooms') || '1', 10),
    adults: parseInt(searchParams.get('adults') || '2', 10),
    children: parseInt(searchParams.get('children') || '0', 10),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateSelection, setActiveDateSelection] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [hotelsSearchError, setHotelsSearchError] = useState('');
  const [hotelsValidationErrorField, setHotelsValidationErrorField] = useState<'city' | 'dates' | 'adults' | null>(null);

  function handleHotelsSearch() {
    if (!filters.city.trim()) {
      setHotelsValidationErrorField('city');
      setHotelsSearchError('Destination is mandatory. Please enter or select a city or hotel.');
      setTimeout(() => setHotelsSearchError(''), 4500);
      document.getElementById('location-search-trigger')?.click();
      return;
    }
    if (!filters.checkIn || !filters.checkOut) {
      setHotelsValidationErrorField('dates');
      setHotelsSearchError('Dates are mandatory. Please select check-in and check-out dates.');
      setTimeout(() => setHotelsSearchError(''), 4500);
      setActiveDateSelection(!filters.checkIn ? 'checkIn' : 'checkOut');
      setShowDatePicker(true);
      return;
    }
    if (!filters.adults || filters.adults < 1) {
      setHotelsValidationErrorField('adults');
      setHotelsSearchError('Guests are mandatory. Please select at least 1 adult.');
      setTimeout(() => setHotelsSearchError(''), 4500);
      setShowGuestPicker(true);
      return;
    }

    setHotelsValidationErrorField(null);
    setHotelsSearchError('');
    setPage(1);
    fetchHotels();
  }

  useEffect(() => {
    setFilters(p => ({
      ...p,
      city: searchParams.has('city') ? (searchParams.get('city') || '') : p.city,
      checkIn: searchParams.has('checkIn') ? (searchParams.get('checkIn') || '') : p.checkIn,
      checkOut: searchParams.has('checkOut') ? (searchParams.get('checkOut') || '') : p.checkOut,
      category: searchParams.has('category') ? (searchParams.get('category') || '') : (searchParams.get('collection') === 'premium' ? 'premium' : p.category),
      propertyType: searchParams.has('propertyType') ? (searchParams.get('propertyType') || '') : p.propertyType,
      minRating: searchParams.has('starRating') ? (searchParams.get('starRating') || '') : (searchParams.has('minRating') ? (searchParams.get('minRating') || '') : p.minRating),
      starRating: searchParams.has('starRating') ? (searchParams.get('starRating') || '') : (searchParams.has('minRating') ? (searchParams.get('minRating') || '') : p.starRating),
      rooms: searchParams.has('rooms') ? parseInt(searchParams.get('rooms') as string, 10) : p.rooms,
      adults: searchParams.has('adults') ? parseInt(searchParams.get('adults') as string, 10) : p.adults,
      children: searchParams.has('children') ? parseInt(searchParams.get('children') as string, 10) : p.children,
      sortBy: (searchParams.get('sort') || searchParams.get('sortBy') || p.sortBy) as string,
    }));
  }, [searchParams]);

  useEffect(() => { fetchHotels(); }, [filters, page]);

  async function fetchHotels() {
    const params = new URLSearchParams({ status: 'approved', page: page.toString(), limit: '9' });
    if (filters.city) params.set('city', filters.city);
    if (filters.category) params.set('category', filters.category);
    if (filters.propertyType) params.set('propertyType', filters.propertyType);
    const activeRating = filters.starRating || filters.minRating;
    if (activeRating) {
      params.set('starRating', activeRating);
      params.set('minRating', activeRating);
    }
    if (filters.adults) params.set('adults', filters.adults.toString());
    if (filters.rooms) params.set('rooms', filters.rooms.toString());
    if (filters.checkIn) params.set('checkIn', filters.checkIn);
    if (filters.checkOut) params.set('checkOut', filters.checkOut);

    const cacheKey = params.toString();

    // Instant Cache Recovery: Show cached data immediately if user already viewed it
    if (searchClientCache.has(cacheKey)) {
      const cached = searchClientCache.get(cacheKey)!;
      setHotels(cached.hotels);
      setTotal(cached.total);
      setPages(cached.pages);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await fetch(`/api/hotels?${params}`);
      const data = await res.json();
      if (data && Array.isArray(data.hotels)) {
        searchClientCache.set(cacheKey, { hotels: data.hotels, total: data.total || 0, pages: data.pages || 1 });
        setHotels(data.hotels);
        setTotal(data.total || 0);
        setPages(data.pages || 1);
      }
      
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e) {
      if (!searchClientCache.has(cacheKey)) {
        setHotels([]);
      }
    } finally {
      setLoading(false);
    }
  }

  const getQueryString = () => {
    const p = new URLSearchParams();
    if (filters.checkIn) p.set('checkIn', filters.checkIn);
    if (filters.checkOut) p.set('checkOut', filters.checkOut);
    if (filters.adults) p.set('adults', filters.adults.toString());
    if (filters.rooms) p.set('rooms', filters.rooms.toString());
    if (filters.children) p.set('children', filters.children.toString());
    const str = p.toString();
    return str ? `?${str}` : '';
  };

  const today = new Date().toISOString().split('T')[0];

  const sortedHotels = useMemo(() => {
    let list = [...hotels];

    // Client-side exact star rating filter
    const activeRating = filters.starRating || filters.minRating;
    if (activeRating && activeRating !== 'all') {
      const targetStar = parseInt(activeRating, 10);
      if (!isNaN(targetStar)) {
        list = list.filter((h: any) => {
          const parsed = Number(h.starRating);
          let star = 3;
          if (!isNaN(parsed) && parsed > 0) {
            star = Math.min(5, Math.max(1, parsed));
          } else {
            const cat = (h.category || '').toLowerCase();
            if (cat === 'luxury' || cat.includes('5 star')) star = 5;
            else if (cat === 'premium' || cat.includes('4 star')) star = 4;
            else if (cat === 'standard' || cat.includes('3 star')) star = 3;
            else if (cat === 'budget' || cat.includes('2 star')) star = 2;
          }
          return star === targetStar;
        });
      }
    }

    // Client-side property type filter
    if (filters.propertyType && filters.propertyType.toLowerCase() !== 'all') {
      const ptLower = filters.propertyType.toLowerCase().trim();
      list = list.filter((h: any) => {
        const hPt = (h.propertyType || 'Hotel').toLowerCase().trim();
        return hPt === ptLower;
      });
    }

    if (filters.sortBy === 'newest') {
      return list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    } else if (filters.sortBy === 'price_low') {
      return list.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (filters.sortBy === 'price_high') {
      return list.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else {
      return list.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    }
  }, [hotels, filters.sortBy, filters.starRating, filters.minRating, filters.propertyType]);

  return (
    <div>
      <style>{`
        @media (max-width: 1024px) {
          .hotels-search-wrapper {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .hotels-search-item-location,
          .hotels-search-item-guests,
          .hotels-search-btn {
            grid-column: 1 / -1 !important;
            width: 100% !important;
            flex: none !important;
          }
          .hotels-search-item-checkin,
          .hotels-search-item-checkout {
            grid-column: span 1 !important;
            width: 100% !important;
            flex: none !important;
          }
          .hotels-search-btn {
            width: 100% !important;
            margin-top: 4px !important;
          }
          .hotels-sidebar {
            display: none !important;
          }
          .hotels-main-container {
            display: block !important;
            padding: 16px 12px 32px !important;
            gap: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .hotels-content-wrapper {
            width: 100% !important;
            min-width: 0 !important;
            flex: none !important;
          }
        }

        @media (min-width: 640px) and (max-width: 1024px) {
          .hotels-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
            width: 100% !important;
          }
        }

        @media (max-width: 639px) {
          .hotels-main-container {
            padding: 12px 10px 24px !important;
          }
          .hotels-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 16px !important;
            width: 100% !important;
          }
          .hotels-grid .hotel-card {
            width: 100% !important;
            box-sizing: border-box !important;
            border-radius: 14px !important;
          }
          .hotels-grid .hotel-card-img-wrapper {
            width: 100% !important;
            height: auto !important;
            aspect-ratio: 16 / 10 !important;
            min-height: 200px !important;
          }
        }
      `}</style>
      <Navbar />

      {/* Search Bar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: 'var(--space-4) 0', position: 'sticky', top: 68, zIndex: 100 }}>
        <div className="container" style={{ padding: '0 12px' }}>
          <div className="hotels-search-wrapper" style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'stretch' }}>
            <div className="hotels-search-item hotels-search-item-location" style={{ flex: '2 1 200px', position: 'relative' }}>
              <LocationSearch 
                city={filters.city} 
                variant="compact" 
                hasError={hotelsValidationErrorField === 'city' && !filters.city.trim()}
                onChange={c => {
                  setFilters(p => ({ ...p, city: c }));
                  if (c && c.trim()) {
                    setHotelsValidationErrorField(null);
                    setHotelsSearchError('');
                  }
                }} 
              />
            </div>
            {/* Check-in */}
            <div
              className="hotels-search-item hotels-search-item-checkin"
              onClick={() => { 
                setHotelsValidationErrorField(null);
                setHotelsSearchError('');
                setActiveDateSelection('checkIn'); 
                setShowDatePicker(true); 
              }}
              style={{ 
                flex: '1 1 140px', 
                position: 'relative', 
                background: hotelsValidationErrorField === 'dates' && !filters.checkIn ? '#fef2f2' : 'white', 
                border: hotelsValidationErrorField === 'dates' && !filters.checkIn ? '2px solid #ef4444' : '1px solid var(--border)', 
                borderRadius: 'var(--radius-md)', 
                padding: '6px 12px', 
                cursor: 'pointer', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '2px', 
                height: '54px', 
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: hotelsValidationErrorField === 'dates' && !filters.checkIn ? '#dc2626' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CHECK-IN <span style={{ color: '#ef4444', fontWeight: 900 }}>*</span>
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatDate(filters.checkIn)}</span>
            </div>

            {/* Check-out */}
            <div
              className="hotels-search-item hotels-search-item-checkout"
              onClick={() => { 
                setHotelsValidationErrorField(null);
                setHotelsSearchError('');
                setActiveDateSelection('checkOut'); 
                setShowDatePicker(true); 
              }}
              style={{ 
                flex: '1 1 140px', 
                position: 'relative', 
                background: hotelsValidationErrorField === 'dates' && !filters.checkOut ? '#fef2f2' : 'white', 
                border: hotelsValidationErrorField === 'dates' && !filters.checkOut ? '2px solid #ef4444' : '1px solid var(--border)', 
                borderRadius: 'var(--radius-md)', 
                padding: '6px 12px', 
                cursor: 'pointer', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '2px', 
                height: '54px', 
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: hotelsValidationErrorField === 'dates' && !filters.checkOut ? '#dc2626' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                CHECK-OUT <span style={{ color: '#ef4444', fontWeight: 900 }}>*</span>
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatDate(filters.checkOut)}</span>
            </div>

            {/* Guests & Rooms */}
            <div className="hotels-search-item hotels-search-item-guests" style={{ flex: '1 1 160px', position: 'relative' }}>
              <div
                onClick={() => {
                  setHotelsValidationErrorField(null);
                  setHotelsSearchError('');
                  setShowGuestPicker(true);
                }}
                style={{ 
                  background: hotelsValidationErrorField === 'adults' && (!filters.adults || filters.adults < 1) ? '#fef2f2' : 'white', 
                  border: hotelsValidationErrorField === 'adults' && (!filters.adults || filters.adults < 1) ? '2px solid #ef4444' : '1px solid var(--border)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '6px 12px', 
                  cursor: 'pointer', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '2px', 
                  height: '54px', 
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: hotelsValidationErrorField === 'adults' && (!filters.adults || filters.adults < 1) ? '#dc2626' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  ROOMS & GUESTS <span style={{ color: '#ef4444', fontWeight: 900 }}>*</span>
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {`${filters.rooms} Room${filters.rooms > 1 ? 's' : ''}, ${filters.adults + filters.children} Guest${(filters.adults + filters.children) > 1 ? 's' : ''}`}
                </span>
              </div>
              {showGuestPicker && (
                <>
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setShowGuestPicker(false)} />
                  <div style={{ position: 'absolute', top: '100%', right: 0, zIndex: 1000, marginTop: '8px', background: 'white', borderRadius: 'var(--radius-xl)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid var(--border)' }}>
                    <GuestSelector
                      rooms={filters.rooms}
                      adults={filters.adults}
                      children={filters.children}
                      onChange={(r, a, c) => {
                        setFilters(p => ({ ...p, rooms: r, adults: a, children: c, guests: String(a + c) }));
                        if (a && a >= 1) {
                          setHotelsValidationErrorField(null);
                          setHotelsSearchError('');
                        }
                      }}
                      onClose={() => setShowGuestPicker(false)}
                    />
                  </div>
                </>
              )}
            </div>
            <button className="btn btn-primary hotels-search-btn" onClick={handleHotelsSearch} style={{ height: '54px', padding: '0 24px', flex: '0 0 auto' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              Search
            </button>
          </div>

          {hotelsSearchError && (
            <div style={{
              width: '100%',
              background: '#fef2f2',
              border: '1.5px solid #ef4444',
              color: '#b91c1c',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textAlign: 'center',
              animation: 'fadeIn 0.25s ease-in-out',
              marginTop: 10
            }}>
              <span>⚠️</span>
              <span>{hotelsSearchError}</span>
            </div>
          )}

          {/* Date Picker Overlay */}
          {showDatePicker && (
            <>
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setShowDatePicker(false)} />
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, marginTop: '8px' }}>
                <div className="container" style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', background: 'white', borderRadius: 'var(--radius-xl)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', padding: '16px', border: '1px solid var(--border)' }}>
                    <DateRangePicker
                      checkIn={filters.checkIn}
                      checkOut={filters.checkOut}
                      onChange={(inDate, outDate) => setFilters(p => ({ ...p, checkIn: inDate, checkOut: outDate }))}
                      onClose={() => setShowDatePicker(false)}
                      activeSelection={activeDateSelection}
                      setActiveSelection={setActiveDateSelection}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="container hotels-main-container" style={{ padding: 'var(--space-4) var(--space-6) var(--space-8)', display: 'flex', gap: 'var(--space-8)', alignItems: 'flex-start' }}>

        {/* Sidebar Filters */}
        <aside style={{ width: 260, flexShrink: 0, position: 'sticky', top: 160, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} className="hotels-sidebar hide-mobile">
          {/* Map Explore */}
          <div style={{ position: 'relative', height: 120, borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer', border: '1px solid var(--border)' }} onClick={() => { }}>
            <div style={{ backgroundImage: 'url(/map-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', width: '100%', height: '100%', filter: 'opacity(0.8)' }}></div>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: '8px 16px', borderRadius: 'var(--radius-full)', fontWeight: 800, color: 'var(--brand-600)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
              <span style={{ fontSize: '1rem' }}>📍</span> EXPLORE ON MAP
            </div>
          </div>

          {/* Text Search */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: 10, fontSize: '1.2rem', color: 'var(--text-muted)' }}>🔍</span>
            <input type="text" className="form-input" placeholder="Search for locality / hotel n" style={{ paddingLeft: 40, borderRadius: 'var(--radius-md)' }} />
          </div>

          {/* Main Filters Container */}
          <div style={{ background: 'transparent' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>

              {/* For You */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 12 }}>FOR YOU</div>
                {['Early Bird Deals', '4 Star', '5 Star'].map(item => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', fontSize: '0.95rem' }}>
                    <input type="checkbox" style={{ width: 18, height: 18, accentColor: 'var(--brand-500)', cursor: 'pointer' }} />
                    {item}
                  </label>
                ))}
              </div>

              {/* Price Range */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 12 }}>PRICE RANGE</div>
                <input type="range" min="1000" max="10000" style={{ width: '100%', accentColor: 'var(--brand-500)', marginBottom: 8 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 600 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>₹1,000</span>
                  <span>₹10,000</span>
                </div>
              </div>

              {/* Star Rating (Exact Star Filter) */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>STAR RATING</span>
                  {(filters.starRating || filters.minRating) && (
                    <button
                      type="button"
                      onClick={() => setFilters(p => ({ ...p, starRating: '', minRating: '' }))}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {[
                  { value: '5', stars: 5, label: '5-Star Hotel' },
                  { value: '4', stars: 4, label: '4-Star Hotel' },
                  { value: '3', stars: 3, label: '3-Star Hotel' },
                  { value: '2', stars: 2, label: '2-Star Hotel' },
                  { value: '1', stars: 1, label: '1-Star Hotel' },
                ].map(r => {
                  const isChecked = (filters.starRating === r.value || filters.minRating === r.value);
                  return (
                    <label 
                      key={r.value} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 10, 
                        marginBottom: 10, 
                        cursor: 'pointer', 
                        fontSize: '0.95rem',
                        padding: '4px 8px',
                        borderRadius: 8,
                        background: isChecked ? 'rgba(234, 88, 12, 0.08)' : 'transparent',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <input 
                        type="radio" 
                        name="starRating" 
                        checked={isChecked} 
                        onChange={() => setFilters(p => ({ 
                          ...p, 
                          starRating: (p.starRating === r.value || p.minRating === r.value) ? '' : r.value,
                          minRating: (p.starRating === r.value || p.minRating === r.value) ? '' : r.value,
                        }))}
                        onClick={() => {
                          if (filters.starRating === r.value || filters.minRating === r.value) {
                            setFilters(p => ({ ...p, starRating: '', minRating: '' }));
                          }
                        }} 
                        style={{ width: 18, height: 18, accentColor: 'var(--brand-500)', cursor: 'pointer' }} 
                      />
                      <span style={{ color: '#FBBF24', letterSpacing: '2px', fontSize: '1.05rem', whiteSpace: 'nowrap' }}>
                        {'★'.repeat(r.stars)}
                      </span>
                      <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? 'var(--brand-700)' : 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                        {r.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Category */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 12 }}>CATEGORY</div>
                {['All', 'Budget', 'Standard', 'Premium', 'Luxury'].map(cat => (
                  <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', fontSize: '0.95rem', textTransform: 'capitalize' }}>
                    <input type="radio" name="category" checked={filters.category === cat.toLowerCase() || (cat === 'All' && !filters.category)} onChange={() => setFilters(p => ({ ...p, category: cat === 'All' ? '' : cat.toLowerCase() }))} style={{ width: 18, height: 18, accentColor: 'var(--brand-500)', cursor: 'pointer' }} />
                    {cat}
                  </label>
                ))}
              </div>

              {/* Property Type */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>PROPERTY TYPE</span>
                  {filters.propertyType && (
                    <button
                      type="button"
                      onClick={() => setFilters(p => ({ ...p, propertyType: '' }))}
                      style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                    >
                      Clear
                    </button>
                  )}
                </div>
                {['Hotel', 'Resort', 'Villa', 'Homestay', 'Apartment'].map(pt => {
                  const isChecked = filters.propertyType.toLowerCase() === pt.toLowerCase();
                  return (
                    <label key={pt} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 10, 
                      marginBottom: 10, 
                      cursor: 'pointer', 
                      fontSize: '0.95rem',
                      padding: '4px 8px',
                      borderRadius: 8,
                      background: isChecked ? 'rgba(234, 88, 12, 0.08)' : 'transparent',
                      transition: 'background 0.15s ease'
                    }}>
                      <input 
                        type="radio" 
                        name="propertyType" 
                        checked={isChecked} 
                        onChange={() => setFilters(p => ({ ...p, propertyType: isChecked ? '' : pt }))}
                        onClick={() => {
                          if (isChecked) {
                            setFilters(p => ({ ...p, propertyType: '' }));
                          }
                        }} 
                        style={{ width: 18, height: 18, accentColor: 'var(--brand-500)', cursor: 'pointer' }} 
                      />
                      <span style={{ fontWeight: isChecked ? 700 : 500, color: isChecked ? 'var(--brand-700)' : 'var(--text-primary)' }}>{pt}</span>
                    </label>
                  );
                })}
              </div>

            </div>
          </div>
        </aside>

        {/* Hotel Grid */}
        <div className="hotels-content-wrapper" style={{ flex: 1, minWidth: 0, width: '100%' }}>
          {/* Results header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-5)' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: 2 }}>
                {filters.city ? `Hotels in ${filters.city}` : 'All Hotels'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {loading ? 'Searching...' : `${sortedHotels.length} ${sortedHotels.length === 1 ? 'property' : 'properties'} found`}
              </p>
            </div>
            <select className="form-input form-select" style={{ width: 'auto', padding: '8px 36px 8px 12px', fontSize: '0.875rem' }} value={filters.sortBy} onChange={e => setFilters(p => ({ ...p, sortBy: e.target.value }))}>
              <option value="rating">Top Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {loading ? (
            <div className="hotels-results-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
              {[1, 2, 3].map(i => (
                <div key={i} className="hotel-horizontal-card" style={{ pointerEvents: 'none' }}>
                  <div className="hotel-horizontal-img">
                    <div className="skeleton" style={{ width: '100%', height: '100%' }} />
                  </div>
                  <div className="hotel-horizontal-details">
                    <div>
                      <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }} />
                      <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 16 }} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div className="skeleton" style={{ height: 26, width: 80, borderRadius: 6 }} />
                        <div className="skeleton" style={{ height: 26, width: 80, borderRadius: 6 }} />
                        <div className="skeleton" style={{ height: 26, width: 80, borderRadius: 6 }} />
                      </div>
                    </div>
                  </div>
                  <div className="hotel-horizontal-pricing">
                    <div className="skeleton" style={{ height: 32, width: 100, marginBottom: 12 }} />
                    <div className="skeleton" style={{ height: 42, width: '100%', borderRadius: 10 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedHotels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
              <h3>No hotels found</h3>
              <p style={{ marginTop: 8 }}>Try adjusting your search or filters</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setFilters(p => ({ ...p, city: '', category: '', minRating: '', starRating: '', propertyType: '' }))}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="hotels-results-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                {sortedHotels.map((hotel, index) => {
                  const starNum = Math.min(5, Math.max(1, Number(hotel.starRating) || (hotel.category === 'Luxury' ? 5 : hotel.category === 'Premium' ? 4 : 3)));
                  const isPremier = starNum >= 4 || (hotel.category && ['luxury', 'premium'].includes(hotel.category.toLowerCase()) && starNum >= 4);
                  return (
                  <Link 
                    key={hotel._id} 
                    href={`/hotels/${hotel._id}${getQueryString()}`} 
                    prefetch={true}
                    style={{ textDecoration: 'none', color: 'inherit', width: '100%', WebkitTapHighlightColor: 'transparent', touchAction: 'manipulation' }}
                  >
                    <div className="hotel-horizontal-card">
                      {/* Image / Gallery */}
                      <div className="hotel-horizontal-img">
                        {hotel.images?.[0] ? (
                          <Image src={hotel.images[0]} alt={hotel.name} fill priority={index < 2} style={{ objectFit: 'cover' }} sizes="(max-width: 900px) 100vw, 320px" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--brand-100), var(--brand-200))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏨</div>
                        )}
                        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 2 }}>
                          <span className="badge badge-gray" style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.65)', color: 'white', fontWeight: 700 }}>
                            {hotel.propertyType || 'Hotel'}
                          </span>
                        </div>
                        {hotel.avgRating >= 4.5 && (
                          <div style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 2 }}>
                            <span className="badge" style={{ background: 'linear-gradient(135deg, #ff6b35, #ea580c)', color: 'white', fontWeight: 800 }}>
                              ⭐ Top Rated
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Hotel Details */}
                      <div className="hotel-horizontal-details">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{hotel.name}</h3>
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                  border: '1px solid #fde68a',
                                  color: '#b45309',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  whiteSpace: 'nowrap',
                                  boxShadow: '0 1px 2px rgba(180, 83, 9, 0.08)'
                                }}
                              >
                                <span style={{ color: '#f59e0b', fontSize: '0.8rem', letterSpacing: '-0.5px' }}>
                                  {'★'.repeat(starNum)}
                                </span>
                                <span>{starNum}-Star Hotel</span>
                              </span>
                            </div>
                          </div>
                          
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>📍</span>
                            <span>{hotel.area ? `${hotel.area}, ` : ''}{hotel.city}</span>
                            <span style={{ color: '#cbd5e1' }}>•</span>
                            <span style={{ color: '#2563eb', fontWeight: 600 }}>Prime Location</span>
                          </p>

                          {hotel.avgRating > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                              <span style={{ background: '#16a34a', color: 'white', fontWeight: 800, fontSize: '0.82rem', padding: '2px 8px', borderRadius: '6px' }}>
                                ★ {hotel.avgRating.toFixed(1)}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                                {hotel.totalReviews} {hotel.totalReviews === 1 ? 'verified review' : 'verified reviews'}
                              </span>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: '#f8fafc', padding: '2px 8px', borderRadius: '6px', border: '1px solid #f1f5f9', fontWeight: 600 }}>
                                ⭐ New on StayBuddy
                              </span>
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                            {(hotel.amenities || ['Free WiFi', 'AC', '24-hour Front Desk']).slice(0, 4).map((a: string) => (
                              <span key={a} style={{ fontSize: '0.74rem', background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                                {a}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          {typeof hotel.roomsLeft === 'number' && (
                            <div style={{ fontSize: '0.82rem', color: '#ea580c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#ea580c' }} />
                              🔥 Only {hotel.roomsLeft} {hotel.roomsLeft === 1 ? 'room' : 'rooms'} left at this price
                            </div>
                          )}
                          <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600, marginTop: 4 }}>
                            ✓ Free Cancellation before 24 hours
                          </div>
                        </div>
                      </div>

                      {/* Right: Pricing & CTA */}
                      <div className="hotel-horizontal-pricing">
                        <div className="hotel-pricing-block">
                          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                            Best Rate Guaranteed
                          </div>
                          {hotel.startingPrice && Number(hotel.startingPrice) > 0 ? (
                            <>
                              <div className="hotel-price-num-row" style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                                <span className="hotel-price-amount" style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--brand-700, #c2410c)', lineHeight: 1 }}>
                                  ₹{Number(hotel.startingPrice).toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>/night</span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                                + ₹{Math.round(Number(hotel.startingPrice) * 0.12).toLocaleString('en-IN')} taxes & fees
                              </div>
                              {filters.adults === 1 && (
                                <div style={{ fontSize: '0.7rem', color: '#16a34a', fontWeight: 600 }}>1 Adult rate</div>
                              )}
                              {filters.adults === 3 && (
                                <div style={{ fontSize: '0.7rem', color: '#2563eb', fontWeight: 600 }}>3 Adults rate</div>
                              )}
                            </>
                          ) : (
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#64748b', marginTop: 6 }}>
                              Check rates
                            </div>
                          )}
                        </div>

                        <div className="hotel-view-btn-wrap" style={{ width: '100%', marginTop: 16 }}>
                          <div
                            className="btn btn-primary hotel-view-btn"
                            style={{
                              width: '100%',
                              padding: '12px 18px',
                              borderRadius: '10px',
                              fontWeight: 800,
                              fontSize: '0.92rem',
                              boxShadow: '0 4px 14px rgba(255, 107, 53, 0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6
                            }}
                          >
                            <span>View Hotel</span>
                            <span>→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
              </div>

              {/* Pagination */}
              {pages > 1 && (
                <div className="pagination" style={{ justifyContent: 'center', marginTop: 'var(--space-8)' }}>
                  <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
                  {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                    <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                  ))}
                  <button className="page-btn" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>→</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HotelsPage() {
  return (
    <Suspense fallback={<BrandLoader fullScreen size={76} message="Searching verified hotels..." />}>
      <HotelSearch />
    </Suspense>
  );
}
