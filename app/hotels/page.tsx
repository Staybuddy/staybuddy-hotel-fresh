'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import DateRangePicker from '@/components/DateRangePicker';
import GuestSelector from '@/components/GuestSelector';
import LocationSearch from '@/components/LocationSearch';
import Image from 'next/image';

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
    category: '',
    propertyType: '',
    minRating: '',
    sortBy: 'rating',
    rooms: parseInt(searchParams.get('rooms') || '1', 10),
    adults: parseInt(searchParams.get('adults') || '2', 10),
    children: parseInt(searchParams.get('children') || '0', 10),
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateSelection, setActiveDateSelection] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showMobileSearchEdit, setShowMobileSearchEdit] = useState(false);
  const [showMobileFilterDrawer, setShowMobileFilterDrawer] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/wishlist')
      .then(res => res.json())
      .then(d => { if (d.wishlistIds) setWishlistIds(d.wishlistIds); })
      .catch(() => {});
  }, []);

  const toggleWishlist = async (e: React.MouseEvent, hotelId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const isSaved = wishlistIds.includes(hotelId);
    setWishlistIds(prev => isSaved ? prev.filter(id => id !== hotelId) : [...prev, hotelId]);
    try {
      await fetch('/api/wishlist', {
        method: isSaved ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId }),
      });
    } catch (e) {
      // revert on error
    }
  };

  const cycleSort = () => {
    setFilters(p => {
      let nextSort = 'rating';
      if (p.sortBy === 'rating') nextSort = 'price_low';
      else if (p.sortBy === 'price_low') nextSort = 'price_high';
      else if (p.sortBy === 'price_high') nextSort = 'newest';
      else nextSort = 'rating';
      return { ...p, sortBy: nextSort };
    });
  };

  const getSortLabel = () => {
    switch (filters.sortBy) {
      case 'price_low': return 'Price: Low to High';
      case 'price_high': return 'Price: High to Low';
      case 'newest': return 'Newest';
      default: return 'Top Rated';
    }
  };

  useEffect(() => {
    setFilters(p => ({
      ...p,
      city: searchParams.has('city') ? (searchParams.get('city') || '') : p.city,
      checkIn: searchParams.has('checkIn') ? (searchParams.get('checkIn') || '') : p.checkIn,
      checkOut: searchParams.has('checkOut') ? (searchParams.get('checkOut') || '') : p.checkOut,
      rooms: searchParams.has('rooms') ? parseInt(searchParams.get('rooms') as string, 10) : p.rooms,
      adults: searchParams.has('adults') ? parseInt(searchParams.get('adults') as string, 10) : p.adults,
      children: searchParams.has('children') ? parseInt(searchParams.get('children') as string, 10) : p.children,
    }));
  }, [searchParams]);

  useEffect(() => { fetchHotels(); }, [filters, page]);

  async function fetchHotels() {
    const params = new URLSearchParams({ status: 'approved', page: page.toString(), limit: '9' });
    if (filters.city) params.set('city', filters.city);
    if (filters.category) params.set('category', filters.category);
    if (filters.propertyType) params.set('propertyType', filters.propertyType);
    if (filters.minRating) params.set('minRating', filters.minRating);
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

  return (
    <div>
      <style>{`
        .mobile-results-header {
          display: none;
        }
        .hotels-search-container {
          display: block;
        }
        @media (max-width: 1024px) {
          .mobile-results-header {
            display: block !important;
          }
          .hotels-search-container {
            display: none !important;
          }
          .hotels-search-container.mobile-search-open {
            display: block !important;
            animation: fadeIn 0.25s ease;
          }
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
            padding: 12px 12px 32px !important;
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
            padding: 10px 10px 24px !important;
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
            border-radius: 16px !important;
            overflow: hidden !important;
          }
        }
      `}</style>
      <Navbar />

      {/* MOBILE STICKY HEADER (Photo 3 MakeMyTrip / StayBuddy Layout) */}
      <div className="mobile-results-header" style={{
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        {/* Top Bar: Back Arrow + Location & Dates + Search Edit Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a'
              }}
              aria-label="Back"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
            </button>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                {filters.city || 'All Destinations'}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                {`${filters.checkIn ? formatDate(filters.checkIn) : '05 Nov'} - ${filters.checkOut ? formatDate(filters.checkOut) : '06 Nov'}, ${filters.rooms} room${filters.rooms > 1 ? 's' : ''}, ${filters.adults + filters.children} Guests`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Search Edit Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileSearchEdit(!showMobileSearchEdit)}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: showMobileSearchEdit ? 'var(--brand-50)' : '#f8fafc',
                border: showMobileSearchEdit ? '1px solid var(--brand-300)' : '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: showMobileSearchEdit ? 'var(--brand-600)' : '#0f172a',
                cursor: 'pointer'
              }}
              aria-label="Search"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Filter Horizontal Scrolling Strip (Photo 3) */}
        <div style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          padding: '4px 14px 10px',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          alignItems: 'center'
        }}>
          {/* Maps Pill */}
          <button
            type="button"
            onClick={() => alert("Interactive map view is active.")}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#1e293b',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <span>📍 Maps</span>
          </button>

          {/* Sort Pill */}
          <button
            type="button"
            onClick={cycleSort}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: filters.sortBy !== 'rating' ? '1px solid var(--brand-500)' : '1px solid #cbd5e1',
              background: filters.sortBy !== 'rating' ? '#fff7ed' : '#ffffff',
              color: filters.sortBy !== 'rating' ? 'var(--brand-700)' : '#1e293b',
              fontSize: '0.75rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <span>⇅ Sort: {getSortLabel()}</span>
          </button>

          {/* All Filters Pill */}
          <button
            type="button"
            onClick={() => setShowMobileFilterDrawer(true)}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: (filters.category || filters.propertyType || filters.minRating) ? '1px solid var(--brand-500)' : '1px solid #cbd5e1',
              background: (filters.category || filters.propertyType || filters.minRating) ? '#fff7ed' : '#ffffff',
              color: (filters.category || filters.propertyType || filters.minRating) ? 'var(--brand-700)' : '#1e293b',
              fontSize: '0.75rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <span>☵ All Filters {(filters.category || filters.propertyType || filters.minRating) ? '(Active)' : ''}</span>
          </button>

          {/* Budget Pill */}
          <button
            type="button"
            onClick={() => setFilters(p => ({ ...p, category: p.category === 'budget' ? '' : 'budget' }))}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: filters.category === 'budget' ? '1px solid var(--brand-500)' : '1px solid #cbd5e1',
              background: filters.category === 'budget' ? '#fff7ed' : '#ffffff',
              color: filters.category === 'budget' ? 'var(--brand-700)' : '#1e293b',
              fontSize: '0.75rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <span>🏷️ ₹ Budget</span>
          </button>

          {/* 4+ Rating Pill */}
          <button
            type="button"
            onClick={() => setFilters(p => ({ ...p, minRating: p.minRating === '4' ? '' : '4' }))}
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              border: filters.minRating === '4' ? '1px solid var(--brand-500)' : '1px solid #cbd5e1',
              background: filters.minRating === '4' ? '#fff7ed' : '#ffffff',
              color: filters.minRating === '4' ? 'var(--brand-700)' : '#1e293b',
              fontSize: '0.75rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <span>⭐ 4+ Rating</span>
          </button>
        </div>
      </div>

      {/* Search Bar (Collapsible on Mobile, Fixed/Sticky on Desktop) */}
      <div className={`hotels-search-container ${showMobileSearchEdit ? 'mobile-search-open' : ''}`} style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: 'var(--space-4) 0', position: 'sticky', top: 68, zIndex: 100 }}>
        <div className="container" style={{ padding: '0 12px' }}>
          <div className="hotels-search-wrapper" style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'stretch' }}>
            <div className="hotels-search-item hotels-search-item-location" style={{ flex: '2 1 200px', position: 'relative' }}>
              <LocationSearch city={filters.city} variant="compact" onChange={c => setFilters(p => ({ ...p, city: c }))} />
            </div>
            {/* Check-in */}
            <div
              className="hotels-search-item hotels-search-item-checkin"
              onClick={() => { setActiveDateSelection('checkIn'); setShowDatePicker(true); }}
              style={{ flex: '1 1 140px', position: 'relative', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '6px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', height: '54px', justifyContent: 'center' }}
            >
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CHECK-IN</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatDate(filters.checkIn)}</span>
            </div>

            {/* Check-out */}
            <div
              className="hotels-search-item hotels-search-item-checkout"
              onClick={() => { setActiveDateSelection('checkOut'); setShowDatePicker(true); }}
              style={{ flex: '1 1 140px', position: 'relative', background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '6px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', height: '54px', justifyContent: 'center' }}
            >
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CHECK-OUT</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatDate(filters.checkOut)}</span>
            </div>

            {/* Guests & Rooms */}
            <div className="hotels-search-item hotels-search-item-guests" style={{ flex: '1 1 160px', position: 'relative' }}>
              <div
                onClick={() => setShowGuestPicker(true)}
                style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '6px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px', height: '54px', justifyContent: 'center' }}
              >
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ROOMS & GUESTS</span>
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
                      onChange={(r, a, c) => setFilters(p => ({ ...p, rooms: r, adults: a, children: c, guests: String(a + c) }))}
                      onClose={() => setShowGuestPicker(false)}
                    />
                  </div>
                </>
              )}
            </div>
            <button className="btn btn-primary hotels-search-btn" onClick={() => { setPage(1); fetchHotels(); }} style={{ height: '54px', padding: '0 24px', flex: '0 0 auto' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              Search
            </button>
          </div>

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

              {/* Star Category */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 12 }}>STAR CATEGORY</div>
                {['5-Star', '7-Star', 'Heritage'].map(item => (
                  <label key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', fontSize: '0.95rem' }}>
                    <input type="checkbox" style={{ width: 18, height: 18, accentColor: 'var(--brand-500)', cursor: 'pointer' }} />
                    {item}
                  </label>
                ))}
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
                <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 12 }}>PROPERTY TYPE</div>
                {['Hotel', 'Resort', 'Villa', 'Homestay', 'Apartment'].map(pt => (
                  <label key={pt} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', fontSize: '0.95rem' }}>
                    <input type="radio" name="propertyType" checked={filters.propertyType === pt} onChange={() => setFilters(p => ({ ...p, propertyType: pt }))} style={{ width: 18, height: 18, accentColor: 'var(--brand-500)', cursor: 'pointer' }} />
                    {pt}
                  </label>
                ))}
              </div>

              {/* Min Rating */}
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)', marginBottom: 12 }}>MIN. RATING</div>
                {['4', '3', '2'].map(r => (
                  <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, cursor: 'pointer', fontSize: '0.95rem' }}>
                    <input type="radio" name="rating" checked={filters.minRating === r} onChange={() => setFilters(p => ({ ...p, minRating: r }))} style={{ width: 18, height: 18, accentColor: 'var(--brand-500)', cursor: 'pointer' }} />
                    <span style={{ color: '#FBBF24', letterSpacing: '2px', fontSize: '1.2rem' }}>{'★'.repeat(parseInt(r))}</span> & above
                  </label>
                ))}
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
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{loading ? 'Searching...' : `${total} properties found`}</p>
            </div>
            <select className="form-input form-select" style={{ width: 'auto', padding: '8px 36px 8px 12px', fontSize: '0.875rem' }} value={filters.sortBy} onChange={e => setFilters(p => ({ ...p, sortBy: e.target.value }))}>
              <option value="rating">Top Rated</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="newest">Newest First</option>
            </select>
          </div>

          {loading ? (
            <div className="hotels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="card">
                  <div className="skeleton" style={{ height: 200 }} />
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ height: 18, width: '70%' }} />
                    <div className="skeleton" style={{ height: 14, width: '50%' }} />
                    <div className="skeleton" style={{ height: 20, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔍</div>
              <h3>No hotels found</h3>
              <p style={{ marginTop: 8 }}>Try adjusting your search or filters</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setFilters(p => ({ ...p, city: '', category: '', minRating: '' }))}>Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="hotels-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-5)' }}>
                {hotels.map((hotel, index) => {
                  const basePrice = Number(hotel.startingPrice) || 3500;
                  const strikethroughPrice = Math.round(basePrice * 1.6);
                  const taxes = Math.round(basePrice * 0.12);
                  const isSaved = wishlistIds.includes(hotel._id);
                  const avgRating = Number(hotel.avgRating) || 4.2;

                  return (
                    <Link key={hotel._id} href={`/hotels/${hotel._id}${getQueryString()}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="card card-hover hotel-card" style={{ height: '100%', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                        {/* Hero Image Container with Carousel Dots & Wishlist Heart */}
                        <div className="hotel-card-img-wrapper" style={{ position: 'relative', width: '100%', height: '220px', background: '#e2e8f0' }}>
                          {hotel.images?.[0] ? (
                            <Image src={hotel.images[0]} alt={hotel.name} fill priority={index < 2} className="hotel-card-img" style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                          ) : (
                            <div className="hotel-card-img" style={{ background: 'linear-gradient(135deg, var(--brand-100), var(--brand-200))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏨</div>
                          )}

                          {/* Left Badges */}
                          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6, zIndex: 4 }}>
                            <span className="badge badge-gray" style={{ backdropFilter: 'blur(6px)', background: 'rgba(15, 23, 42, 0.7)', color: 'white', fontWeight: 700 }}>
                              {hotel.propertyType || 'Hotel'}
                            </span>
                            {hotel.category && (
                              <span className="badge badge-primary" style={{ backdropFilter: 'blur(6px)', background: 'rgba(37, 99, 235, 0.85)', color: 'white', fontWeight: 700 }}>
                                {hotel.category}
                              </span>
                            )}
                          </div>

                          {/* Wishlist Square/Circle Button (Photo 3) */}
                          <button
                            type="button"
                            onClick={(e) => toggleWishlist(e, hotel._id)}
                            style={{
                              position: 'absolute',
                              top: 10,
                              right: 10,
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: 'rgba(255, 255, 255, 0.92)',
                              backdropFilter: 'blur(6px)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                              zIndex: 5,
                              transition: 'transform 0.2s'
                            }}
                            aria-label="Save to Wishlist"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill={isSaved ? '#ef4444' : 'none'} stroke={isSaved ? '#ef4444' : '#1e293b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                            </svg>
                          </button>

                          {/* Carousel Dots Indicator (Photo 3) */}
                          <div style={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5, zIndex: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ffffff', opacity: 1, boxShadow: '0 1px 2px rgba(0,0,0,0.4)' }} />
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.6)' }} />
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="card-body" style={{ padding: '14px 16px' }}>
                          {/* Rating Badge Row (Photo 3 MakeMyTrip) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                            <span style={{ background: '#1d4ed8', color: '#ffffff', fontWeight: 800, fontSize: '0.8rem', padding: '2px 8px', borderRadius: '6px' }}>
                              ★ {avgRating.toFixed(1)}
                            </span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1d4ed8' }}>
                              Very Good
                            </span>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              ({hotel.totalReviews || 75} Ratings)
                            </span>
                            <span style={{ marginLeft: 'auto', background: '#f1f5f9', color: '#475569', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                              SPONSORED
                            </span>
                          </div>

                          {/* Hotel Name */}
                          <h3 style={{ fontSize: '1.12rem', fontWeight: 900, marginBottom: 4, color: '#0f172a', lineHeight: 1.25 }}>
                            {hotel.name}
                          </h3>

                          {/* Location */}
                          <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            📍 {hotel.area ? `${hotel.area} | ` : ''}{hotel.city}
                          </p>

                          {/* Guaranteed Perk Banner (Photo 3) */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '8px 0', fontSize: '0.74rem', color: '#0369a1', background: '#f0f9ff', padding: '5px 10px', borderRadius: '8px', fontWeight: 600 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            <span>Guaranteed Late Check-out available</span>
                          </div>

                          {/* Pricing Row (Photo 3 Layout) */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontSize: '0.65rem', background: '#fef2f2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, width: 'fit-content', marginBottom: 3 }}>
                                LIMITED TIME OFFER
                              </span>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 600 }}>
                                  ₹{strikethroughPrice.toLocaleString('en-IN')}
                                </span>
                                <span style={{ fontSize: '1.38rem', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
                                  ₹{basePrice.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>
                                + ₹{taxes.toLocaleString('en-IN')} taxes &amp; fees
                              </div>
                              <div style={{ fontSize: '0.68rem', color: '#475569', fontWeight: 600, marginTop: 1 }}>
                                Per night for {filters.rooms} Room{filters.rooms > 1 ? 's' : ''}
                              </div>
                            </div>

                            <button style={{
                              background: 'linear-gradient(135deg, #ff6b35, #ea580c)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '10px 18px',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(255,107,53,0.3)',
                              whiteSpace: 'nowrap'
                            }}>
                              SELECT ROOM →
                            </button>
                          </div>

                          {/* Perks bullet line (Photo 3) */}
                          <div style={{ marginTop: 10, fontSize: '0.72rem', color: '#475569', display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                            <span style={{ color: '#2563eb' }}>✦</span>
                            <span>Centrally located • Airport transfer service • Instant Confirmation</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Filter Drawer Modal */}
              {showMobileFilterDrawer && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowMobileFilterDrawer(false)} />
                  <div style={{ position: 'relative', background: 'white', borderRadius: '24px 24px 0 0', maxHeight: '85vh', overflowY: 'auto', padding: '20px 20px 30px', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>All Filters</h3>
                      <button onClick={() => setShowMobileFilterDrawer(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✕
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {/* Category */}
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginBottom: 10 }}>CATEGORY</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {['All', 'Budget', 'Standard', 'Premium', 'Luxury'].map(cat => {
                            const isSel = filters.category === cat.toLowerCase() || (cat === 'All' && !filters.category);
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setFilters(p => ({ ...p, category: cat === 'All' ? '' : cat.toLowerCase() }))}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: 10,
                                  border: isSel ? '2px solid var(--brand-500)' : '1px solid #cbd5e1',
                                  background: isSel ? '#fff7ed' : '#ffffff',
                                  color: isSel ? 'var(--brand-700)' : '#1e293b',
                                  fontWeight: isSel ? 800 : 600,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer'
                                }}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Min Rating */}
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginBottom: 10 }}>MINIMUM RATING</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {['4', '3', '2'].map(r => {
                            const isSel = filters.minRating === r;
                            return (
                              <button
                                key={r}
                                type="button"
                                onClick={() => setFilters(p => ({ ...p, minRating: isSel ? '' : r }))}
                                style={{
                                  flex: 1,
                                  padding: '8px 12px',
                                  borderRadius: 10,
                                  border: isSel ? '2px solid var(--brand-500)' : '1px solid #cbd5e1',
                                  background: isSel ? '#fff7ed' : '#ffffff',
                                  color: isSel ? 'var(--brand-700)' : '#1e293b',
                                  fontWeight: isSel ? 800 : 600,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer'
                                }}
                              >
                                ★ {r}+ Stars
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Property Type */}
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', marginBottom: 10 }}>PROPERTY TYPE</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {['Hotel', 'Resort', 'Villa', 'Homestay'].map(pt => {
                            const isSel = filters.propertyType === pt;
                            return (
                              <button
                                key={pt}
                                type="button"
                                onClick={() => setFilters(p => ({ ...p, propertyType: isSel ? '' : pt }))}
                                style={{
                                  padding: '8px 14px',
                                  borderRadius: 10,
                                  border: isSel ? '2px solid var(--brand-500)' : '1px solid #cbd5e1',
                                  background: isSel ? '#fff7ed' : '#ffffff',
                                  color: isSel ? 'var(--brand-700)' : '#1e293b',
                                  fontWeight: isSel ? 800 : 600,
                                  fontSize: '0.82rem',
                                  cursor: 'pointer'
                                }}
                              >
                                {pt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Apply Button */}
                      <button
                        type="button"
                        onClick={() => setShowMobileFilterDrawer(false)}
                        style={{
                          marginTop: 10,
                          background: 'linear-gradient(135deg, #ff6b35, #ea580c)',
                          color: 'white',
                          border: 'none',
                          borderRadius: 12,
                          padding: '14px',
                          fontWeight: 800,
                          fontSize: '0.98rem',
                          cursor: 'pointer'
                        }}
                      >
                        APPLY FILTERS
                      </button>
                    </div>
                  </div>
                </div>
              )}

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
  return <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>}><HotelSearch /></Suspense>;
}
