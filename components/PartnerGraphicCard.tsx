'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PartnerExtranetIntroModal from './PartnerExtranetIntroModal';

export default function PartnerGraphicCard() {
  const [showExtranetIntro, setShowExtranetIntro] = useState(false);

  return (
    <>
      <section className="section" style={{ padding: '0 var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <div className="container">
          <style>{`
            @keyframes meshFloat {
              0%, 100% { transform: translate(0, 0) scale(1); }
              50% { transform: translate(15px, -15px) scale(1.08); }
            }
            @keyframes glowBorderSweep {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            @keyframes marqueeSmooth {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            @keyframes pulseBadge {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.05); }
            }
          `}</style>

          <div
            style={{
              background: 'linear-gradient(135deg, #090d16 0%, #0f172a 45%, #1e1b4b 100%)',
              borderRadius: '24px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              color: 'white',
              boxShadow: '0 25px 60px -12px rgba(15, 23, 42, 0.5), 0 0 40px rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            {/* Ambient Animated Mesh Blobs */}
            <div
              style={{
                position: 'absolute',
                top: '-30%',
                right: '-10%',
                width: 450,
                height: 450,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(249, 115, 22, 0.22) 0%, transparent 65%)',
                animation: 'meshFloat 8s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-25%',
                left: '-5%',
                width: 380,
                height: 380,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
                animation: 'meshFloat 10s ease-in-out infinite reverse',
                pointerEvents: 'none',
              }}
            />

            {/* Main Content Area */}
            <div
              style={{
                padding: '40px 44px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 28,
                zIndex: 2,
                position: 'relative',
              }}
            >
              {/* Left Column: Heading, Subtitle & Value Props */}
              <div style={{ flex: '1 1 440px', minWidth: 280 }}>
                {/* Badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 14px',
                    background: 'rgba(249, 115, 22, 0.15)',
                    color: '#fb923c',
                    border: '1px solid rgba(249, 115, 22, 0.35)',
                    borderRadius: 20,
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 14,
                    animation: 'pulseBadge 3s infinite ease-in-out',
                  }}
                >
                  <span>✨ STAYBUDDY PARTNER NETWORK • 0% ONBOARDING FEE</span>
                </div>

                <h2
                  style={{
                    fontSize: '2rem',
                    margin: '0 0 10px 0',
                    color: '#ffffff',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    lineHeight: 1.25,
                  }}
                >
                  Grow Your Hotel Business with <span style={{ color: '#f97316' }}>StayBuddy Extranet CRM</span> 🚀
                </h2>

                <p style={{ color: '#94a3b8', fontSize: '0.96rem', margin: '0 0 20px 0', lineHeight: 1.6, maxWidth: 520 }}>
                  Showcase your rooms to millions of verified travelers, enjoy instant 1-click booking automation, and take 100% control over your hotel occupancy and revenue.
                </p>

                {/* 3 Metric Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 12,
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>📈</span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>3.4x Revenue</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>average increase</div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 12,
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>⚡</span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>45s Bookings</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>instant confirmations</div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 12,
                      padding: '8px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>🔒</span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>Smart Block</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>zero overbooking</div>
                    </div>
                  </div>
                </div>

                {/* Call-to-Action Buttons */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setShowExtranetIntro(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: 'white',
                      border: 'none',
                      padding: '13px 26px',
                      borderRadius: 14,
                      fontWeight: 800,
                      fontSize: '0.94rem',
                      cursor: 'pointer',
                      boxShadow: '0 6px 20px rgba(234, 88, 12, 0.4)',
                      transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    <span>🚀 Launch Partner Extranet</span>
                  </button>

                  <Link
                    href="/partner/login"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      padding: '13px 22px',
                      borderRadius: 14,
                      fontWeight: 700,
                      fontSize: '0.94rem',
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                      e.currentTarget.style.transform = 'scale(1.03)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <span>List Your Hotel Free →</span>
                  </Link>
                </div>
              </div>

              {/* Right Column: Interactive Animated Hotel & Extranet Graphic Stage */}
              <div
                style={{
                  flex: '1 1 360px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  maxWidth: 440,
                  width: '100%',
                }}
              >
                {/* Visual Card 1: Hotel Pushpa Grand Live Booking Ticker */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.14)',
                    borderRadius: 18,
                    padding: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowExtranetIntro(true)}
                >
                  <div
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #ea580c, #c2410c)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.6rem',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                    }}
                  >
                    🏨
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#f8fafc' }}>
                        Hotel Pushpa Grand
                      </span>
                      <span style={{ fontSize: '0.68rem', background: '#059669', color: '#fff', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>
                        98% OCC
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#cbd5e1', marginTop: 2 }}>
                      📍 Shamshabad, Hyderabad • Live Catalog
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#4ade80', fontWeight: 700, marginTop: 4 }}>
                      ● Booking Just Received: Deluxe AC Room (₹2,650)
                    </div>
                  </div>
                </div>

                {/* Visual Card 2: Extranet CRM Control Strip */}
                <div
                  style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 18,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.25)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowExtranetIntro(true)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: '1.3rem' }}>📊</div>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                        Extranet Revenue Engine
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Automated Daily Bank Settlement (T+1)
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(249, 115, 22, 0.15)',
                      border: '1px solid rgba(249, 115, 22, 0.35)',
                      color: '#fb923c',
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: '0.72rem',
                      fontWeight: 800,
                    }}
                  >
                    View Demo →
                  </div>
                </div>
              </div>
            </div>

            {/* Marquee Animation Strip with Live Highlights */}
            <div
              style={{
                position: 'relative',
                padding: '16px 0',
                background: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #c2410c 100%)',
                overflow: 'hidden',
                display: 'flex',
                whiteSpace: 'nowrap',
                borderTop: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div style={{ display: 'flex', gap: 36, animation: 'marqueeSmooth 22s linear infinite' }}>
                {[...Array(2)].map((_, i) => (
                  <React.Fragment key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🚀 Zero Onboarding Fee
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🏨 Instant 4K Hotel Catalog
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      ⚡ 45-Second Fast Bookings
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      🔒 Smart Room Block Protection
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.05rem', fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      💼 One Unified Partner Extranet CRM
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Slide-Up Graphic Intro Modal */}
      <PartnerExtranetIntroModal
        isOpen={showExtranetIntro}
        onClose={() => setShowExtranetIntro(false)}
        onOpenExtranet={() => {
          setShowExtranetIntro(false);
          window.location.href = '/partner';
        }}
      />
    </>
  );
}
