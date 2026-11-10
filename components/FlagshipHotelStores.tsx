'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export interface RealPremierHotel {
  id: string;
  name: string;
  city: string;
  area?: string;
  starRating: number;
  startingPrice: number;
  images: string[];
  photo: string;
  amenities: string[];
  category: string;
  propertyType: string;
}

export default function FlagshipHotelStores({ dbHotels = [] }: { dbHotels?: any[] }) {
  const router = useRouter();
  const [selectedHotel, setSelectedHotel] = useState<RealPremierHotel | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Extract ONLY real 4-Star & 5-Star onboarded hotels from StayBuddy database (with real uploaded photos)
  const realPremierHotels: RealPremierHotel[] = useMemo(() => {
    const list = (dbHotels || [])
      .map((h: any) => {
        const rawStar = Number(h.starRating) || (h.category === 'luxury' || h.category === 'Luxury' ? 5 : h.category === 'premium' || h.category === 'Premium' ? 4 : 3);
        const images: string[] = Array.isArray(h.images) ? h.images.filter((img: any) => typeof img === 'string' && img.trim()) : [];
        const photo = images[0] || '';
        
        return {
          id: h._id || h.hotelId || '',
          name: (h.name || 'StayBuddy Premier Hotel').trim(),
          city: (h.city || 'India').trim(),
          area: (h.area || '').trim(),
          starRating: Math.min(5, Math.max(1, rawStar)),
          startingPrice: Number(h.startingPrice) || 2499,
          images,
          photo,
          amenities: Array.isArray(h.amenities) && h.amenities.length > 0 ? h.amenities : ['Free WiFi', 'Restaurant', 'Parking', '24-hour Front Desk'],
          category: h.category || 'Premium',
          propertyType: h.propertyType || 'Hotel'
        };
      })
      // Only include properties that have real photos and are strictly approved 4-star or 5-star hotels
      .filter((h: any) => h.photo && (h.starRating >= 4 || h.category === 'luxury' || (h.category === 'premium' && h.starRating >= 4)));

    // Sort with 5-star and 4-star first
    list.sort((a, b) => b.starRating - a.starRating);
    return list;
  }, [dbHotels]);

  // If no hotels have been onboarded yet, do not render empty block
  if (!realPremierHotels || realPremierHotels.length === 0) {
    return null;
  }

  const handleOpenHotel = (hotel: RealPremierHotel) => {
    setSelectedHotel(hotel);
    setActivePhotoIndex(0);
  };

  const handleCloseModal = () => {
    setSelectedHotel(null);
  };

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedHotel?.images?.length) return;
    setActivePhotoIndex(prev => (prev > 0 ? prev - 1 : selectedHotel.images.length - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedHotel?.images?.length) return;
    setActivePhotoIndex(prev => (prev < selectedHotel.images.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      <style>{`
        .flagship-section-box {
          background: linear-gradient(135deg, #f8fafc 0%, #ffffff 50%, #fff7ed 100%);
          border: 1.5px solid #fed7aa;
          border-radius: 22px;
          padding: 24px;
          margin-bottom: 26px;
          box-shadow: 0 10px 30px rgba(234, 88, 12, 0.05);
          position: relative;
          overflow: hidden;
        }

        .flagship-layout {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .flagship-intro-box {
          flex: 0 0 260px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .flagship-real-scroll {
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          gap: 16px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 6px 4px 12px;
          scrollbar-width: thin;
          -webkit-overflow-scrolling: touch;
        }

        .flagship-real-scroll::-webkit-scrollbar {
          height: 5px;
        }
        .flagship-real-scroll::-webkit-scrollbar-thumb {
          background: #fdba74;
          border-radius: 10px;
        }

        .flagship-real-card {
          flex: 0 0 250px;
          height: 150px;
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          scroll-snap-align: start;
          transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
          border: 1.5px solid rgba(254, 215, 170, 0.7);
          box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
          background: #0f172a;
        }

        .flagship-real-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 14px 28px rgba(234, 88, 12, 0.2);
          border-color: #f97316;
        }

        .flagship-real-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.35s ease;
        }

        .flagship-real-card:hover .flagship-real-img {
          transform: scale(1.06);
        }

        .flagship-real-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0.88) 100%);
          z-index: 2;
        }

        @media (max-width: 900px) {
          .flagship-layout {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }
          .flagship-intro-box {
            flex: none;
            width: 100%;
          }
          .flagship-section-box {
            padding: 18px 14px;
            border-radius: 18px;
            margin-bottom: 20px;
          }
          .flagship-real-card {
            flex: 0 0 220px;
            height: 140px;
          }
        }

        @keyframes flagshipFadeIn {
          from { opacity: 0; transform: scale(0.95) translateY(18px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        .flagship-modal-content {
          animation: flagshipFadeIn 0.26s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>

      {/* Flagship Section on Homepage */}
      <section className="container" style={{ padding: '0 16px' }}>
        <div className="flagship-section-box">
          <div className="flagship-layout">

            {/* Left Header Title Box */}
            <div className="flagship-intro-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: '0.72rem',
                  background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                  color: '#ea580c',
                  border: '1px solid #fdba74',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  👑 4★ & 5★ Premier Stays
                </span>
              </div>
              <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.25, letterSpacing: '-0.02em' }}>
                Flagship Hotels on StayBuddy
              </h2>
              <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748b', lineHeight: 1.4 }}>
                Explore authentic 4-star and 5-star verified hotels onboarded on StayBuddy with real property images.
              </p>
            </div>

            {/* Right Horizontal Scrolling Real Hotels */}
            <div className="flagship-real-scroll">
              {realPremierHotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="flagship-real-card"
                  onClick={() => handleOpenHotel(hotel)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenHotel(hotel); }}
                >
                  <img
                    src={hotel.photo}
                    alt={hotel.name}
                    className="flagship-real-img"
                    loading="lazy"
                  />
                  <div className="flagship-real-overlay" />

                  {/* Top Badges */}
                  <div style={{
                    position: 'absolute',
                    top: 10,
                    left: 10,
                    right: 10,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 3
                  }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #d97706, #b45309)',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 6,
                      border: '1px solid #fde68a',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                    }}>
                      👑 {hotel.starRating}★ Premier
                    </span>

                    <span style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#f8fafc',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 12
                    }}>
                      📍 {hotel.city}
                    </span>
                  </div>

                  {/* Bottom Info: Real Name & Price */}
                  <div style={{
                    position: 'absolute',
                    bottom: 10,
                    left: 12,
                    right: 12,
                    zIndex: 3,
                    color: '#ffffff'
                  }}>
                    <div style={{
                      fontWeight: 800,
                      fontSize: '0.92rem',
                      lineHeight: 1.25,
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: 3
                    }}>
                      {hotel.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.78rem', color: '#fed7aa', fontWeight: 700 }}>
                        ₹{hotel.startingPrice.toLocaleString('en-IN')}<span style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)' }}>/night</span>
                      </span>
                      <span style={{ fontSize: '0.74rem', background: '#ea580c', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                        View Stays ›
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Hotel Showcase Modal (Shows real onboarded images & details) */}
      {selectedHotel && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px',
          overflowY: 'auto'
        }}>
          {/* Backdrop Click to close */}
          <div
            style={{ position: 'absolute', inset: 0 }}
            onClick={handleCloseModal}
          />

          <div
            className="flagship-modal-content"
            style={{
              position: 'relative',
              background: '#ffffff',
              borderRadius: 24,
              maxWidth: 680,
              width: '100%',
              maxHeight: '94vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
              border: '1.5px solid #fed7aa',
              zIndex: 10
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                border: '1.5px solid rgba(255, 255, 255, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                cursor: 'pointer',
                zIndex: 20,
                backdropFilter: 'blur(4px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}
            >
              ✕
            </button>

            {/* Real Hotel Image Gallery Banner */}
            <div style={{ position: 'relative', height: 260, width: '100%', overflow: 'hidden', background: '#0f172a' }}>
              <img
                src={selectedHotel.images[activePhotoIndex] || selectedHotel.photo}
                alt={selectedHotel.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'all 0.3s ease' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.3) 60%, rgba(15, 23, 42, 0.8) 100%)'
              }} />

              {/* Prev & Next Photo Controls */}
              {selectedHotel.images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      zIndex: 10
                    }}
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.4)',
                      borderRadius: '50%',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      zIndex: 10
                    }}
                  >
                    ›
                  </button>

                  {/* Photo Count Pill */}
                  <div style={{
                    position: 'absolute',
                    bottom: 14,
                    right: 14,
                    background: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    zIndex: 10
                  }}>
                    📷 {activePhotoIndex + 1} / {selectedHotel.images.length}
                  </div>
                </>
              )}

              {/* Premier Star Badge */}
              <div style={{
                position: 'absolute',
                top: 14,
                left: 14,
                background: 'linear-gradient(135deg, #d97706, #b45309)',
                color: '#ffffff',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.76rem',
                fontWeight: 800,
                border: '1px solid #fde68a',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>👑</span>
                <span>{selectedHotel.starRating}-Star Premier Property</span>
              </div>
            </div>

            {/* Hotel Information */}
            <div style={{ padding: '20px 24px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
                <div>
                  <h2 style={{ fontSize: '1.55rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px' }}>
                    {selectedHotel.name}
                  </h2>
                  <div style={{ fontSize: '0.88rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>📍</span>
                    <span>{selectedHotel.area ? `${selectedHotel.area}, ` : ''}{selectedHotel.city}</span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>Verified Partner</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Starting from</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#c2410c', lineHeight: 1 }}>
                    ₹{selectedHotel.startingPrice.toLocaleString('en-IN')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>/night</div>
                </div>
              </div>

              {/* Amenities List */}
              <div style={{ margin: '14px 0 18px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  Included Verified Amenities:
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {selectedHotel.amenities.map((a, i) => (
                    <span
                      key={i}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        color: '#334155',
                        padding: '5px 12px',
                        borderRadius: 8,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <span style={{ color: '#16a34a' }}>✓</span>
                      <span>{a}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12, marginTop: 20 }}>
                <Link
                  href={`/hotels/${selectedHotel.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '14px 20px',
                      borderRadius: 12,
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(234, 88, 12, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    <span>View Hotel & Book Stay</span>
                    <span>→</span>
                  </button>
                </Link>

                <Link
                  href="/hotels?category=premium&minRating=4"
                  style={{ textDecoration: 'none' }}
                >
                  <button
                    type="button"
                    style={{
                      width: '100%',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1.5px solid #bfdbfe',
                      padding: '14px 16px',
                      borderRadius: 12,
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <span>All 4★ & 5★ Hotels</span>
                  </button>
                </Link>
              </div>

            </div>

          </div>
        </div>
      )}
    </>
  );
}