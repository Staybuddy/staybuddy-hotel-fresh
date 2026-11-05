'use client';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Logo from '@/components/Logo';
import DateRangePicker from '@/components/DateRangePicker';
import LocationSearch from '@/components/LocationSearch';
import AppPromoCard from '@/components/AppPromoCard';
import HomeReferralSection from '@/components/HomeReferralSection';
import HomeStatsSection from '@/components/HomeStatsSection';
import CityDestinationCard from '@/components/CityDestinationCard';
import { resolveParentCity } from '@/lib/cityPhotos';
import Image from 'next/image';
import WishlistButton from '@/components/WishlistButton';
import { adjustRoomsAndAdults, MAX_ADULTS_PER_ROOM } from '@/lib/occupancyPricing';

const DESTINATIONS = [
  { city: 'Mumbai', country: 'India', hotels: 342 },
  { city: 'Goa', country: 'India', hotels: 218 },
  { city: 'Delhi', country: 'India', hotels: 485 },
  { city: 'Jaipur', country: 'India', hotels: 196 },
  { city: 'Manali', country: 'India', hotels: 87 },
  { city: 'Kerala', country: 'India', hotels: 154 },
  { city: 'Hyderabad', country: 'India', hotels: 310 },
  { city: 'Bangalore', country: 'India', hotels: 290 },
  { city: 'Udaipur', country: 'India', hotels: 142 },
  { city: 'Ooty', country: 'India', hotels: 95 },
];

const AMENITY_ICONS: Record<string, string> = {
  'Free WiFi': '📶', 'Pool': '🏊', 'Spa': '💆', 'Gym': '💪',
  'Restaurant': '🍽️', 'Parking': '🅿️', 'AC': '❄️', 'Bar': '🍸',
};

export default function HomeClient({ initialHotels, recentReviews = [] }: { initialHotels: any[], recentReviews?: any[] }) {
  const router = useRouter();
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [searchData, setSearchData] = useState({
    propertyType: 'Hotels',
    location: '',
    checkIn: '',
    checkOut: '',
    rooms: 1,
    adults: 2,
    children: 0
  });
  const [stayType, setStayType] = useState<'night' | 'hourly' | 'getaways'>('night');
  const [recentlyViewed, setRecentlyViewed] = useState<any[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('staybuddy_recently_viewed');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentlyViewed(parsed);
          return;
        }
      }
    } catch (e) {}
    if (initialHotels && initialHotels.length > 0) {
      setRecentlyViewed(initialHotels.slice(0, 4));
    }
  }, [initialHotels]);

  const [hotels, setHotels] = useState<any[]>(initialHotels);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [userWishlistIds, setUserWishlistIds] = useState<string[]>([]);
  
  // Smart Dynamic Destinations: Consolidates localities (e.g. Shamshabad -> Hyderabad) without duplicate cards
  const allDestinations = useMemo(() => {
    const map = new Map<string, { city: string; country: string; hotels: number }>();
    
    // Seed with curated major hubs
    DESTINATIONS.forEach(d => {
      const canonical = resolveParentCity(d.city);
      map.set(canonical.toLowerCase(), { ...d, city: canonical });
    });

    // Smartly consolidate database hotels under their parent metropolitan cities
    (hotels || []).forEach((h: any) => {
      const raw = h.city || h.area || h.location || '';
      if (raw && typeof raw === 'string') {
        const canonical = resolveParentCity(raw);
        if (canonical) {
          const key = canonical.toLowerCase();
          if (map.has(key)) {
            const item = map.get(key)!;
            item.hotels = (item.hotels || 0) + 1;
          } else {
            map.set(key, {
              city: canonical,
              country: h.country || 'India',
              hotels: 1,
            });
          }
        }
      }
    });

    return Array.from(map.values());
  }, [hotels]);
  
  // Fetch Wishlist on load
  useEffect(() => {
    fetch('/api/wishlist')
      .then(res => res.json())
      .then(data => {
        if (data.wishlistIds) {
          setUserWishlistIds(data.wishlistIds);
        }
      })
      .catch(e => console.error('Wishlist fetch error', e));
  }, []);
  
  // Date Picker State
  const [showStickySearch, setShowStickySearch] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateSelection, setActiveDateSelection] = useState<'checkIn' | 'checkOut'>('checkIn');

  // Guest Picker State
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} '${String(date.getFullYear()).slice(2)}`;
  };

  const formatUnifiedDate = (dateString: string) => {
    if (!dateString) return { dayMonth: 'Add Date', weekday: 'Select' };
    const d = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dd = String(d.getDate()).padStart(2, '0');
    const month = months[d.getMonth()];
    const yy = String(d.getFullYear()).slice(2);
    const weekday = days[d.getDay()];
    return {
      dayMonth: `${dd} ${month} '${yy}`,
      weekday: weekday,
      full: `${dd} ${month} '${yy}, ${weekday}`
    };
  };

  const nightsCount = useMemo(() => {
    const inDate = searchData.checkIn || todayStr;
    const outDate = searchData.checkOut || tomorrowStr;
    const inD = new Date(inDate);
    const outD = new Date(outDate);
    const diff = Math.round((outD.getTime() - inD.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [searchData.checkIn, searchData.checkOut, todayStr, tomorrowStr]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchData.location.trim()) {
      setSearchError('Please enter a destination to search.');
      setTimeout(() => setSearchError(''), 3000);
      document.getElementById('location-search-trigger')?.click();
      return;
    }
    const checkInToUse = searchData.checkIn || todayStr;
    const checkOutToUse = searchData.checkOut || tomorrowStr;
    
    setSearchError('');
    const params = new URLSearchParams({
      ...(searchData.propertyType && searchData.propertyType !== 'All' && { propertyType: searchData.propertyType }),
      ...(searchData.location && { city: searchData.location }),
      checkIn: checkInToUse,
      checkOut: checkOutToUse,
      rooms: searchData.rooms.toString(),
      adults: searchData.adults.toString(),
      children: searchData.children.toString(),
    });
    router.push(`/hotels?${params.toString()}`);
  }

  const today = new Date().toISOString().split('T')[0];

    const renderSearchBar = () => (
      <>
        <style>{`
          @keyframes slideDownFade {
            0% { opacity: 0; transform: translateY(-16px) scale(0.99); }
            100% { opacity: 1; transform: none; }
          }
          .hero-search-wrapper {
            animation: slideDownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            background: #ffffff;
            border-radius: 20px;
            box-shadow: 0 12px 36px rgba(0,0,0,0.08);
            border: 1px solid #f1f5f9;
            padding: 16px;
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            position: relative;
            z-index: 50;
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .staytype-tab-btn {
            flex: 1;
            padding: 8px 12px;
            border-radius: 10px;
            font-size: 0.82rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: all 0.2s ease;
          }
          @media (min-width: 1025px) {
            .hero-search-wrapper {
              display: grid !important;
              grid-template-columns: 2.2fr 2fr 1.6fr auto !important;
              align-items: center !important;
              padding: 16px 20px !important;
              gap: 12px !important;
            }
            .hero-search-top-tabs {
              grid-column: 1 / -1 !important;
            }
            .hero-search-btn {
              height: 58px !important;
              width: auto !important;
              padding: 0 32px !important;
              border-radius: 14px !important;
              margin: 0 !important;
            }
          }
        `}</style>

        <div className="hero-search-wrapper">
          {/* Top Switcher Tabs (MakeMyTrip Mobile Search Model Photo 2) */}
          <div className="hero-search-top-tabs" style={{ display: 'flex', gap: 8, paddingBottom: 6 }}>
            {[
              { id: 'night', label: 'By Night', icon: '🏨' },
              { id: 'hourly', label: 'Hourly Stays', icon: '⏱️' },
              { id: 'getaways', label: 'Nearby Getaways', icon: '🌴' },
            ].map(tab => {
              const isSelected = stayType === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className="staytype-tab-btn"
                  onClick={() => setStayType(tab.id as any)}
                  style={{
                    border: isSelected ? '2px solid var(--brand-500)' : '1px solid #e2e8f0',
                    background: isSelected ? '#fff7ed' : '#ffffff',
                    color: isSelected ? 'var(--brand-700)' : '#475569',
                    fontWeight: isSelected ? 800 : 600,
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Location Block */}
          <div className="hero-search-item" style={{ minWidth: 0 }}>
            <LocationSearch 
              city={searchData.location} 
              onChange={c => setSearchData(p => ({ ...p, location: c }))} 
            />
          </div>

          {/* Unified Dates Block (Photo 2 MakeMyTrip & StayBuddy Layout) */}
          <div
            className="hero-search-item"
            onClick={() => { setShowDatePicker(true); setActiveDateSelection('checkIn'); }}
            style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '10px 14px',
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              transition: 'border 0.2s',
              minHeight: '58px',
              boxSizing: 'border-box'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-300)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            {/* Check-In */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <div>
                <div suppressHydrationWarning style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {formatUnifiedDate(searchData.checkIn || todayStr).dayMonth}
                </div>
                <div suppressHydrationWarning style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {formatUnifiedDate(searchData.checkIn || todayStr).weekday}
                </div>
              </div>
            </div>

            {/* Night Pill Badge */}
            <div style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '20px',
              padding: '3px 8px',
              fontSize: '0.68rem',
              fontWeight: 800,
              color: '#334155',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              flexShrink: 0
            }}>
              {nightsCount} {nightsCount === 1 ? 'NIGHT' : 'NIGHTS'}
            </div>

            {/* Check-Out */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 0, textAlign: 'right' }}>
              <div>
                <div suppressHydrationWarning style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
                  {formatUnifiedDate(searchData.checkOut || tomorrowStr).dayMonth}
                </div>
                <div suppressHydrationWarning style={{ fontSize: '0.7rem', color: '#64748b' }}>
                  {formatUnifiedDate(searchData.checkOut || tomorrowStr).weekday}
                </div>
              </div>
            </div>
          </div>

          {/* Date Picker Overlay */}
          {mounted && showDatePicker && createPortal(
            <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setShowDatePicker(false)} />
              <div className="responsive-popup" style={{ position: 'relative', background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                 <DateRangePicker 
                   checkIn={searchData.checkIn || todayStr} 
                   checkOut={searchData.checkOut || tomorrowStr}
                   onChange={(inDate, outDate) => setSearchData(p => ({ ...p, checkIn: inDate, checkOut: outDate }))}
                   onClose={() => setShowDatePicker(false)}
                   activeSelection={activeDateSelection}
                   setActiveSelection={setActiveDateSelection}
                 />
              </div>
            </div>,
            document.body
          )}

          {/* Guests Block */}
          <div
            className="hero-search-item"
            onClick={() => setShowGuestPicker(!showGuestPicker)}
            style={{
              background: '#f8fafc',
              borderRadius: '12px',
              padding: '10px 14px',
              minWidth: 0,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              border: '1px solid #e2e8f0',
              transition: 'border 0.2s',
              minHeight: '58px',
              boxSizing: 'border-box'
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-300)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {searchData.rooms} Room{searchData.rooms > 1 ? 's' : ''}, {searchData.adults} Adult{searchData.adults > 1 ? 's' : ''} &amp; {searchData.children} Child{searchData.children === 1 ? '' : 'ren'}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Occupancy &amp; Pricing</div>
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Guest Selector Popup */}
          {mounted && showGuestPicker && createPortal(
            <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }} onClick={(e) => { e.stopPropagation(); setShowGuestPicker(false); }} />
              <div className="responsive-popup" onClick={e => e.stopPropagation()} style={{ position: 'relative', background: 'white', borderRadius: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', padding: 'var(--space-5)', width: 320, maxWidth: '100%', cursor: 'default' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rooms</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max 3 adults / room</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
                      <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => {
                        const adj = adjustRoomsAndAdults(p.rooms, p.adults, 'rooms', p.rooms - 1);
                        return { ...p, rooms: adj.rooms, adults: adj.adults };
                      })}>−</button>
                      <span style={{ fontWeight: 700, width: 20, textAlign: 'center' }}>{searchData.rooms}</span>
                      <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => {
                        const adj = adjustRoomsAndAdults(p.rooms, p.adults, 'rooms', Math.min(10, p.rooms + 1));
                        return { ...p, rooms: adj.rooms, adults: adj.adults };
                      })}>+</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Adults</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max {searchData.rooms * MAX_ADULTS_PER_ROOM} for {searchData.rooms} room{searchData.rooms > 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
                      <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => {
                        const adj = adjustRoomsAndAdults(p.rooms, p.adults, 'adults', p.adults - 1);
                        return { ...p, rooms: adj.rooms, adults: adj.adults };
                      })}>−</button>
                      <span style={{ fontWeight: 700, width: 20, textAlign: 'center' }}>{searchData.adults}</span>
                      <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => {
                        const adj = adjustRoomsAndAdults(p.rooms, p.adults, 'adults', Math.min(30, p.adults + 1));
                        return { ...p, rooms: adj.rooms, adults: adj.adults };
                      })}>+</button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Children</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>0 - 17 Years Old</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
                      <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, children: Math.max(0, p.children - 1) }))}>−</button>
                      <span style={{ fontWeight: 700, width: 20, textAlign: 'center' }}>{searchData.children}</span>
                      <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, children: Math.min(10, p.children + 1) }))}>+</button>
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 10px',
                    borderRadius: '8px',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    color: '#1e40af',
                    fontSize: '0.75rem',
                    lineHeight: 1.3
                  }}>
                    💡 <strong>Max 3 adults per room.</strong> Adding 4 or more adults automatically calculates rooms and occupancy pricing.
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Full-Width Search Button in StayBuddy Gradient */}
          <button
            type="button"
            className="hero-search-btn"
            onClick={handleSearch}
            style={{ 
              background: 'linear-gradient(135deg, #ff6b35, #ea580c, #f97316)', 
              color: '#ffffff', 
              border: 'none', 
              borderRadius: '12px', 
              padding: '16px 32px', 
              fontSize: '1.05rem', 
              fontWeight: 900, 
              cursor: 'pointer',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: '0 8px 24px rgba(255, 107, 53, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              position: 'relative',
              overflow: 'hidden',
              width: '100%'
            }}
          >
            <span>SEARCH HOTELS</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        {/* Limited Time Offer Card Banner (Photo 2) */}
        <div style={{
          marginTop: 14,
          width: '100%',
          background: 'linear-gradient(135deg, #ff8c42, #f59e0b)',
          borderRadius: '18px',
          padding: '16px 20px',
          color: 'white',
          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          <div style={{
            display: 'inline-block',
            alignSelf: 'flex-start',
            background: 'rgba(255, 255, 255, 0.25)',
            padding: '2px 10px',
            borderRadius: '20px',
            fontSize: '0.68rem',
            fontWeight: 800,
            letterSpacing: '0.06em',
            textTransform: 'uppercase'
          }}>
            LIMITED TIME OFFER
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 900, lineHeight: 1.2 }}>
            Get 20% Off Your First Booking!
          </div>
          <div style={{ fontSize: '0.82rem', opacity: 0.95 }}>
            Use code <strong style={{ textDecoration: 'underline' }}>STAYBUDDY20</strong> at checkout. Valid across all verified hotels.
          </div>
        </div>

        {/* Recently Viewed Hotels Strip (MakeMyTrip Mobile Photo 2) */}
        {recentlyViewed && recentlyViewed.length > 0 && (
          <div style={{ marginTop: 24, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Recently Viewed</h3>
            </div>
            <div style={{
              display: 'flex',
              gap: 14,
              overflowX: 'auto',
              paddingBottom: 8,
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              margin: '0 -4px'
            }}>
              {recentlyViewed.map((item) => (
                <Link
                  key={item._id}
                  href={`/hotels/${item._id}`}
                  style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0, width: 220, scrollSnapAlign: 'start' }}
                >
                  <div style={{
                    background: 'white',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                    transition: 'transform 0.2s',
                  }}>
                    <div style={{ position: 'relative', height: 125, width: '100%', background: '#e2e8f0' }}>
                      {item.images?.[0] ? (
                        <img
                          src={item.images[0]}
                          alt={item.name}
                          draggable={false}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '2rem' }}>🏨</div>
                      )}
                    </div>
                    <div style={{ padding: '10px 12px' }}>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ color: '#f59e0b' }}>★</span> {item.avgRating ? Number(item.avgRating).toFixed(1) : '4.2'} ({item.totalReviews || 75})
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 3 }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.area ? `${item.area}, ` : ''}{item.city}
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a' }}>
                          ₹{Number(item.startingPrice || 3500).toLocaleString('en-IN')}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>Per Night</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </>
    );

  return (
    <div>
      <style>{`
        @media (max-width: 1024px) {
          /* MASTER FIX: prevent ANY element from causing horizontal scroll */
          * { box-sizing: border-box !important; }
          
          /* Hero section full width */
          .hero-section-container { padding: 0 12px !important; }
          
          /* Search wrapper: column on mobile */
          .hero-search-wrapper {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 10px !important;
            gap: 8px !important;
          }
          
          /* All search items: full width */
          .hero-search-item {
            width: 100% !important;
            flex: none !important;
            min-width: 0 !important;
            box-sizing: border-box !important;
          }
          
          /* Search button: full width */
          .hero-search-btn {
            width: 100% !important;
            flex: none !important;
            margin: 0 !important;
            border-radius: 12px !important;
            padding: 14px !important;
          }
          
          /* Hotel cards in scroll rows: smaller on mobile */
          .hotel-scroll-card { width: 260px !important; }
          
          /* Destination cards scroll: ensure doesn't overflow */
          .dest-scroll-row { padding-bottom: 8px !important; }
        }
        
        @media (max-width: 390px) {
          .hero-search-wrapper { padding: 8px !important; }
          .hotel-scroll-card { width: 220px !important; }
        }
      `}</style>
      
      {/* Helper to render property selector */}
      {(() => {
        const renderPropertySelector = (isCompact = false) => (
          <div 
            className="hide-scrollbar"
            style={{ 
              display: 'flex', 
              gap: 0, 
              overflowX: 'auto', 
              borderRadius: isCompact ? 'var(--radius-full)' : 'var(--radius-xl)', 
              boxShadow: isCompact ? '0 2px 10px rgba(0,0,0,0.05)' : '0 4px 20px rgba(0,0,0,0.08)',
              width: 'fit-content',
              maxWidth: '100%',
              background: 'white',
              WebkitOverflowScrolling: 'touch',
              border: isCompact ? '1px solid var(--border)' : 'none'
            }}>
            {[
              { id: 'Hotel', label: 'Hotels', icon: '🏨' },
              { id: 'Resort', label: 'Resorts', icon: '🌴' },
              { id: 'Villa', label: 'Villas', icon: '🏡' },
              { id: 'Homestay', label: 'Homestays', icon: '🏘️' },
              { id: 'HolidayPackage', label: 'Packages', icon: '🎒' }
            ].map((card, index, array) => {
              const isLast = index === array.length - 1;
              const isActive = searchData.propertyType === card.id;
              return (
                <div
                  key={card.id}
                  onClick={() => {
                    const isOpening = searchData.propertyType !== card.id;
                    setSearchData(p => ({ ...p, propertyType: isOpening ? card.id : '' }));
                    
                    if (isOpening) {
                      if (window.scrollY > 200) {
                        setShowStickySearch(true);
                      }
                      if (!searchData.location) {
                        setTimeout(() => document.getElementById('location-search-trigger')?.click(), 300);
                      }
                    } else {
                      setShowStickySearch(false);
                    }
                  }}
                  style={{
                    position: 'relative',
                    background: isActive ? 'var(--brand-50, #fff7ed)' : 'white',
                    borderRight: isLast ? 'none' : '1px solid var(--border)',
                    padding: isCompact ? '6px 16px' : '12px 24px',
                    cursor: 'pointer',
                    minWidth: 0,
                    flex: '1 0 auto',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: isCompact ? 'row' : 'column',
                    gap: isCompact ? 6 : 8,
                    overflow: 'hidden'
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'var(--brand-50, #fff7ed)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'white';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  <div style={{
                    fontSize: isCompact ? '1.2rem' : '1.6rem',
                    transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                    transform: isActive ? 'translateY(-2px) scale(1.15)' : 'translateY(0) scale(1)',
                    filter: isActive ? 'drop-shadow(0 4px 6px rgba(255, 107, 53, 0.25))' : 'none'
                  }}>
                    {card.icon}
                  </div>
                  <div style={{
                    color: isActive ? 'var(--brand-700, #c2410c)' : 'var(--text-primary)',
                    fontWeight: 800,
                    fontSize: isCompact ? '0.8rem' : '0.85rem',
                    letterSpacing: '0.02em',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.2s ease'
                  }}>
                    {card.label}
                  </div>

                  {/* Active Indicator Underline Glow */}
                  {isActive && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: '12%',
                        right: '12%',
                        height: 3,
                        background: 'linear-gradient(90deg, #ff6b35, #ea580c)',
                        borderRadius: '3px 3px 0 0',
                        boxShadow: '0 -2px 8px rgba(255, 107, 53, 0.45)',
                        animation: 'fadeIn 0.25s ease'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        );

        return (
          <>
            {/* Property Selector for Hero and Navbar */}
            <Navbar 
              middleContent={renderPropertySelector(true)}
              extendedContent={showStickySearch ? renderSearchBar() : null}
            />

            {/* HERO SECTION WITH INLINE PROPERTY TYPES */}
            <div style={{ background: 'var(--bg-secondary)', padding: '24px 0 0 0', marginTop: '-8px' }}>
              <div className="container hero-section-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
                {renderPropertySelector(false)}
              </div>
            </div>
          </>
        );
      })()}

      {/* SEARCH BAR SECTION */}
      <div style={{
        maxHeight: searchData.propertyType ? '1000px' : '0px',
        opacity: searchData.propertyType ? 1 : 0,
        overflow: searchData.propertyType ? 'visible' : 'hidden',
        transition: 'max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-in-out',
        background: 'var(--bg-secondary)',
        marginTop: '-8px',
        position: 'relative',
        zIndex: 100
      }}>
        <section style={{ paddingBottom: '20px', paddingTop: '24px' }}>
          <div className="container hero-section-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
            
            {searchData.propertyType && renderSearchBar()}
            {searchError && (
              <div style={{ marginTop: 12, color: 'white', background: '#ef4444', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.9rem', fontWeight: 600, animation: 'fadeIn 0.3s ease' }}>
                {searchError}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ===== TRENDING DESTINATIONS ===== */}
      <section style={{ padding: '20px 0 10px', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-block', background: 'var(--brand-50)', color: 'var(--brand-700)', padding: '4px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Popular Destinations</div>
            <h2>Trending <span style={{ color: 'var(--brand-600)' }}>Right Now</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Top-rated destinations loved by millions of travelers</p>
          </div>
          <div style={{
            display: 'flex', gap: 16, overflowX: 'auto',
            padding: '12px 4px 24px', scrollSnapType: 'x mandatory',
            scrollbarWidth: 'thin', scrollbarColor: 'var(--brand-200) transparent',
            margin: '-10px -4px 0'
          }}>
            {allDestinations.map((dest, index) => (
              <CityDestinationCard
                key={dest.city}
                city={dest.city}
                country={dest.country}
                hotels={dest.hotels}
                isLast={index === allDestinations.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROMOTIONAL BANNER ===== */}
      <section className="container" style={{ margin: '20px auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #d97706 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6) var(--space-8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          boxShadow: '0 16px 36px -8px rgba(234, 88, 12, 0.35)',
          position: 'relative',
          overflow: 'hidden',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease'
        }}>
          {/* Floating celebratory decorative graphics */}
          <div style={{ position: 'absolute', right: '-3%', top: '-20%', fontSize: '9rem', opacity: 0.14, pointerEvents: 'none', animation: 'floatGentle 4s ease-in-out infinite' }}>🎉</div>
          <div style={{ position: 'absolute', left: '42%', bottom: '-15%', fontSize: '5rem', opacity: 0.08, pointerEvents: 'none', animation: 'floatGentle 3.5s ease-in-out infinite' }}>✨</div>
          
          <div style={{ position: 'relative', zIndex: 1, flex: '1 1 400px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.22)', backdropFilter: 'blur(4px)', color: 'white', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 800, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <span>⚡</span> Limited Time Offer
            </div>
            <h2 style={{ color: 'white', marginBottom: 8, fontSize: '1.8rem', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Get 20% Off Your First Booking!</h2>
            <p style={{ color: 'rgba(255,255,255,0.95)', fontSize: '1.02rem', margin: 0, lineHeight: 1.5 }}>
              Use coupon <span style={{ background: 'rgba(255,255,255,0.25)', border: '1px dashed rgba(255,255,255,0.7)', padding: '2px 8px', borderRadius: 6, fontWeight: 900, letterSpacing: '0.04em' }}>STAYBUDDY20</span> at checkout across all premium hotels.
            </p>
          </div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Link href="/hotels" style={{
              background: 'white', color: '#ea580c', fontWeight: 800, padding: '14px 28px', 
              borderRadius: 'var(--radius-lg)', textDecoration: 'none', display: 'inline-flex',
              alignItems: 'center', gap: 6,
              boxShadow: '0 8px 20px -4px rgba(0,0,0,0.2)', transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px) scale(1.04)';
              e.currentTarget.style.boxShadow = '0 12px 24px -4px rgba(0,0,0,0.25)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0) scale(1)';
              e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(0,0,0,0.2)';
            }}>
              Claim Discount →
            </Link>
          </div>
        </div>
      </section>

      {/* ===== BUDGET STAYS CARD ===== */}
      <section className="container" style={{ marginBottom: '32px' }}>
        <Link href="/hotels?maxPrice=1199" style={{ textDecoration: 'none' }}>
          <div style={{
            position: 'relative',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6) var(--space-8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            overflow: 'hidden',
            minHeight: '200px'
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 20px 40px rgba(0,0,0,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
            
            {/* Background Image & Overlay */}
            <div style={{
              position: 'absolute', inset: 0, zIndex: 0,
              backgroundImage: 'url("https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80")',
              backgroundSize: 'cover', backgroundPosition: 'center'
            }} />
            <div style={{
              position: 'absolute', inset: 0, zIndex: 1,
              background: 'linear-gradient(to right, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.6) 50%, rgba(15, 23, 42, 0.2) 100%)'
            }} />

            <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ 
                background: 'var(--brand-500)', color: 'white', width: 64, height: 64, 
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '2rem', boxShadow: '0 8px 16px rgba(249, 115, 22, 0.4)' 
              }}>
                💸
              </div>
              <div>
                <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', color: 'white', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Pocket Friendly
                </div>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.8rem', fontWeight: 800, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>Hotels under ₹1,199</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '1rem', marginTop: 4, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>Affordable stays without compromising on comfort.</p>
              </div>
            </div>
            <div style={{ 
              position: 'relative', zIndex: 2, background: 'white', color: 'var(--brand-600)', 
              width: 48, height: 48, borderRadius: '50%', display: 'flex', alignItems: 'center', 
              justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
            }}>
              →
            </div>
          </div>
        </Link>
      </section>

      {/* ===== RECENT REVIEWS ===== */}
      {recentReviews && recentReviews.length > 0 && (
        <section style={{ padding: '24px 0', background: 'var(--bg-secondary)' }}>
          <div className="container">
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
              <h2>What Our <span style={{ color: 'var(--brand-600)' }}>Guests</span> Say</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Real reviews from verified bookings</p>
            </div>
            
            <div className="hide-scrollbar" style={{ display: 'flex', overflowX: 'auto', gap: 'var(--space-5)', paddingBottom: 'var(--space-4)', scrollSnapType: 'x mandatory' }}>
              {recentReviews.map(review => (
                <div key={review._id} className="card" style={{ minWidth: 300, maxWidth: 350, flex: '0 0 auto', scrollSnapAlign: 'start', padding: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{review.title}</div>
                    <div style={{ background: 'var(--brand-500)', color: 'white', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontWeight: 800, fontSize: '0.8rem' }}>
                      {review.rating.toFixed(1)} ⭐
                    </div>
                  </div>
                  
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1, margin: 0, fontStyle: 'italic' }}>
                    &quot;{review.comment}&quot;
                  </p>
                  
                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{review.customerName}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 2 }}>Stayed at <span style={{ color: 'var(--brand-600)' }}>{review.hotelName}</span></div>
                    <div suppressHydrationWarning style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: 4 }}>{new Date(review.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ===== FEATURED HOTELS ===== */}
      <section style={{ padding: '24px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h2>Featured <span style={{ color: 'var(--brand-600)' }}>Hotels</span></h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Hand-picked top-rated stays for you</p>
            </div>
            <Link href="/hotels" className="btn btn-outline">View All Hotels →</Link>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
              {[1,2,3].map(i => (
                <div key={i} className="card">
                  <div className="skeleton" style={{ height: 220, borderRadius: 0 }} />
                  <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div className="skeleton" style={{ height: 20, width: '70%' }} />
                    <div className="skeleton" style={{ height: 14, width: '50%' }} />
                    <div className="skeleton" style={{ height: 16, width: '40%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : hotels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏨</div>
              <h3 style={{ color: 'var(--text-secondary)' }}>Hotels Coming Soon!</h3>
              <p style={{ marginTop: 8 }}>Be the first to list your hotel on StayBuddy.</p>
              <Link href="/partner/login" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>List Your Hotel</Link>
            </div>
          ) : (
            <div style={{
              display: 'flex', gap: 'var(--space-6)', overflowX: 'auto',
              padding: '10px 4px 30px', scrollSnapType: 'x mandatory',
              scrollbarWidth: 'thin', scrollbarColor: 'var(--brand-200) transparent',
              margin: '-10px -4px 0'
            }}>
              {hotels.map(hotel => (
                <div key={hotel._id} className="hotel-scroll-card" style={{ flexShrink: 0, width: '320px', scrollSnapAlign: 'start' }}>
                  <HotelCard hotel={hotel} isWishlisted={userWishlistIds.includes(hotel._id)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== HOTEL COLLECTIONS CARDS ===== */}
      <section className="container" style={{ marginBottom: 'var(--space-8)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-6)' }}>
          
          {/* Card 1 */}
          <div style={{
            background: 'linear-gradient(135deg, var(--brand-50), var(--brand-100))',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)',
            border: '1px solid var(--brand-200)', position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ position: 'absolute', right: '5%', bottom: '-10%', fontSize: '6rem', opacity: 0.1, pointerEvents: 'none' }}>🏨</div>
            <div style={{ position: 'relative', zIndex: 1, marginBottom: 24 }}>
              <div style={{ display: 'inline-block', background: 'white', color: 'var(--brand-700)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', border: '1px solid var(--brand-200)' }}>Curated Collections</div>
              <h3 style={{ color: 'var(--brand-900)', marginBottom: 8, fontSize: '1.4rem' }}>Premium Hotel Groups</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>Discover luxury heritage chains and exclusive beachfront resorts.</p>
            </div>
            <Link href="/hotels?category=luxury" style={{ color: 'var(--brand-600)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, position: 'relative', zIndex: 1 }}>
              View Collection →
            </Link>
          </div>

          {/* Card 2 */}
          <div style={{
            background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)',
            border: '1px solid #99f6e4', position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ position: 'absolute', right: '5%', bottom: '-10%', fontSize: '6rem', opacity: 0.1, pointerEvents: 'none' }}>🌴</div>
            <div style={{ position: 'relative', zIndex: 1, marginBottom: 24 }}>
              <div style={{ display: 'inline-block', background: 'white', color: '#0f766e', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', border: '1px solid #99f6e4' }}>Trending</div>
              <h3 style={{ color: '#134e4a', marginBottom: 8, fontSize: '1.4rem' }}>Beachfront Resorts</h3>
              <p style={{ color: '#0f766e', fontSize: '0.95rem', margin: 0, opacity: 0.8 }}>Escape to top-rated seaside getaways with private beaches.</p>
            </div>
            <Link href="/hotels?propertyType=Resort" style={{ color: '#0d9488', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, position: 'relative', zIndex: 1 }}>
              Explore Resorts →
            </Link>
          </div>

          {/* Card 3 */}
          <div style={{
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            borderRadius: 'var(--radius-xl)', padding: 'var(--space-6)',
            border: '1px solid #fcd34d', position: 'relative', overflow: 'hidden',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
          }}>
            <div style={{ position: 'absolute', right: '5%', bottom: '-10%', fontSize: '6rem', opacity: 0.1, pointerEvents: 'none' }}>🏰</div>
            <div style={{ position: 'relative', zIndex: 1, marginBottom: 24 }}>
              <div style={{ display: 'inline-block', background: 'white', color: '#b45309', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', border: '1px solid #fcd34d' }}>Experiences</div>
              <h3 style={{ color: '#78350f', marginBottom: 8, fontSize: '1.4rem' }}>Heritage Stays</h3>
              <p style={{ color: '#b45309', fontSize: '0.95rem', margin: 0, opacity: 0.8 }}>Experience royal treatment at historical palaces and forts.</p>
            </div>
            <Link href="/hotels?minRating=5" style={{ color: '#d97706', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, position: 'relative', zIndex: 1 }}>
              See Heritage Stays →
            </Link>
          </div>

        </div>
      </section>

      {/* ===== APP PROMO CARD ===== */}
      <AppPromoCard />
      <HomeReferralSection />
      <HomeStatsSection />

      {/* ===== WHY STAYBUDDY ===== */}
      <section className="section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2>Why <span style={{ color: 'var(--brand-600)' }}>StayBuddy?</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>We make booking effortless and transparent</p>
          </div>
          <div style={{
            display: 'flex', gap: 16, overflowX: 'auto',
            paddingBottom: '20px', scrollSnapType: 'x mandatory',
            scrollbarWidth: 'thin', scrollbarColor: 'var(--brand-200) transparent'
          }}>
            {[
              { icon: '🔒', title: 'Secure Booking', desc: 'Your payments are protected with bank-grade security and Razorpay encryption.' },
              { icon: '💸', title: 'Best Price Guarantee', desc: 'Find a cheaper rate elsewhere? We\'ll match it — no questions asked.' },
              { icon: '⚡', title: 'Instant Confirmation', desc: 'Book in under 2 minutes. Get your confirmation email immediately.' },
              { icon: '📞', title: '24/7 Support', desc: 'Our team is always available to help with any booking or travel concern.' },
              { icon: '🌟', title: 'Verified Reviews', desc: 'Only real guests can write reviews — so you always know what to expect.' },
              { icon: '🏨', title: 'Curated Properties', desc: 'Every hotel is verified by our team before going live on the platform.' },
            ].map(item => (
              <div key={item.title} style={{ 
                textAlign: 'center', padding: 'var(--space-6)', flexShrink: 0, 
                scrollSnapAlign: 'start', width: 280,
                background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>{item.icon}</div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 8 }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PARTNER CTA ===== */}
      <section style={{ background: 'var(--brand-500)', padding: '80px 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'white', marginBottom: 16 }}>Own a Hotel? Join StayBuddy</h2>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', maxWidth: 520, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Reach millions of travelers, manage bookings in real-time, and grow your revenue — all in one powerful dashboard.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link href="/login" style={{ background: 'white', color: 'var(--brand-700)', fontWeight: 700, padding: '14px 28px', borderRadius: 'var(--radius-lg)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, transition: 'all var(--transition-fast)' }}>
              🚀 Start For Free
            </Link>
            <Link href="/hotels" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, padding: '14px 28px', borderRadius: 'var(--radius-lg)', textDecoration: 'none', border: '2px solid rgba(255,255,255,0.3)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              See How It Works
            </Link>
          </div>
        </div>
      </section>



      {/* ===== FOOTER ===== */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '60px 0 32px' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ marginBottom: 12 }}>
                <Logo size="md" light={true} />
              </div>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#64748b' }}>India&apos;s trusted OTA platform for hotel bookings — from budget to luxury.</p>
            </div>
            {[
              { title: 'Explore', links: ['Hotels', 'Destinations', 'Deals', 'Visiting Card', 'Official Logo'] },
              { title: 'Partners', links: ['List Your Hotel', 'Partner Login', 'Partner Resources', 'Success Stories'] },
              { title: 'Support', links: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 700, color: 'white', marginBottom: 12, fontSize: '0.9rem' }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.links.map(link => (
                    <Link key={link} href={link === 'Partner Login' || link === 'List Your Hotel' ? '/partner/login' : link === 'Hotels' ? '/hotels' : link === 'Visiting Card' ? '/visiting-card' : link === 'Official Logo' ? '/logo' : '#'} style={{ fontSize: '0.875rem', color: '#64748b', transition: 'color var(--transition-fast)', textDecoration: 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--brand-400)')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}>{link}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 24, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: '0.8rem', color: '#64748b' }}>
            <span>© 2026 StayBuddy. All rights reserved.</span>
            <span>Made with ❤️ in India</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HotelCard({ hotel, isWishlisted }: { hotel: any, isWishlisted?: boolean }) {
  const [imgIndex, setImgIndex] = useState(0);

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hotel.images?.length > 1) {
      setImgIndex(prev => (prev + 1) % hotel.images.length);
    }
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (hotel.images?.length > 1) {
      setImgIndex(prev => (prev === 0 ? hotel.images.length - 1 : prev - 1));
    }
  };

  return (
    <Link href={`/hotels/${hotel._id}`} style={{ textDecoration: 'none' }}>
      <div className="card card-hover hotel-card" style={{ height: '100%' }}>
        <div className="hotel-card-img-wrapper" style={{ position: 'relative', width: '100%', height: '220px' }}>
          {hotel.images?.[imgIndex] ? (
            <Image src={hotel.images[imgIndex]} alt={hotel.name} fill className="hotel-card-img" style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
          ) : (
            <div className="hotel-card-img" style={{ background: 'linear-gradient(135deg, var(--brand-100), var(--brand-200))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏨</div>
          )}
          
          <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5 }}>
            <span className={`badge badge-${hotel.category === 'luxury' ? 'warning' : hotel.category === 'premium' ? 'primary' : 'gray'}`} style={{ backdropFilter: 'blur(4px)' }}>
              {'⭐'.repeat(hotel.starRating)}
            </span>
          </div>

          <WishlistButton hotelId={hotel._id} initialIsWishlisted={isWishlisted} />

          {/* Slider Controls */}
          {hotel.images?.length > 1 && (
            <>
              <button 
                onClick={handlePrev}
                style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'background 0.2s', zIndex: 2 }}
                onMouseEnter={e => e.currentTarget.style.background = 'white'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <button 
                onClick={handleNext}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'background 0.2s', zIndex: 2 }}
                onMouseEnter={e => e.currentTarget.style.background = 'white'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.8)'}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>

              {/* Dots */}
              <div style={{ position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 2 }}>
                {hotel.images.map((_: any, idx: number) => (
                  <div key={idx} style={{ width: 6, height: 6, borderRadius: '50%', background: idx === imgIndex ? 'white' : 'rgba(255,255,255,0.5)', transition: 'background 0.2s' }} />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="card-body">
          <h3 style={{ fontSize: '1rem', marginBottom: 4 }}>{hotel.name}</h3>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
            {hotel.city}, {hotel.country}
          </div>
          {hotel.avgRating > 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <div style={{ background: 'var(--brand-500)', color: 'white', fontWeight: 700, fontSize: '0.8rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>★ {hotel.avgRating.toFixed(1)}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({hotel.totalReviews} {hotel.totalReviews === 1 ? 'review' : 'reviews'})</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', border: '1px solid #f1f5f9' }}>⭐ New on StayBuddy</span>
            </div>
          )}
          {typeof hotel.roomsLeft === 'number' && (
            <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, marginTop: hotel.avgRating > 0 ? 0 : 8, marginBottom: 8 }}>
              {hotel.roomsLeft} {hotel.roomsLeft === 1 ? 'room' : 'rooms'} left!
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div>
              {hotel.startingPrice && Number(hotel.startingPrice) > 0 ? (
                <>
                  <span className="price" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                    ₹{Number(hotel.startingPrice).toLocaleString('en-IN')}
                  </span>
                  <span className="price-suffix" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}> /night</span>
                </>
              ) : (
                <span className="price" style={{ fontSize: '1.05rem', color: 'var(--text-muted)' }}>
                  Check rates
                </span>
              )}
            </div>
            <span style={{ fontSize: '0.8rem', background: 'var(--brand-50)', color: 'var(--brand-700)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>Book Now →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
