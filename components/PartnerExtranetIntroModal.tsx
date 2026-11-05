'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface PartnerExtranetIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenExtranet?: () => void;
  hotelName?: string;
  hotelCity?: string;
}

const SLIDES = [
  {
    step: '01',
    badge: '🏨 Beautiful Property Showcase',
    title: 'Showcase Your Hotel to Millions of Travelers',
    description:
      'Present your property with high-resolution photos, dynamic room categories, transparent amenities, and verified guest reviews on India’s most trusted OTA platform.',
    highlight: 'Instant 4K Catalog • 1-Click Inventory • Verified Partner Badge',
    stat: '3.4x Higher Views',
    statLabel: 'vs traditional listings',
    visualType: 'hotel_showcase',
  },
  {
    step: '02',
    badge: '⚡ Frictionless Booking Engine',
    title: 'How Bookings Are Easily Done on StayBuddy',
    description:
      'Guests complete guaranteed reservations in under 45 seconds. Bank-grade Razorpay encryption, instant booking vouchers via WhatsApp & SMS, and 0 payment drops.',
    highlight: 'Instant Confirmation • WhatsApp Voucher • 100% Guaranteed',
    stat: '45 Seconds',
    statLabel: 'average guest checkout time',
    visualType: 'booking_engine',
  },
  {
    step: '03',
    badge: '📈 Single Platform to Scale',
    title: 'Grow Your Hotel Business with Extranet CRM',
    description:
      'Automated rate adjustments, Smart Room Blocking during peak offline rush, instant margin controls, and direct bank settlement without commission headaches.',
    highlight: 'Smart Block Protection • Direct Bank Payout • Real-time Occupancy',
    stat: '98% Occupancy',
    statLabel: 'average partner weekend fill rate',
    visualType: 'extranet_crm',
  },
];

export default function PartnerExtranetIntroModal({
  isOpen,
  onClose,
  onOpenExtranet,
  hotelName = 'Hotel Pushpa Grand',
  hotelCity = 'Hyderabad',
}: PartnerExtranetIntroModalProps) {
  const [activeSlide, setActiveSlide] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Auto advance slide every 5 seconds if open
  useEffect(() => {
    if (!isOpen) {
      setActiveSlide(0);
      setIsClosing(false);
      return;
    }
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const current = SLIDES[activeSlide];

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleProceed = () => {
    if (onOpenExtranet) {
      handleClose();
      setTimeout(() => {
        onOpenExtranet();
      }, 350);
    } else {
      handleClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'sbFadeIn 0.25s ease-out forwards',
        padding: 0,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <style>{`
        @keyframes slideUpFromBottom {
          0% {
            transform: translateY(100%) scale(0.96);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes slideDownToBottom {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(100%) scale(0.96);
            opacity: 0;
          }
        }
        @keyframes pulseGlowOrange {
          0%, 100% { box-shadow: 0 0 25px rgba(249, 115, 22, 0.4); }
          50% { box-shadow: 0 0 45px rgba(249, 115, 22, 0.75); }
        }
        @keyframes floatMini {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes tickerPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.03); opacity: 0.95; }
        }
      `}</style>

      {/* The Bottom Slide-Up Graphic Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 960,
          background: 'linear-gradient(145deg, #0f172a 0%, #1e1b4b 55%, #180d29 100%)',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          borderTop: '2px solid rgba(249, 115, 22, 0.5)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 -25px 60px rgba(0, 0, 0, 0.65), 0 0 50px rgba(249, 115, 22, 0.25)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          animation: isClosing
            ? 'slideDownToBottom 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards'
            : 'slideUpFromBottom 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Ambient background glow orbs */}
        <div
          style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-15%',
            left: '-10%',
            width: 320,
            height: 320,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Top Header Bar */}
        <div
          style={{
            padding: '20px 28px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.3rem',
                boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.01em', color: '#ffffff' }}>
                StayBuddy Partner Extranet OS
              </div>
              <div style={{ fontSize: '0.78rem', color: '#fdba74', fontWeight: 600 }}>
                Enterprise Property & Revenue Management
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#4ade80',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              ● System Online
            </span>
            <button
              type="button"
              onClick={handleClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '1.1rem',
                transition: 'all 0.15s ease',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div
          style={{
            padding: '24px 28px',
            overflowY: 'auto',
            position: 'relative',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* Main Grid: Left Narrative + Right Visual Animation Stage */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 24,
              alignItems: 'center',
            }}
          >
            {/* Left Column: Story & Metrics */}
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(249, 115, 22, 0.18)',
                  color: '#fb923c',
                  border: '1px solid rgba(249, 115, 22, 0.35)',
                  padding: '5px 12px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: 12,
                }}
              >
                <span>{current.badge}</span>
              </div>

              <h2
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  margin: '0 0 10px',
                  lineHeight: 1.25,
                  letterSpacing: '-0.02em',
                }}
              >
                {current.title}
              </h2>

              <p
                style={{
                  fontSize: '0.92rem',
                  color: '#94a3b8',
                  lineHeight: 1.6,
                  margin: '0 0 16px',
                }}
              >
                {current.description}
              </p>

              {/* Feature Pill Highlight */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                    Partner Superpower
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc', marginTop: 2 }}>
                    {current.highlight}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#f97316' }}>{current.stat}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{current.statLabel}</div>
                </div>
              </div>

              {/* Slide Progress Buttons */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {SLIDES.map((s, idx) => (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setActiveSlide(idx)}
                    style={{
                      height: 8,
                      width: activeSlide === idx ? 32 : 12,
                      borderRadius: 4,
                      background: activeSlide === idx ? '#f97316' : 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      padding: 0,
                    }}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: 8, fontWeight: 700 }}>
                  0{activeSlide + 1} / 03
                </span>
              </div>
            </div>

            {/* Right Column: High-Tech Graphic Mockup Container */}
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.65)',
                borderRadius: 20,
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '20px',
                position: 'relative',
                boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              {/* Dynamic Graphic Stage based on visualType */}
              {current.visualType === 'hotel_showcase' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Property Card Mock */}
                  <div
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      borderRadius: 16,
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      padding: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      animation: 'floatMini 4s ease-in-out infinite',
                    }}
                  >
                    <div
                      style={{
                        width: 76,
                        height: 76,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, #334155, #1e293b)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        flexShrink: 0,
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      🏨
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc' }}>{hotelName}</span>
                        <span style={{ fontSize: '0.7rem', background: '#059669', color: '#fff', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>VERIFIED</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 3 }}>
                        📍 {hotelCity} • 12 Active Room Categories
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f97316', marginTop: 4 }}>
                        ₹2,650 / night <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>+ Instant Sync</span>
                      </div>
                    </div>
                  </div>

                  {/* Incoming Booking Bubble */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.25))',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: 14,
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      animation: 'tickerPulse 3s ease-in-out infinite',
                    }}
                  >
                    <div style={{ fontSize: '1.4rem' }}>🛎️</div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#4ade80' }}>
                        LIVE BOOKING RECEIVED: Deluxe Room
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                        Guest checked in via StayBuddy App • Payout Secured via Razorpay
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {current.visualType === 'booking_engine' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Step 1 -> Step 2 -> Step 3 Flow */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize: '1.1rem' }}>🔍</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: 4 }}>1. Search</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Zero latency</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(249, 115, 22, 0.15)', borderRadius: 12, padding: '10px', textAlign: 'center', border: '1px solid rgba(249, 115, 22, 0.3)' }}>
                      <div style={{ fontSize: '1.1rem' }}>💳</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fb923c', marginTop: 4 }}>2. 1-Click Pay</div>
                      <div style={{ fontSize: '0.68rem', color: '#fdba74' }}>Razorpay instant</div>
                    </div>
                    <div style={{ flex: 1, background: 'rgba(34, 197, 94, 0.15)', borderRadius: 12, padding: '10px', textAlign: 'center', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                      <div style={{ fontSize: '1.1rem' }}>📲</div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#4ade80', marginTop: 4 }}>3. Voucher</div>
                      <div style={{ fontSize: '0.68rem', color: '#86efac' }}>WhatsApp delivery</div>
                    </div>
                  </div>

                  {/* Digital Voucher Preview Card */}
                  <div
                    style={{
                      background: 'rgba(30, 41, 59, 0.85)',
                      borderRadius: 14,
                      padding: '12px 14px',
                      border: '1px dashed rgba(249, 115, 22, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>
                        Digital Voucher #SB-007
                      </div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', marginTop: 2 }}>
                        1 Night Stay • Guaranteed Check-in
                      </div>
                    </div>
                    <div
                      style={{
                        background: '#22c55e',
                        color: '#ffffff',
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                      }}
                    >
                      ✓ Confirmed
                    </div>
                  </div>
                </div>
              )}

              {current.visualType === 'extranet_crm' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Revenue Ticker */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: 12,
                      padding: '10px 14px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Weekly Revenue</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#22c55e' }}>₹1,42,800</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Occ. Rate</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f97316' }}>96.4%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Smart Block</div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8' }}>🔒 Active</div>
                    </div>
                  </div>

                  {/* CRM Quick Switch controls */}
                  <div
                    style={{
                      background: 'rgba(30, 41, 59, 0.7)',
                      borderRadius: 12,
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '1.1rem' }}>⚙️</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>Direct Bank Payout Settlement</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#4ade80', fontWeight: 800 }}>T+1 Daily</span>
                  </div>
                </div>
              )}

              {/* Bottom Tagline */}
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#64748b',
                  textAlign: 'center',
                  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingTop: 8,
                }}
              >
                StayBuddy Extranet OS • Zero Onboarding Fee • Complete Room & Pricing Autonomy
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              paddingTop: 8,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveSlide((prev) => (prev + 1) % SLIDES.length)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                padding: '10px 18px',
                borderRadius: 12,
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span>Next Highlight</span>
              <span>→</span>
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  padding: '10px 16px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Preview
              </button>

              <button
                type="button"
                onClick={handleProceed}
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '12px 26px',
                  borderRadius: 14,
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 20px rgba(234, 88, 12, 0.45)',
                  animation: 'pulseGlowOrange 3s infinite',
                }}
              >
                <span>🚀 Open Extranet CRM Now</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

