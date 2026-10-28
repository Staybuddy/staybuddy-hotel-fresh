'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface SmartPromoBannerProps {
  hotels?: any[];
}

export default function SmartPromoBanner({ hotels = [] }: SmartPromoBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [activeCityTab, setActiveCityTab] = useState('Hyderabad');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [slideProgress, setSlideProgress] = useState(0);

  const SLIDE_DURATION = 6000; // 6 seconds per slide
  const TOTAL_SLIDES = 3;

  // Selected sample newly added hotels
  const newlyAddedList = [
    {
      id: 'new-1',
      name: 'The Grand Horizon Resort & Spa',
      city: 'Goa',
      location: 'Candolim Beach, Goa',
      rating: 4.9,
      reviews: 142,
      price: 1899,
      originalPrice: 3299,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80',
      badge: 'Oceanfront View',
    },
    {
      id: 'new-2',
      name: 'Cyber Heights Boutique Hotel',
      city: 'Hyderabad',
      location: 'HITEC City, Hyderabad',
      rating: 4.8,
      reviews: 98,
      price: 1399,
      originalPrice: 2499,
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80',
      badge: 'Tech Park Sync',
    },
    {
      id: 'new-3',
      name: 'Royal Heritage Haveli & Palace',
      city: 'Jaipur',
      location: 'Civil Lines, Jaipur',
      rating: 4.9,
      reviews: 210,
      price: 2199,
      originalPrice: 3999,
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
      badge: 'Royal Courtyard',
    },
  ];

  // Connected cities and hubs
  const CONNECTED_HUBS = [
    { city: 'Hyderabad', count: '48 Hotels', status: 'Online (0.6s)', ping: '24ms' },
    { city: 'Mumbai', count: '84 Hotels', status: 'Online (0.5s)', ping: '18ms' },
    { city: 'Goa', count: '62 Hotels', status: 'Online (0.7s)', ping: '29ms' },
    { city: 'Bengaluru', count: '56 Hotels', status: 'Online (0.4s)', ping: '15ms' },
    { city: 'Delhi-NCR', count: '74 Hotels', status: 'Online (0.6s)', ping: '21ms' },
    { city: 'Jaipur', count: '39 Hotels', status: 'Online (0.8s)', ping: '32ms' },
    { city: 'Chennai', count: '35 Hotels', status: 'Online (0.7s)', ping: '28ms' },
  ];

  // Auto slide timer with smooth progress bar
  useEffect(() => {
    if (isPaused || showVideoModal) return;

    const intervalTime = 50; // update progress every 50ms
    const step = (intervalTime / SLIDE_DURATION) * 100;

    const interval = setInterval(() => {
      setSlideProgress((prev) => {
        if (prev >= 100) {
          setCurrentSlide((curr) => (curr + 1) % TOTAL_SLIDES);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isPaused, showVideoModal, currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setSlideProgress(0);
  };

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % TOTAL_SLIDES);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + TOTAL_SLIDES) % TOTAL_SLIDES);
  };

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const toggleVideoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsVideoPlaying(true);
      } else {
        videoRef.current.pause();
        setIsVideoPlaying(false);
      }
    }
  };

  const toggleVideoMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsVideoMuted(videoRef.current.muted);
    }
  };

  return (
    <section
      className="smart-promo-banner-section"
      style={{
        width: '100%',
        maxWidth: '1240px',
        margin: '12px auto 20px auto',
        padding: '0 16px',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 20,
      }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        .smart-banner-card {
          border-radius: 24px;
          overflow: hidden;
          position: relative;
          color: white;
          box-shadow: 0 16px 40px -10px rgba(15, 23, 42, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .smart-banner-card:hover {
          box-shadow: 0 24px 50px -10px rgba(30, 27, 75, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
        }
        
        .pulse-beacon {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          animation: beaconPulse 1.8s infinite cubic-bezier(0.66, 0, 0, 1);
        }
        @keyframes beaconPulse {
          0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
          100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }

        .radar-sweep {
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 50%;
          border: 1px dashed rgba(45, 212, 191, 0.4);
          animation: rotateRadar 12s linear infinite;
        }
        @keyframes rotateRadar {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .cta-glow-btn {
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
          border: none;
          border-radius: 14px;
          padding: 12px 24px;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          box-shadow: 0 6px 20px -2px rgba(249, 115, 22, 0.5);
          transition: all 0.25s ease;
        }
        .cta-glow-btn:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 25px -2px rgba(249, 115, 22, 0.65);
          color: white;
        }

        .nav-arrow-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.1rem;
          z-index: 15;
          transition: all 0.2s ease;
        }
        .nav-arrow-btn:hover {
          background: rgba(249, 115, 22, 0.9);
          transform: translateY(-50%) scale(1.1);
        }

        @media (max-width: 900px) {
          .banner-grid-layout {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .banner-video-container {
            width: 100% !important;
            max-width: 100% !important;
            height: 220px !important;
          }
          .nav-arrow-btn {
            display: none !important;
          }
        }

        @media (max-width: 580px) {
          .stats-grid-responsive {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .smart-features-responsive {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 480px) {
          .smart-banner-card {
            border-radius: 20px !important;
          }
          .banner-content-padding {
            padding: 24px 14px 16px 14px !important;
          }
          .banner-title {
            font-size: 1.3rem !important;
            line-height: 1.25 !important;
          }
          .banner-video-container {
            height: 190px !important;
          }
          .cta-glow-btn {
            width: 100% !important;
            justify-content: center !important;
            padding: 12px 18px !important;
          }
          .banner-bottom-ticker {
            padding: 10px 14px !important;
            font-size: 0.72rem !important;
          }
        }
      `}</style>

      {/* Main Promo Card */}
      <div
        className="smart-banner-card"
        style={{
          background:
            currentSlide === 0
              ? 'radial-gradient(circle at 85% 20%, rgba(249, 115, 22, 0.25) 0%, transparent 55%), linear-gradient(135deg, #180d38 0%, #29124e 45%, #180d38 100%)'
              : currentSlide === 1
              ? 'radial-gradient(circle at 85% 20%, rgba(13, 148, 136, 0.35) 0%, transparent 55%), linear-gradient(135deg, #091e3a 0%, #0d3656 45%, #052627 100%)'
              : 'radial-gradient(circle at 85% 20%, rgba(234, 88, 12, 0.3) 0%, transparent 55%), linear-gradient(135deg, #2a0845 0%, #461461 45%, #1c092c 100%)',
        }}
      >
        {/* Top Story-Style Progress Bars */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 16,
            right: 16,
            display: 'flex',
            gap: 8,
            zIndex: 10,
          }}
        >
          {[0, 1, 2].map((idx) => {
            const isCompleted = idx < currentSlide;
            const isCurrent = idx === currentSlide;
            return (
              <div
                key={idx}
                onClick={() => goToSlide(idx)}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 99,
                  background: 'rgba(255, 255, 255, 0.22)',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: isCompleted ? '100%' : isCurrent ? `${slideProgress}%` : '0%',
                    background:
                      isCurrent && currentSlide === 1
                        ? '#2dd4bf'
                        : isCurrent && currentSlide === 2
                        ? '#fb923c'
                        : '#f97316',
                    boxShadow: '0 0 8px rgba(249, 115, 22, 0.8)',
                    transition: isCurrent ? 'none' : 'width 0.2s ease',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Navigation Arrow Buttons */}
        <button
          className="nav-arrow-btn"
          onClick={prevSlide}
          aria-label="Previous Slide"
          style={{ left: 12 }}
        >
          ‹
        </button>
        <button
          className="nav-arrow-btn"
          onClick={nextSlide}
          aria-label="Next Slide"
          style={{ right: 12 }}
        >
          ›
        </button>

        {/* SLIDE CONTENT AREA */}
        <div
          className="banner-content-padding"
          style={{
            padding: '34px 32px 24px 32px',
            position: 'relative',
            zIndex: 5,
          }}
        >
          {/* ==================== SLIDE 0: NEWLY ADDED HOTELS + VIDEO ==================== */}
          {currentSlide === 0 && (
            <div
              className="banner-grid-layout"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.1fr',
                gap: 28,
                alignItems: 'center',
              }}
            >
              {/* Left Column: Copy & CTAs */}
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(249, 115, 22, 0.15)',
                    border: '1px solid rgba(249, 115, 22, 0.35)',
                    padding: '4px 12px',
                    borderRadius: 99,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: '#fb923c',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  <span className="pulse-beacon" />
                  ✨ JUST ONBOARDED • FRESH HOTEL PARTNERS
                </div>

                <h2
                  className="banner-title"
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 900,
                    color: 'white',
                    margin: '0 0 10px 0',
                    lineHeight: 1.25,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Newly Added Luxury & Boutique Stays
                </h2>

                <p
                  style={{
                    fontSize: '0.92rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.5,
                    margin: '0 0 18px 0',
                    maxWidth: 520,
                  }}
                >
                  Hand-verified properties across Goa, Hyderabad, Jaipur & Mumbai. Enjoy verified
                  pool villas, heritage stays, and exclusive intro discounts up to 35% off with zero
                  convenience fee!
                </p>

                {/* Highlights Pills */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 20,
                  }}
                >
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'rgba(255, 255, 255, 0.9)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    🏨 14 Stays Added This Week
                  </span>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'rgba(255, 255, 255, 0.9)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    ⭐ 100% On-Site Inspected
                  </span>
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'rgba(255, 255, 255, 0.9)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    ⚡ Direct Frontdesk Confirmation
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Link href="/hotels" className="cta-glow-btn">
                    <span>Explore Newly Added</span>
                    <span>→</span>
                  </Link>

                  <button
                    onClick={() => setShowVideoModal(true)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: 'white',
                      borderRadius: 14,
                      padding: '11px 18px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      backdropFilter: 'blur(8px)',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.22)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                  >
                    <span>▶ Watch 4K Tour</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Live Video Showcase Card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  className="banner-video-container"
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '240px',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15)',
                    background: '#0a0a0f',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowVideoModal(true)}
                >
                  {/* HTML5 Video */}
                  <video
                    ref={videoRef}
                    src="/videos/luxury-hotel-preview.webm"
                    autoPlay
                    loop
                    muted={isVideoMuted}
                    playsInline
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />

                  {/* Gradient Overlay for Text Readability */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(to top, rgba(15, 23, 42, 0.88) 0%, rgba(15, 23, 42, 0.2) 50%, rgba(15, 23, 42, 0.4) 100%)',
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Top Badges on Video */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 12,
                      right: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        background: 'rgba(239, 68, 68, 0.9)',
                        backdropFilter: 'blur(6px)',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        letterSpacing: '0.04em',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'white',
                          display: 'inline-block',
                        }}
                      />
                      LIVE VIDEO REEL
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={toggleVideoMute}
                        aria-label="Toggle Mute"
                        style={{
                          background: 'rgba(15, 23, 42, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          color: 'white',
                          borderRadius: '50%',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        {isVideoMuted ? '🔇' : '🔊'}
                      </button>
                      <button
                        onClick={toggleVideoPlay}
                        aria-label="Toggle Play"
                        style={{
                          background: 'rgba(15, 23, 42, 0.75)',
                          border: '1px solid rgba(255, 255, 255, 0.25)',
                          color: 'white',
                          borderRadius: '50%',
                          width: 28,
                          height: 28,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        {isVideoPlaying ? '⏸' : '▶'}
                      </button>
                    </div>
                  </div>

                  {/* Bottom Info on Video */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 12,
                      left: 12,
                      right: 12,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-end',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: '#fb923c',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        Featured Partner
                      </div>
                      <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'white' }}>
                        The Cliff Bay Resort & Suites
                      </div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255,255,255,0.8)',
                          marginTop: 2,
                        }}
                      >
                        Goa Oceanfront • 4.9 ★ Verified
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255,255,255,0.7)',
                          textDecoration: 'line-through',
                        }}
                      >
                        ₹3,499
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#4ade80' }}>
                        ₹1,499
                        <span style={{ fontSize: '0.75rem', color: 'white', fontWeight: 500 }}>
                          /nt
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Newly Added Mini Card Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                  }}
                >
                  {newlyAddedList.map((hotel) => (
                    <Link
                      key={hotel.id}
                      href={`/hotels?city=${hotel.city}`}
                      style={{
                        textDecoration: 'none',
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 10,
                        padding: '6px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'background 0.2s ease',
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')
                      }
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 6,
                          overflow: 'hidden',
                          flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        <img
                          src={hotel.image}
                          alt={hotel.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: 'white',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {hotel.city}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: 800 }}>
                          ₹{hotel.price}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== SLIDE 1: CONNECTIVITY & NATIONWIDE NETWORK ==================== */}
          {currentSlide === 1 && (
            <div
              className="banner-grid-layout"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.1fr',
                gap: 28,
                alignItems: 'center',
              }}
            >
              {/* Left Column: Connectivity Stats */}
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(45, 212, 191, 0.15)',
                    border: '1px solid rgba(45, 212, 191, 0.35)',
                    padding: '4px 12px',
                    borderRadius: 99,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: '#2dd4bf',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  <span className="pulse-beacon" />
                  🌐 DIRECT EXTRANET • ZERO-WAIT CONNECTIVITY
                </div>

                <h2
                  className="banner-title"
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 900,
                    color: 'white',
                    margin: '0 0 10px 0',
                    lineHeight: 1.25,
                    letterSpacing: '-0.02em',
                  }}
                >
                  500+ Partner Hotels Across 25+ Indian Hubs
                </h2>

                <p
                  style={{
                    fontSize: '0.92rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.5,
                    margin: '0 0 18px 0',
                    maxWidth: 520,
                  }}
                >
                  StayBuddy&apos;s direct API integration connects to hotel front-desk management
                  systems in real time. Experience guaranteed room reservations, zero overbooking,
                  and instant voucher delivery in under 0.8 seconds.
                </p>

                {/* Live Stats Counters */}
                <div
                  className="stats-grid-responsive"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  {[
                    { label: 'Hotels', value: '500+', desc: 'Direct Connected' },
                    { label: 'Cities', value: '25+', desc: 'Metros & Hubs' },
                    { label: 'Sync Speed', value: '0.8s', desc: 'Frontdesk API' },
                    { label: 'Guaranteed', value: '99.9%', desc: 'Room Allocation' },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: 12,
                        padding: '10px 8px',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '1.3rem',
                          fontWeight: 900,
                          color: '#2dd4bf',
                          lineHeight: 1.1,
                        }}
                      >
                        {stat.value}
                      </div>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'white',
                          marginTop: 3,
                        }}
                      >
                        {stat.label}
                      </div>
                      <div
                        style={{
                          fontSize: '0.65rem',
                          color: 'rgba(255, 255, 255, 0.65)',
                          marginTop: 2,
                        }}
                      >
                        {stat.desc}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link
                    href="/hotels"
                    className="cta-glow-btn"
                    style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}
                  >
                    <span>Check Live Availability</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href="/partner/login"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: 'white',
                      borderRadius: 14,
                      padding: '11px 18px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>🏨 Connect Your Hotel</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Live Connectivity Hub Visualizer */}
              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.7)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(45, 212, 191, 0.3)',
                  borderRadius: 20,
                  padding: '20px',
                  boxShadow: '0 12px 30px rgba(0, 0, 0, 0.4)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Visualizer Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 14,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    paddingBottom: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="pulse-beacon" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'white' }}>
                      StayBuddy Direct Mesh Network
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#2dd4bf',
                      background: 'rgba(45, 212, 191, 0.15)',
                      padding: '2px 8px',
                      borderRadius: 99,
                      fontWeight: 700,
                    }}
                  >
                    ⚡ Extranet Active
                  </span>
                </div>

                {/* City Nodes List */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 190,
                    overflowY: 'auto',
                  }}
                  className="hide-scrollbar"
                >
                  {CONNECTED_HUBS.map((hub) => (
                    <div
                      key={hub.city}
                      onClick={() => setActiveCityTab(hub.city)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        borderRadius: 10,
                        background:
                          activeCityTab === hub.city
                            ? 'rgba(45, 212, 191, 0.18)'
                            : 'rgba(255, 255, 255, 0.05)',
                        border:
                          activeCityTab === hub.city
                            ? '1px solid rgba(45, 212, 191, 0.5)'
                            : '1px solid rgba(255, 255, 255, 0.06)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.75rem' }}>🟢</span>
                        <div>
                          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'white' }}>
                            {hub.city}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                            {hub.count} • Frontdesk Direct
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2dd4bf' }}>
                          {hub.ping}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                          {hub.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== SLIDE 2: SUPER SMART APP FEATURES ==================== */}
          {currentSlide === 2 && (
            <div
              className="banner-grid-layout"
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.1fr',
                gap: 28,
                alignItems: 'center',
              }}
            >
              {/* Left Column: Smart Tech Description */}
              <div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(249, 115, 22, 0.15)',
                    border: '1px solid rgba(249, 115, 22, 0.35)',
                    padding: '4px 12px',
                    borderRadius: 99,
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    color: '#fb923c',
                    textTransform: 'uppercase',
                    marginBottom: 12,
                  }}
                >
                  <span className="pulse-beacon" />
                  🤖 NEXT-GEN STAYBUDDY • SUPER SMART APP
                </div>

                <h2
                  className="banner-title"
                  style={{
                    fontSize: '1.85rem',
                    fontWeight: 900,
                    color: 'white',
                    margin: '0 0 10px 0',
                    lineHeight: 1.25,
                    letterSpacing: '-0.02em',
                  }}
                >
                  Smart Price Lock & Instant WhatsApp Invoicing
                </h2>

                <p
                  style={{
                    fontSize: '0.92rem',
                    color: 'rgba(255, 255, 255, 0.85)',
                    lineHeight: 1.5,
                    margin: '0 0 18px 0',
                    maxWidth: 520,
                  }}
                >
                  StayBuddy is built smarter to protect your money and time. If a hotel lowers rates
                  before check-in, our Smart Price Shield auto-refunds the difference. Plus 1-click
                  GST tax invoices & zero-wait WhatsApp check-in.
                </p>

                {/* 4 Smart Feature Highlights */}
                <div
                  className="smart-features-responsive"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 10,
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🛡️</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>
                        Smart Price Shield
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.75)',
                          marginTop: 2,
                        }}
                      >
                        Auto-refund if room rate drops
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>📲</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>
                        WhatsApp Fast Pass
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.75)',
                          marginTop: 2,
                        }}
                      >
                        Key voucher & QR in 15 secs
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🧾</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>
                        1-Click GST Invoices
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.75)',
                          marginTop: 2,
                        }}
                      >
                        Auto-calculated nights & PDF
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.14)',
                      borderRadius: 12,
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>⚡</span>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>
                        60-Sec UPI Refund
                      </div>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'rgba(255, 255, 255, 0.75)',
                          marginTop: 2,
                        }}
                      >
                        Zero penalty direct to bank
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <Link href="/hotels" className="cta-glow-btn">
                    <span>Try Smart Search</span>
                    <span>→</span>
                  </Link>
                  <Link
                    href="/admin"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.25)',
                      color: 'white',
                      borderRadius: 14,
                      padding: '11px 18px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>📄 Download Tax Invoice</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: PhonePe-Style Floating Smart Pass Graphic */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 340,
                    background:
                      'linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: 22,
                    padding: '20px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.45)',
                    position: 'relative',
                  }}
                >
                  {/* Smart Card Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          background: 'linear-gradient(135deg, #fb923c, #ea580c)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                        }}
                      >
                        ⚡
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'white' }}>
                          StayBuddy Smart Pass
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#fb923c', fontWeight: 700 }}>
                          VERIFIED BOOKING
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        background: 'rgba(34, 197, 94, 0.2)',
                        color: '#4ade80',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 99,
                      }}
                    >
                      ✓ 0 Fee Locked
                    </span>
                  </div>

                  {/* QR & Details Preview */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.8)',
                      borderRadius: 14,
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      marginBottom: 14,
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        background: 'white',
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 4,
                      }}
                    >
                      <svg viewBox="0 0 24 24" width="48" height="48" fill="#0f172a">
                        <path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v3h-2v-3zm3 3h3v5h-2v-3h-1v-2zm-5 2h2v3h-2v-3zm0-2h3v1h-3v-1zm5 3h1v2h-1v-2z" />
                      </svg>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.72rem',
                          color: '#94a3b8',
                          textTransform: 'uppercase',
                        }}
                      >
                        Frontdesk Fast Track
                      </div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'white' }}>
                        Voucher #SB-2026-X8
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#2dd4bf', marginTop: 2 }}>
                        WhatsApp Delivery: Instant
                      </div>
                    </div>
                  </div>

                  {/* Live Status Row */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.8)',
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      paddingTop: 10,
                    }}
                  >
                    <span>GST Invoiced • SAC 996311</span>
                    <span style={{ color: '#fb923c', fontWeight: 700 }}>PhonePe UPI Ready</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Quick Service Ticker (Matching PhonePe's Clean Ribbon) */}
        <div
          className="banner-bottom-ticker"
          style={{
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '10px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: '0.8rem',
            fontWeight: 700,
          }}
        >
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: '#fb923c', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>✨</span>
              <span>14 Newly Added Hotels</span>
            </span>
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>⚡</span>
              <span>500+ Frontdesk Connections Live</span>
            </span>
            <span
              style={{
                color: 'rgba(255, 255, 255, 0.85)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>🛡️</span>
              <span>Smart Price Shield Enabled</span>
            </span>
          </div>

          {/* Dots Indicator for Mobile & Desktop */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  width: currentSlide === i ? 20 : 6,
                  height: 6,
                  borderRadius: 99,
                  background: currentSlide === i ? '#f97316' : 'rgba(255, 255, 255, 0.3)',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'all 0.25s ease',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* FULLSCREEN 4K VIDEO MODAL */}
      {showVideoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.88)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowVideoModal(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 880,
              background: '#090d16',
              borderRadius: 20,
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '14px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="pulse-beacon" />
                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>
                  StayBuddy Verified Partner Hotel Tour
                </span>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: 'white',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            <div style={{ width: '100%', maxHeight: '70vh', background: 'black' }}>
              <video
                src="/videos/luxury-hotel-preview.webm"
                controls
                autoPlay
                playsInline
                style={{ width: '100%', height: 'auto', maxHeight: '70vh', display: 'block' }}
              />
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div>
                <div style={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>
                  The Cliff Bay Luxury Suites & Spa
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: 2 }}>
                  Candolim Beach, Goa • Verified 4.9 ★ • Starting at ₹1,499/night
                </div>
              </div>
              <Link
                href="/hotels?city=Goa"
                className="cta-glow-btn"
                onClick={() => setShowVideoModal(false)}
              >
                Book This Stay →
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
