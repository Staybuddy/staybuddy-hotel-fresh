'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

interface LocationSearchProps {
  city: string;
  onChange: (city: string) => void;
  placeholder?: string;
  dropdownLeftOffset?: string;
  dropdownRightOffset?: string;
  variant?: 'default' | 'compact';
  hasError?: boolean;
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  rooms?: number;
  children?: number;
}

export default function LocationSearch({
  city,
  onChange,
  placeholder = "Search destination...",
  dropdownLeftOffset = "0px",
  dropdownRightOffset = "0px",
  variant = 'default',
  hasError = false,
  checkIn,
  checkOut,
  adults,
  rooms,
  children,
}: LocationSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState(city);
  const [results, setResults] = useState<{ hotels: any[], cities: string[] }>({ hotels: [], cities: [] });
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [locating, setLocating] = useState(false);
  const [recentSearches, setRecentSearches] = useState<any[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(city);
  }, [city]);

  const loadRecentSearches = () => {
    try {
      const raw = localStorage.getItem('staybuddy_recent_searches');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 4));
        }
      }
    } catch (_) {}
  };

  const saveRecentSearch = (item: { type: 'hotel' | 'city'; id?: string; name: string; city?: string; image?: string; price?: number }) => {
    try {
      const raw = localStorage.getItem('staybuddy_recent_searches');
      const list = raw ? JSON.parse(raw) : [];
      const filtered = Array.isArray(list) ? list.filter((x: any) => x.id !== item.id && x.name?.toLowerCase() !== item.name?.toLowerCase()) : [];
      filtered.unshift({
        ...item,
        timestamp: Date.now()
      });
      const sliced = filtered.slice(0, 10);
      localStorage.setItem('staybuddy_recent_searches', JSON.stringify(sliced));
      setRecentSearches(sliced.slice(0, 4));
    } catch (_) {}
  };

  const clearRecentSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      localStorage.removeItem('staybuddy_recent_searches');
      setRecentSearches([]);
    } catch (_) {}
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const POPULAR_DESTINATIONS = [
    'Mumbai', 'Goa', 'Delhi', 'Jaipur', 'Manali', 'Kerala', 'Hyderabad',
    'Bangalore', 'Udaipur', 'Ooty', 'Agra', 'Varanasi', 'Amritsar', 'Chennai',
    'Kolkata', 'Pune', 'Shimla'
  ];

  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({ hotels: [], cities: [] });
      return;
    }

    const controller = new AbortController();

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/hotels/autocomplete?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          if (document.activeElement === inputRef.current) {
            setShowDropdown(true);
          }
        } else {
          // Graceful fallback to local cities
          const matched = POPULAR_DESTINATIONS.filter(c => c.toLowerCase().includes(query.toLowerCase()));
          setResults({ hotels: [], cities: matched.slice(0, 5) });
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          // Graceful offline fallback without triggering Next.js dev error overlay
          const matched = POPULAR_DESTINATIONS.filter(c => c.toLowerCase().includes(query.toLowerCase()));
          setResults({ hotels: [], cities: matched.slice(0, 5) });
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      controller.abort();
    };
  }, [query]);

  const handleCitySelect = (c: string) => {
    setQuery(c);
    onChange(c);
    setShowDropdown(false);
    saveRecentSearch({ type: 'city', name: c, city: c });
  };

  const handleHotelSelect = (hotelId: string, hotelObj?: any) => {
    setShowDropdown(false);
    setIsModalOpen(false);
    const target = hotelObj || results.hotels.find((h: any) => h._id === hotelId);
    if (target) {
      saveRecentSearch({
        type: 'hotel',
        id: hotelId,
        name: target.name,
        city: target.city,
        image: target.images?.[0] || '',
        price: target.startingPrice || target.price || 0,
      });
    }
    let s: any = null;
    try {
      const raw = localStorage.getItem('staybuddy_last_search');
      if (raw) s = JSON.parse(raw);
    } catch (_) {}

    const cIn = checkIn || s?.checkIn;
    const cOut = checkOut || s?.checkOut;
    const a = adults || s?.adults;
    const r = rooms || s?.rooms;
    const ch = children !== undefined ? children : s?.children;

    const p = new URLSearchParams();
    if (cIn) p.set('checkIn', cIn);
    if (cOut) p.set('checkOut', cOut);
    if (a) p.set('adults', String(a));
    if (r) p.set('rooms', String(r));
    if (ch) p.set('children', String(ch));
    const qs = p.toString();
    router.push(`/hotels/${hotelId}${qs ? `?${qs}` : ''}`);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const detectedCity = data.address.city || data.address.town || data.address.village || data.address.state_district;
            if (detectedCity) {
              setQuery(detectedCity);
              onChange(detectedCity);
              setShowDropdown(false);
            } else {
              alert("Could not detect city from your location.");
            }
          }
        } catch (e) {
          alert("Error fetching location data.");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        alert("Unable to retrieve your location. Please check browser permissions.");
      }
    );
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isModalOpen) {
      loadRecentSearches();
    }
  }, [isModalOpen]);

  return (
    <>
      <div 
        id="location-search-trigger"
        onClick={() => setIsModalOpen(true)}
        style={{
          background: hasError ? '#fef2f2' : (variant === 'compact' ? 'white' : '#f8fafc'),
          borderRadius: variant === 'compact' ? 'var(--radius-md)' : '12px',
          padding: variant === 'compact' ? '4px 12px' : '12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: variant === 'compact' ? '0px' : '4px',
          height: variant === 'compact' ? '54px' : 'auto',
          justifyContent: 'center',
          cursor: 'pointer',
          border: hasError ? '2px solid #ef4444' : (variant === 'compact' ? '1px solid var(--border)' : '1px solid transparent'),
          transition: 'all 0.2s',
          position: 'relative'
        }}
        onMouseEnter={e => {
          if (!hasError) e.currentTarget.style.borderColor = 'var(--brand-200)';
        }}
        onMouseLeave={e => {
          if (!hasError) e.currentTarget.style.borderColor = variant === 'compact' ? 'var(--border)' : 'transparent';
        }}
      >
        <label style={{ fontSize: variant === 'compact' ? '0.65rem' : '0.7rem', fontWeight: variant === 'compact' ? 700 : 800, color: hasError ? '#dc2626' : (variant === 'compact' ? 'var(--text-muted)' : '#64748b'), textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer' }}>
          CITY, PROPERTY OR LOCATION <span style={{ color: '#ef4444', fontWeight: 900 }}>*</span>
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width={variant === 'compact' ? 20 : 24} height={variant === 'compact' ? 20 : 24} viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
          <div style={{ flex: 1, display: 'flex', flexDirection: variant === 'compact' ? 'row' : 'column', alignItems: variant === 'compact' ? 'baseline' : 'flex-start', gap: variant === 'compact' ? '6px' : '2px' }}>
            <div style={{ fontSize: variant === 'compact' ? '0.95rem' : '1.1rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>{query || 'Select Destination'}</div>
            <div style={{ fontSize: variant === 'compact' ? '0.7rem' : '0.75rem', color: '#64748b', marginTop: variant === 'compact' ? 0 : 2 }}>India</div>
          </div>
          {Boolean(query) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setQuery('');
                onChange('');
                try {
                  const saved = localStorage.getItem('staybuddy_last_search');
                  if (saved) {
                    const p = JSON.parse(saved);
                    delete p.location;
                    localStorage.setItem('staybuddy_last_search', JSON.stringify(p));
                  }
                } catch (_) {}
              }}
              title="Clear destination"
              style={{
                background: '#f1f5f9',
                border: 'none',
                cursor: 'pointer',
                width: variant === 'compact' ? 24 : 28,
                height: variant === 'compact' ? 24 : 28,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: '0.75rem',
                fontWeight: 800
              }}
            >
              ✕
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); getCurrentLocation(); }}
            title="Use current location"
            disabled={locating}
            style={{
              background: 'var(--brand-100)',
              border: 'none',
              cursor: locating ? 'wait' : 'pointer',
              width: variant === 'compact' ? 26 : 32,
              height: variant === 'compact' ? 26 : 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-600)',
              opacity: locating ? 0.5 : 1
            }}
          >
            {locating ? (
               <div className="spinner" style={{ width: 14, height: 14, border: '2px solid var(--brand-600)', borderTopColor: 'transparent' }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      
      {mounted && isModalOpen && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', touchAction: 'none' }}
            onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setIsModalOpen(false); }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'relative', background: 'white', borderRadius: '24px', width: '100%', maxWidth: 500, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', touchAction: 'manipulation' }}
          >
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Where do you want to go?</h2>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
                style={{ background: '#f1f5f9', border: 'none', cursor: 'pointer', color: '#64748b', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', touchAction: 'manipulation' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
              <div style={{ 
                position: 'relative', 
                border: '2px solid var(--brand-500)', 
                borderRadius: '16px', 
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 0 0 4px var(--brand-50)'
              }}>
                <div style={{ padding: '0 16px', color: 'var(--brand-500)' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input 
                  autoFocus
                  ref={inputRef}
                  type="text"
                  placeholder="Search city, hotel name or location"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (e.target.value.length < 2) setResults({ hotels: [], cities: [] });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && query.trim()) {
                      handleCitySelect(query.trim());
                      setIsModalOpen(false);
                    }
                  }}
                  style={{ 
                    flex: 1,
                    padding: '14px 0', 
                    border: 'none', 
                    background: 'transparent', 
                    boxShadow: 'none', 
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                />
                {Boolean(query) && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setResults({ hotels: [], cities: [] });
                      if (inputRef.current) inputRef.current.focus();
                    }}
                    title="Clear"
                    style={{
                      background: '#e2e8f0',
                      border: 'none',
                      cursor: 'pointer',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#475569',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      marginRight: 8
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Recent Searches (Shown when input is empty & recent searches exist) */}
              {query.length < 2 && recentSearches.length > 0 && (
                <div style={{ marginTop: 22, marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🕒</span> RECENT SEARCHES
                    </div>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: '2px 6px' }}
                    >
                      Clear
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {recentSearches.map((item, idx) => (
                      <div
                        key={`recent-${item.id || item.name}-${idx}`}
                        onClick={() => {
                          if (item.type === 'hotel' && item.id) {
                            handleHotelSelect(item.id, item);
                          } else {
                            handleCitySelect(item.name);
                            setIsModalOpen(false);
                          }
                        }}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          borderRadius: '14px',
                          background: '#fff7ed',
                          border: '1px solid #fed7aa',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#ffedd5'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff7ed'}
                      >
                        <div style={{
                          background: '#ffffff',
                          width: 40,
                          height: 40,
                          borderRadius: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          flexShrink: 0,
                          border: '1px solid #fed7aa',
                          boxShadow: '0 2px 4px rgba(234, 88, 12, 0.08)'
                        }}>
                          {item.type === 'hotel' ? '🏨' : '📍'}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#c2410c', fontWeight: 600 }}>
                            {item.type === 'hotel' ? `${item.city || 'India'} • Tap to reopen property` : 'Recent destination search'}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.85rem', color: '#ea580c', fontWeight: 800 }}>→</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: query.length < 2 && recentSearches.length > 0 ? 16 : 28, fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
                {query.length < 2 ? 'POPULAR DESTINATIONS' : 'SEARCH RESULTS'}
              </div>
        
              {/* Autocomplete Results */}
              <div style={{ marginTop: '12px' }}>
                {(query.length < 2 ? ['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Hyderabad'] : results.cities).map(c => (
                  <div 
                    key={`city-${c}`}
                    onClick={() => { handleCitySelect(c); setIsModalOpen(false); }}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                      borderRadius: '16px', transition: 'background 0.2s',
                      marginBottom: 4
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ background: '#f1f5f9', width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>{c}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>City in India</span>
                    </div>
                  </div>
                ))}

                {results.hotels.map(h => (
                  <div 
                    key={`hotel-${h._id}`}
                    onClick={() => { handleHotelSelect(h._id); setIsModalOpen(false); }}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16,
                      borderRadius: '16px', transition: 'background 0.2s',
                      marginBottom: 4
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ background: '#f1f5f9', width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexShrink: 0 }}>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"></path><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"></path><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path><path d="M9 7h.01"></path><path d="M9 11h.01"></path><path d="M15 7h.01"></path><path d="M15 11h.01"></path></svg>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a', marginBottom: 2 }}>{h.name}</span>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{h.city}, India</span>
                    </div>
                  </div>
                ))}

                {query.length >= 2 && results.hotels.length === 0 && results.cities.length === 0 && !loading && (
                  <div style={{
                    padding: '24px 16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '16px',
                    border: '1px dashed #cbd5e1',
                    marginTop: 12
                  }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🔍</div>
                    <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem', marginBottom: 4 }}>
                      Looking for &quot;{query}&quot;
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.82rem' }}>
                      Press Enter to search all destinations and verified stays for this query.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  );
}
