'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Logo from '@/components/Logo';
import DateRangePicker from '@/components/DateRangePicker';
import LocationSearch from '@/components/LocationSearch';
import AppPromoCard from '@/components/AppPromoCard';
import HomeReferralSection from '@/components/HomeReferralSection';
import HomeStatsSection from '@/components/HomeStatsSection';
import Image from 'next/image';

const DESTINATIONS = [
  { city: 'Mumbai', country: 'India', emoji: '🏙️', hotels: 342 },
  { city: 'Goa', country: 'India', emoji: '🏖️', hotels: 218 },
  { city: 'Delhi', country: 'India', emoji: '🕌', hotels: 485 },
  { city: 'Jaipur', country: 'India', emoji: '🏰', hotels: 196 },
  { city: 'Manali', country: 'India', emoji: '⛰️', hotels: 87 },
  { city: 'Kerala', country: 'India', emoji: '🌴', hotels: 154 },
];

const AMENITY_ICONS: Record<string, string> = {
  'Free WiFi': '📶', 'Pool': '🏊', 'Spa': '💆', 'Gym': '💪',
  'Restaurant': '🍽️', 'Parking': '🅿️', 'AC': '❄️', 'Bar': '🍸',
};

export default function HomeClient({ initialHotels }: { initialHotels: any[] }) {
  const router = useRouter();
  const [searchData, setSearchData] = useState({ propertyType: '', location: '', checkIn: '', checkOut: '', rooms: 1, adults: 2, children: 0 });
  const [hotels, setHotels] = useState<any[]>(initialHotels);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateSelection, setActiveDateSelection] = useState<'checkIn' | 'checkOut'>('checkIn');

  // Guest Picker State
  const [showGuestPicker, setShowGuestPicker] = useState(false);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Select Date';
    const date = new Date(dateString);
    return `${date.getDate()} ${date.toLocaleString('default', { month: 'short' })} '${String(date.getFullYear()).slice(2)}`;
  };



  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchData.location.trim()) {
      setSearchError('Please enter a destination to search.');
      return;
    }
    if (!searchData.checkIn || !searchData.checkOut) {
      setSearchError('Please select both check-in and check-out dates.');
      return;
    }
    
    setSearchError('');
    const params = new URLSearchParams({
      ...(searchData.propertyType && searchData.propertyType !== 'All' && { propertyType: searchData.propertyType }),
      ...(searchData.location && { city: searchData.location }),
      ...(searchData.checkIn && { checkIn: searchData.checkIn }),
      ...(searchData.checkOut && { checkOut: searchData.checkOut }),
      rooms: searchData.rooms.toString(),
      adults: searchData.adults.toString(),
      children: searchData.children.toString(),
    });
    router.push(`/hotels?${params.toString()}`);
  }

  const today = new Date().toISOString().split('T')[0];

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
      {/* Property Selector for Hero and Navbar */}
      <Navbar middleContent={
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {[
            { id: 'Hotel', label: 'Hotels', icon: '🏨' },
            { id: 'Resort', label: 'Resorts', icon: '🌴' },
            { id: 'Villa', label: 'Villas', icon: '🏡' },
            { id: 'Homestay', label: 'Homestays', icon: '🏘️' },
            { id: 'HolidayPackage', label: 'Packages', icon: '🎒' }
          ].map(card => {
            const isActive = searchData.propertyType === card.id;
            return (
              <div
                key={card.id}
                onClick={() => setSearchData(p => ({ ...p, propertyType: p.propertyType === card.id ? '' : card.id }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  padding: '6px 12px', borderRadius: '20px',
                  background: isActive ? 'var(--brand-50)' : 'transparent',
                  border: isActive ? '1px solid var(--brand-200)' : '1px solid transparent',
                  color: isActive ? 'var(--brand-700)' : 'var(--text-primary)',
                  fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s'
                }}
              >
                <span>{card.icon}</span>
                <span className="hide-mobile">{card.label}</span>
              </div>
            );
          })}
        </div>
      } />



      {/* SEARCH BAR SECTION */}
      <section style={{ paddingBottom: '20px', paddingTop: '24px', background: 'var(--bg-secondary)', marginTop: '-8px' }}>
        <div className="container hero-section-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
          
          {searchData.propertyType && (
            <div className="fade-in hero-search-wrapper" style={{
              position: 'relative',
              marginTop: '16px',
              gap: 12,
              alignItems: 'stretch',
              background: 'white',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              padding: '12px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box',
              zIndex: 50
            }}>
              
              {/* Location Block */}
              <div className="hero-search-item" style={{ minWidth: 0 }}>
                <LocationSearch 
                  city={searchData.location} 
                  onChange={c => setSearchData(p => ({ ...p, location: c }))} 
                />
              </div>
              
              {/* Check-in Block */}
              <div className="hero-search-item"
                onClick={() => { setShowDatePicker(true); setActiveDateSelection('checkIn'); }}
                style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer', border: '1px solid transparent', transition: 'border 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-200)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
              >
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>CHECK-IN</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{searchData.checkIn ? new Date(searchData.checkIn).getDate() + ' ' + new Date(searchData.checkIn).toLocaleString('default', { month: 'short' }) : 'Add Date'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{searchData.checkIn ? new Date(searchData.checkIn).toLocaleDateString('default', { weekday: 'short', year: 'numeric' }) : 'Select Check-in'}</div>
                  </div>
                </div>
              </div>

              {/* Check-out Block */}
              <div className="hero-search-item"
                onClick={() => { setShowDatePicker(true); setActiveDateSelection('checkOut'); }}
                style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer', border: '1px solid transparent', transition: 'border 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-200)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
              >
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>CHECK-OUT</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{searchData.checkOut ? new Date(searchData.checkOut).getDate() + ' ' + new Date(searchData.checkOut).toLocaleString('default', { month: 'short' }) : 'Add Date'}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{searchData.checkOut ? new Date(searchData.checkOut).toLocaleDateString('default', { weekday: 'short', year: 'numeric' }) : 'Select Check-out'}</div>
                  </div>
                </div>
              </div>

              {showDatePicker && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={() => setShowDatePicker(false)} />
                  <div className="responsive-popup" style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 16, zIndex: 100, background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
                     <DateRangePicker 
                       checkIn={searchData.checkIn} 
                       checkOut={searchData.checkOut}
                       onChange={(inDate, outDate) => setSearchData(p => ({ ...p, checkIn: inDate, checkOut: outDate }))}
                       onClose={() => setShowDatePicker(false)}
                       activeSelection={activeDateSelection}
                       setActiveSelection={setActiveDateSelection}
                     />
                  </div>
                </>
              )}

              {/* Guests Block */}
              <div className="hero-search-item"
                onClick={() => setShowGuestPicker(!showGuestPicker)}
                style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer', border: '1px solid transparent', transition: 'border 0.2s', position: 'relative' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand-200)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
              >
                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>ROOMS & GUESTS</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{searchData.rooms} Room, {searchData.adults} Adult</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{searchData.children} Children</div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </div>

                {showGuestPicker && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 90 }} onClick={(e) => { e.stopPropagation(); setShowGuestPicker(false); }} />
                    <div className="responsive-popup" onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '100%', right: 0, marginTop: 16, zIndex: 100, background: 'white', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)', padding: 'var(--space-5)', width: 320, cursor: 'default' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        {/* Rooms */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rooms</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, rooms: Math.max(1, p.rooms - 1) }))}>−</button>
                            <span style={{ fontWeight: 700, width: 20, textAlign: 'center' }}>{searchData.rooms}</span>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, rooms: Math.min(10, p.rooms + 1) }))}>+</button>
                          </div>
                        </div>

                        {/* Adults */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Adults</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '4px 8px' }}>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, adults: Math.max(1, p.adults - 1) }))}>−</button>
                            <span style={{ fontWeight: 700, width: 20, textAlign: 'center' }}>{searchData.adults}</span>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: '1.2rem', lineHeight: 1 }} onClick={() => setSearchData(p => ({ ...p, adults: Math.min(30, p.adults + 1) }))}>+</button>
                          </div>
                        </div>

                        {/* Children */}
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
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Search Button */}
              <button className="hero-search-btn"
                onClick={handleSearch}
                style={{ 
                  background: 'linear-gradient(135deg, #ff6b35, #ea580c)', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '30px', 
                  padding: '14px 32px', 
                  fontSize: '1.1rem', 
                  fontWeight: 800, 
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 4px 15px rgba(255,107,53,0.4)',
                  flexShrink: 0,
                  alignSelf: 'center',
                  marginTop: 4,
                }}
              >
                🔍 SEARCH
              </button>
            </div>

          )}
          
          {searchError && (
            <div style={{ marginTop: 12, color: 'white', background: '#ef4444', padding: '6px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.9rem', fontWeight: 600, animation: 'fadeIn 0.3s ease' }}>
              {searchError}
            </div>
          )}
        </div>
      </section>

      {/* ===== TRENDING DESTINATIONS ===== */}
      <section style={{ padding: '20px 0 10px', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ display: 'inline-block', background: 'var(--brand-50)', color: 'var(--brand-700)', padding: '4px 14px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Popular Destinations</div>
            <h2>Trending <span style={{ color: 'var(--brand-600)' }}>Right Now</span></h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Top-rated destinations loved by millions of travelers</p>
          </div>
          <div style={{
            display: 'flex', gap: 12, overflowX: 'auto',
            padding: '10px 4px 16px', scrollSnapType: 'x mandatory',
            scrollbarWidth: 'thin', scrollbarColor: 'var(--brand-200) transparent',
            margin: '-10px -4px 0'
          }}>
            {DESTINATIONS.map((dest, index) => (
              <Link key={dest.city} href={`/hotels?city=${dest.city}`} style={{ 
                textDecoration: 'none', 
                flexShrink: 0, 
                scrollSnapAlign: 'start',
                display: 'block',
                width: 180,
                marginRight: index === DESTINATIONS.length - 1 ? '16px' : '0' // ensures right spacing on last item
              }}>
                <div style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)',
                  textAlign: 'center', border: '2px solid var(--border)',
                  transition: 'all var(--transition-base)', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-400)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-lg)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 4, lineHeight: 1 }}>{dest.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginTop: 4 }}>{dest.city}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{dest.hotels} hotels</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PROMOTIONAL BANNER ===== */}
      <section className="container" style={{ margin: '16px auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-6) var(--space-8)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          boxShadow: 'var(--shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative pattern */}
          <div style={{ position: 'absolute', right: '-5%', top: '-20%', fontSize: '10rem', opacity: 0.1, pointerEvents: 'none' }}>🎉</div>
          
          <div style={{ position: 'relative', zIndex: 1, flex: '1 1 400px' }}>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Limited Time Offer
            </div>
            <h2 style={{ color: 'white', marginBottom: 8, fontSize: '1.8rem' }}>Get 20% Off Your First Booking!</h2>
            <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.05rem', margin: 0 }}>
              Use code <strong>STAYBUDDY20</strong> at checkout. Offer valid for a limited time across all premium hotels.
            </p>
          </div>
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Link href="/hotels" style={{
              background: 'white', color: '#d97706', fontWeight: 700, padding: '12px 24px', 
              borderRadius: 'var(--radius-lg)', textDecoration: 'none', display: 'inline-block',
              boxShadow: 'var(--shadow-sm)', transition: 'transform var(--transition-fast)'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}>
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
              <Link href="/login" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>List Your Hotel</Link>
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
                  <HotelCard hotel={hotel} />
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
              <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#64748b' }}>India's trusted OTA platform for hotel bookings — from budget to luxury.</p>
            </div>
            {[
              { title: 'Explore', links: ['Hotels', 'Destinations', 'Deals', 'Luxury Stays'] },
              { title: 'Partners', links: ['List Your Hotel', 'Partner Login', 'Partner Resources', 'Success Stories'] },
              { title: 'Support', links: ['Help Center', 'Contact Us', 'Privacy Policy', 'Terms of Service'] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontWeight: 700, color: 'white', marginBottom: 12, fontSize: '0.9rem' }}>{col.title}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {col.links.map(link => (
                    <Link key={link} href={link === 'Partner Login' ? '/partner/login' : '#'} style={{ fontSize: '0.875rem', color: '#64748b', transition: 'color var(--transition-fast)', textDecoration: 'none' }}
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

function HotelCard({ hotel }: { hotel: any }) {
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
          
          <div style={{ position: 'absolute', top: 12, left: 12 }}>
            <span className={`badge badge-${hotel.category === 'luxury' ? 'warning' : hotel.category === 'premium' ? 'primary' : 'gray'}`} style={{ backdropFilter: 'blur(4px)' }}>
              {'⭐'.repeat(hotel.starRating)}
            </span>
          </div>

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
          {hotel.avgRating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
              <div style={{ background: 'var(--brand-500)', color: 'white', fontWeight: 700, fontSize: '0.8rem', padding: '2px 8px', borderRadius: 'var(--radius-sm)' }}>{hotel.avgRating.toFixed(1)}</div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({hotel.totalReviews} reviews)</span>
            </div>
          )}
          {typeof hotel.roomsLeft === 'number' && (
            <div style={{ fontSize: '0.75rem', color: '#d97706', fontWeight: 600, marginTop: hotel.avgRating > 0 ? 0 : 8, marginBottom: 8 }}>
              {hotel.roomsLeft} {hotel.roomsLeft === 1 ? 'room' : 'rooms'} left!
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div>
              <span className="price" style={{ fontSize: '1.25rem' }}>₹{hotel.startingPrice || 'Check rates'}</span>
              {hotel.startingPrice && <span className="price-suffix"> /night</span>}
            </div>
            <span style={{ fontSize: '0.8rem', background: 'var(--brand-50)', color: 'var(--brand-700)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}>Book Now →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
