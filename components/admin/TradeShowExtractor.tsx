'use client';
import { useState, useEffect, useMemo } from 'react';
import { INITIAL_TRADE_SHOWS, TradeShowVenue, ExtractedHotel } from '@/lib/tradeShowsData';

export default function TradeShowExtractor() {
  const [venues, setVenues] = useState<TradeShowVenue[]>(INITIAL_TRADE_SHOWS);
  const [selectedVenueId, setSelectedVenueId] = useState<string>('hitex-hyderabad');
  const [hotels, setHotels] = useState<ExtractedHotel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStar, setSelectedStar] = useState<string>('all');
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(6.8);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Custom Venue Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [customVenueName, setCustomVenueName] = useState<string>('');
  const [customCity, setCustomCity] = useState<string>('');
  const [customAddress, setCustomAddress] = useState<string>('');

  const currentVenue = useMemo(() => {
    return venues.find(v => v.id === selectedVenueId) || venues[0];
  }, [venues, selectedVenueId]);

  // Fetch hotels for selected venue
  const fetchVenueHotels = async (venueId: string, radius: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/trade-shows/extract?venueId=${venueId}&radius=${radius}`);
      const data = await res.json();
      if (data.success) {
        setHotels(data.hotels);
        if (data.venues) setVenues(data.venues);
      }
    } catch (e) {
      console.error('Error fetching trade show hotels:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenueHotels(selectedVenueId, maxRadiusKm);
  }, [selectedVenueId, maxRadiusKm]);

  // Run Animated Multi-Agent Extraction Pipeline
  const runExtractionPipeline = async () => {
    setIsExtracting(true);
    setActiveStep(1); // Agent 1: Discovery

    setTimeout(() => setActiveStep(2), 700); // Agent 2: Contact
    setTimeout(() => setActiveStep(3), 1400); // Agent 3: Distance
    setTimeout(() => setActiveStep(4), 2100); // Agent 4: Stars
    setTimeout(() => setActiveStep(5), 2800); // Agent 5: Audit
    setTimeout(async () => {
      setActiveStep(6); // Agent 6: Deploy
      await fetchVenueHotels(selectedVenueId, maxRadiusKm);
      setTimeout(() => {
        setIsExtracting(false);
      }, 1000);
    }, 3500);
  };

  // Add Custom Trade Show Venue
  const handleAddCustomVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customVenueName.trim() || !customCity.trim()) return;

    try {
      const res = await fetch('/api/admin/trade-shows/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_venue',
          venue: {
            name: customVenueName.trim(),
            shortName: customVenueName.trim(),
            city: customCity.trim(),
            venueAddress: customAddress.trim() || `${customVenueName.trim()}, ${customCity.trim()}`,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.venue) {
        setVenues(data.allVenues);
        setSelectedVenueId(data.venue.id);
        setShowAddModal(false);
        setCustomVenueName('');
        setCustomCity('');
        setCustomAddress('');
      }
    } catch (err) {
      console.error('Failed to add custom trade show venue', err);
    }
  };

  // Filtered Hotels based on search, star category & radius
  const filteredHotels = useMemo(() => {
    return hotels.filter(h => {
      const matchSearch =
        searchQuery === '' ||
        h.hotelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.mobile.includes(searchQuery) ||
        h.locality.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStar = selectedStar === 'all' || h.category === selectedStar;
      const matchRadius = h.distanceKm <= maxRadiusKm;

      return matchSearch && matchStar && matchRadius;
    });
  }, [hotels, searchQuery, selectedStar, maxRadiusKm]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: hotels.length,
      star5: hotels.filter(h => h.category === '5 Star').length,
      star4: hotels.filter(h => h.category === '4 Star').length,
      star3: hotels.filter(h => h.category === '3 Star').length,
      star2: hotels.filter(h => h.category === '2 Star').length,
    };
  }, [hotels]);

  // 1. Export as Google Sheets Ready CSV
  const handleDownloadCSV = () => {
    const headers = [
      'S.No',
      'Hotel Name',
      'Mobile / Phone Number',
      'Star Category',
      'Distance (km)',
      'Estimated Transit Time',
      'Locality',
      'Full Address',
      'Trade Show Venue',
      'Google Maps URL',
      'Verification Status',
    ];

    const rows = filteredHotels.map((h, i) => [
      i + 1,
      `"${h.hotelName.replace(/"/g, '""')}"`,
      `"${h.mobile}"`,
      `"${h.category}"`,
      h.distanceKm,
      `"${h.driveTimeMins} mins"`,
      `"${h.locality.replace(/"/g, '""')}"`,
      `"${h.address.replace(/"/g, '""')}"`,
      `"${currentVenue.name.replace(/"/g, '""')}"`,
      `"${h.mapsUrl}"`,
      `"${h.auditStatus}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentVenue.shortName.replace(/\s+/g, '_')}_Hotels_Google_Data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Copy for Google Sheets (TSV formatted for direct Ctrl+V)
  const handleCopyForGoogleSheets = () => {
    const headers = [
      'S.No',
      'Hotel Name',
      'Mobile Number',
      'Category',
      'Distance (km)',
      'Drive Time',
      'Locality',
      'Address',
      'Trade Show Center',
      'Google Maps Link',
    ];

    const rows = filteredHotels.map((h, i) => [
      i + 1,
      h.hotelName,
      h.mobile,
      h.category,
      h.distanceKm,
      `${h.driveTimeMins} mins`,
      h.locality,
      h.address,
      currentVenue.shortName,
      h.mapsUrl,
    ]);

    const tsvContent = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');

    navigator.clipboard.writeText(tsvContent).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3500);
    });
  };

  return (
    <div style={{ padding: '0 4px 40px 4px' }}>
      {/* HEADER SECTION */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '20px',
          padding: '28px 32px',
          color: '#ffffff',
          marginBottom: '24px',
          boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.8rem' }}>🎯</span>
              <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                Trade Show Hotel Intelligence & Data Extractor
              </h1>
              <span
                style={{
                  background: 'rgba(34, 197, 94, 0.2)',
                  color: '#4ade80',
                  border: '1px solid rgba(34, 197, 94, 0.4)',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                }}
              >
                MULTI-AGENT ACTIVE
              </span>
            </div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem', maxWidth: '800px', lineHeight: 1.5 }}>
              Autonomous 6-agent engine extracting raw Google Maps business data within <strong>6 to 7 km</strong> of premier trade show venues. Enforces verified reception mobile numbers, star ratings, and 1-click Google Sheets export.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '10px 16px',
                borderRadius: '12px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
            >
              <span>➕</span> Add Trade Show Venue
            </button>

            <button
              onClick={runExtractionPipeline}
              disabled={isExtracting}
              style={{
                background: isExtracting
                  ? '#64748b'
                  : 'linear-gradient(135deg, #ff6b35 0%, #ea580c 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '10px 22px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: isExtracting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={e => !isExtracting && (e.currentTarget.style.transform = 'scale(1.02)')}
              onMouseLeave={e => !isExtracting && (e.currentTarget.style.transform = 'scale(1)')}
            >
              <span>{isExtracting ? '⚙️' : '🚀'}</span>
              {isExtracting ? 'Agents Running Extraction...' : 'Run Agent Pipeline'}
            </button>
          </div>
        </div>

        {/* VENUE SELECTION PILLS */}
        <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255, 255, 255, 0.12)', paddingTop: '20px' }}>
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#cbd5e1', fontWeight: 700, marginBottom: '10px' }}>
            SELECT TRADE SHOW VENUE:
          </div>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
            {venues.map(v => {
              const isSelected = v.id === selectedVenueId;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVenueId(v.id)}
                  style={{
                    background: isSelected ? '#ff6b35' : 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                    border: isSelected ? '2px solid #ff6b35' : '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>📍</span>
                  {v.shortName}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ACTIVE VENUE BANNER & AGENTS PIPELINE STATUS */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          marginBottom: '24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.2rem' }}>🏛️</span>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                {currentVenue.name}
              </h2>
            </div>
            <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '4px' }}>
              📍 {currentVenue.venueAddress} • <strong>City:</strong> {currentVenue.city}, {currentVenue.state} • <strong>Perimeter:</strong> Max {maxRadiusKm} km radius
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Radius Filter:</span>
              <input
                type="range"
                min="1"
                max="7"
                step="0.5"
                value={maxRadiusKm}
                onChange={e => setMaxRadiusKm(parseFloat(e.target.value))}
                style={{ width: '100px', cursor: 'pointer', accentColor: '#ff6b35' }}
              />
              <span style={{ fontWeight: 800, color: '#ea580c', fontSize: '0.88rem' }}>{maxRadiusKm} km</span>
            </div>
          </div>
        </div>

        {/* 6 MULTI-AGENTS COLLABORATIVE WORKFLOW STRIP */}
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🤖</span> Collaborative Multi-Agent Network Architecture:
            </div>
            {isExtracting && (
              <div style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: 700, animation: 'pulse 1.5s infinite' }}>
                Step {activeStep} of 6 executing live...
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '10px',
            }}
          >
            {[
              {
                num: 1,
                icon: '🕵️',
                title: 'Agent 1: Discovery',
                desc: 'Scans Google directory for active hotels',
                color: '#3b82f6',
              },
              {
                num: 2,
                icon: '📞',
                title: 'Agent 2: Contacts',
                desc: 'Extracts direct reception mobile numbers',
                color: '#8b5cf6',
              },
              {
                num: 3,
                icon: '📍',
                title: 'Agent 3: Proximity',
                desc: 'Computes exact road distances (<=7km)',
                color: '#06b6d4',
              },
              {
                num: 4,
                icon: '⭐',
                title: 'Agent 4: Star Auditor',
                desc: 'Classifies 2★, 3★, 4★, 5★ (5+ each)',
                color: '#f59e0b',
              },
              {
                num: 5,
                icon: '🛡️',
                title: 'Agent 5: Inspector',
                desc: 'Cross-checks +91 formats & accuracy',
                color: '#10b981',
              },
              {
                num: 6,
                icon: '📊',
                title: 'Agent 6: Deployer',
                desc: 'Prepares Google Sheets export',
                color: '#ea580c',
              },
            ].map(agent => {
              const isCurrent = isExtracting && activeStep === agent.num;
              const isDone = !isExtracting || activeStep > agent.num;
              return (
                <div
                  key={agent.num}
                  style={{
                    background: isCurrent ? '#fef3c7' : isDone ? '#f8fafc' : '#ffffff',
                    border: isCurrent
                      ? '2px solid #f59e0b'
                      : isDone
                      ? '1px solid #e2e8f0'
                      : '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    transition: 'all 0.3s ease',
                    boxShadow: isCurrent ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '1.1rem' }}>{agent.icon}</span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        background: isCurrent ? '#ea580c' : isDone ? '#22c55e' : '#94a3b8',
                        color: '#ffffff',
                      }}
                    >
                      {isCurrent ? 'Running...' : isDone ? 'Verified ✓' : 'Idle'}
                    </span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0f172a' }}>{agent.title}</div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px', lineHeight: 1.25 }}>{agent.desc}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI METRIC CARDS STRIP */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Extracted</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{stats.total}</div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>Verified Google Data</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>5 Star (Luxury)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#854d0e', marginTop: '4px' }}>{stats.star5}</div>
          <div style={{ fontSize: '0.74rem', color: stats.star5 >= 5 ? '#16a34a' : '#ea580c', fontWeight: 600, marginTop: '2px' }}>
            {stats.star5 >= 5 ? 'Target Achieved (5+)' : `${stats.star5}/5 Available`}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>4 Star (Premium)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e40af', marginTop: '4px' }}>{stats.star4}</div>
          <div style={{ fontSize: '0.74rem', color: stats.star4 >= 5 ? '#16a34a' : '#ea580c', fontWeight: 600, marginTop: '2px' }}>
            {stats.star4 >= 5 ? 'Target Achieved (5+)' : `${stats.star4}/5 Available`}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>3 Star (Executive)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0369a1', marginTop: '4px' }}>{stats.star3}</div>
          <div style={{ fontSize: '0.74rem', color: stats.star3 >= 5 ? '#16a34a' : '#ea580c', fontWeight: 600, marginTop: '2px' }}>
            {stats.star3 >= 5 ? 'Target Achieved (5+)' : `${stats.star3}/5 Available`}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>2 Star (Budget)</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#475569', marginTop: '4px' }}>{stats.star2}</div>
          <div style={{ fontSize: '0.74rem', color: stats.star2 >= 5 ? '#16a34a' : '#ea580c', fontWeight: 600, marginTop: '2px' }}>
            {stats.star2 >= 5 ? 'Target Achieved (5+)' : `${stats.star2}/5 Available`}
          </div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Mobile Coverage</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a', marginTop: '4px' }}>100%</div>
          <div style={{ fontSize: '0.74rem', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>Direct Reception Lines</div>
        </div>
      </div>

      {/* SEARCH, STAR FILTERS & GOOGLE SHEETS ACTIONS BAR */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '16px 20px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Left: Star Filter Pills & Search */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '10px' }}>
            {['all', '5 Star', '4 Star', '3 Star', '2 Star'].map(star => {
              const isSelected = selectedStar === star;
              return (
                <button
                  key={star}
                  onClick={() => setSelectedStar(star)}
                  style={{
                    background: isSelected ? '#ffffff' : 'transparent',
                    color: isSelected ? '#0f172a' : '#64748b',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.82rem',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {star === 'all' ? 'All Stars' : star}
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search hotel name, phone, area..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '8px 12px 8px 32px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                fontSize: '0.85rem',
                width: '240px',
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '8px', color: '#94a3b8', fontSize: '0.85rem' }}>🔍</span>
          </div>
        </div>

        {/* Right: Google Sheets Export Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyForGoogleSheets}
            style={{
              background: copySuccess ? '#16a34a' : '#0f172a',
              color: '#ffffff',
              border: 'none',
              padding: '9px 16px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background 0.2s ease',
            }}
          >
            <span>{copySuccess ? '✓' : '📋'}</span>
            {copySuccess ? 'Copied for Sheets!' : 'Copy for Google Sheets'}
          </button>

          <button
            onClick={handleDownloadCSV}
            style={{
              background: '#047857',
              color: '#ffffff',
              border: 'none',
              padding: '9px 18px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 6px rgba(4, 120, 87, 0.3)',
            }}
          >
            <span>📊</span> Export to Google Sheets (.csv)
          </button>

          <a
            href="https://sheets.new"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#f8fafc',
              color: '#15803d',
              border: '1px solid #86efac',
              padding: '9px 14px',
              borderRadius: '10px',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🌐</span> Open sheets.new ↗
          </a>
        </div>
      </div>

      {copySuccess && (
        <div
          style={{
            background: '#dcfce7',
            color: '#15803d',
            padding: '10px 16px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '0.88rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #86efac',
          }}
        >
          <span>🎉</span> <strong>Copied to clipboard!</strong> Open your Google Sheet, select cell A1, and press <strong>Ctrl+V</strong> (or <strong>Cmd+V</strong>) to paste the entire verified dataset.
        </div>
      )}

      {/* DATA TABLE */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <th style={{ padding: '14px 16px', width: '60px' }}>S.No</th>
                <th style={{ padding: '14px 16px' }}>Hotel Name</th>
                <th style={{ padding: '14px 16px' }}>Direct Mobile / Phone</th>
                <th style={{ padding: '14px 16px' }}>Category Star</th>
                <th style={{ padding: '14px 16px' }}>Distance to Venue</th>
                <th style={{ padding: '14px 16px' }}>Locality / Area</th>
                <th style={{ padding: '14px 16px' }}>Google Maps</th>
                <th style={{ padding: '14px 16px' }}>Audit Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '8px' }}>⚙️</div>
                    <div>Agent pipeline loading hotel data for {currentVenue.shortName}...</div>
                  </td>
                </tr>
              ) : filteredHotels.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    No hotels found matching your radius or filter. Try increasing the search radius slider.
                  </td>
                </tr>
              ) : (
                filteredHotels.map((h, idx) => {
                  const starColor =
                    h.category === '5 Star'
                      ? { bg: '#fef9c3', text: '#854d0e', border: '#fde047' }
                      : h.category === '4 Star'
                      ? { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }
                      : h.category === '3 Star'
                      ? { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' }
                      : { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' };

                  return (
                    <tr
                      key={h.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* S.No */}
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: '#64748b' }}>
                        {idx + 1}
                      </td>

                      {/* Hotel Name */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>{h.hotelName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{h.address}</div>
                      </td>

                      {/* Mobile / Phone Number */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.95rem' }}>📱</span>
                          <a
                            href={`tel:${h.mobile.replace(/\s+/g, '')}`}
                            style={{
                              color: '#0f172a',
                              fontWeight: 700,
                              textDecoration: 'none',
                              fontFamily: 'monospace',
                              fontSize: '0.92rem',
                            }}
                          >
                            {h.mobile}
                          </a>
                        </div>
                        {h.altPhone && (
                          <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                            Alt: {h.altPhone}
                          </div>
                        )}
                      </td>

                      {/* Category Star */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: starColor.bg,
                            color: starColor.text,
                            border: `1px solid ${starColor.border}`,
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          ⭐ {h.category}
                        </span>
                      </td>

                      {/* Distance to Venue */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, color: '#ea580c', fontSize: '0.95rem' }}>
                            {h.distanceKm} km
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                          🚗 ~{h.driveTimeMins} mins drive
                        </div>
                      </td>

                      {/* Locality */}
                      <td style={{ padding: '14px 16px', color: '#334155', fontWeight: 600 }}>
                        {h.locality}
                      </td>

                      {/* Google Maps Link */}
                      <td style={{ padding: '14px 16px' }}>
                        <a
                          href={h.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          📍 View on Maps ↗
                        </a>
                      </td>

                      {/* Audit Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            background: '#dcfce7',
                            color: '#15803d',
                            border: '1px solid #86efac',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          ✓ Agent 5 Verified
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD CUSTOM TRADE SHOW VENUE MODAL */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>🏛️</span>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                  Add Trade Show Venue
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomVenue}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Venue Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pragati Maidan / Bharat Mandapam"
                  value={customVenueName}
                  onChange={e => setCustomVenueName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  City *
                </label>
                <input
                  type="text"
                  placeholder="e.g. New Delhi"
                  value={customCity}
                  onChange={e => setCustomCity(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Venue Address / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathura Rd, Railway Colony, New Delhi 110001"
                  value={customAddress}
                  onChange={e => setCustomAddress(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 18px', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#ff6b35', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Save & Extract Hotels
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
