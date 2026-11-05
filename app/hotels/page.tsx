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
            height: 200px !important;
          }
        }
      `}</style>
      <Navbar />

      {/* Search Bar */}
      <div style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)', padding: 'var(--space-4) 0', position: 'sticky', top: 68, zIndex: 100 }}>
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
              <div className="hotels-results-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                {hotels.map((hotel, index) => (
                  <Link key={hotel._id} href={`/hotels/${hotel._id}${getQueryString()}`} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                    <div className="hotel-horizontal-card">
                      {/* Image / Gallery */}
                      <div className="hotel-horizontal-img">
                        {hotel.images?.[0] ? (
                          <Image src={hotel.images[0]} alt={hotel.name} fill priority={index < 2} style={{ objectFit: 'cover' }} sizes="(max-width: 900px) 100vw, 320px" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, var(--brand-100), var(--brand-200))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏨</div>
                        )}
                        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6, zIndex: 2 }}>
                          <span className="badge badge-gray" style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.65)', color: 'white', fontWeight: 700 }}>
                            {hotel.propertyType || 'Hotel'}
                          </span>
                          <span className="badge badge-primary" style={{ backdropFilter: 'blur(4px)', background: 'rgba(59, 130, 246, 0.85)', color: 'white', fontWeight: 700 }}>
                            {hotel.category || 'Standard'}
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
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                            <h3 style={{ fontSize: '1.22rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.3 }}>{hotel.name}</h3>
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
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700 }}>
                            Best Rate Guaranteed
                          </div>
                          {hotel.startingPrice && Number(hotel.startingPrice) > 0 ? (
                            <>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, justifyContent: 'flex-end', marginTop: 4 }}>
                                <span style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--brand-700, #c2410c)', lineHeight: 1 }}>
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

                        <div style={{ width: '100%', marginTop: 16 }}>
                          <div
                            className="btn btn-primary"
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
                ))}
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
  return <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>}><HotelSearch /></Suspense>;
}
