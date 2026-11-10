'use client';

import React from 'react';
import Link from 'next/link';

export default function HomeSpotlightCards() {
  return (
    <section className="container" style={{ marginBottom: '22px' }}>
      <style>{`
        /* ===== Spotlight Cards Grid & Mobile Carousel ===== */
        .spotlight-duo-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        @media (max-width: 768px) {
          .spotlight-duo-grid {
            display: flex !important;
            flex-direction: row !important;
            flex-wrap: nowrap !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory;
            gap: 14px;
            padding: 4px 16px 14px !important;
            margin-left: -16px;
            margin-right: -16px;
            scrollbar-width: none;
            -ms-overflow-style: none;
            -webkit-overflow-scrolling: touch;
          }
          .spotlight-duo-grid::-webkit-scrollbar {
            display: none;
          }
          .spotlight-card-wrapper {
            flex: 0 0 88% !important;
            min-width: 285px !important;
            max-width: 360px !important;
            scroll-snap-align: start;
          }
        }

        /* ===== Animations ===== */
        @keyframes newlyAddedGlow {
          0%, 100% {
            box-shadow: 0 8px 24px rgba(234, 88, 12, 0.16), 0 0 0 1px rgba(251, 146, 60, 0.25);
          }
          50% {
            box-shadow: 0 14px 34px rgba(234, 88, 12, 0.32), 0 0 0 2px rgba(251, 146, 60, 0.45);
          }
        }

        @keyframes corporateGlow {
          0%, 100% {
            box-shadow: 0 8px 24px rgba(15, 23, 42, 0.3), 0 0 0 1px rgba(217, 119, 6, 0.25);
          }
          50% {
            box-shadow: 0 14px 34px rgba(15, 23, 42, 0.5), 0 0 0 2px rgba(245, 158, 11, 0.45);
          }
        }

        @keyframes lightSweep {
          0% {
            transform: translateX(-150%) skewX(-25deg);
          }
          25%, 100% {
            transform: translateX(250%) skewX(-25deg);
          }
        }

        @keyframes liveBeaconPing {
          0% {
            transform: scale(0.9);
            box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.7);
          }
          70% {
            transform: scale(1.1);
            box-shadow: 0 0 0 8px rgba(234, 88, 12, 0);
          }
          100% {
            transform: scale(0.9);
            box-shadow: 0 0 0 0 rgba(234, 88, 12, 0);
          }
        }

        @keyframes gentleFloat {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-5px) rotate(2deg);
          }
        }

        @keyframes arrowSlide {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(5px);
          }
        }

        /* Card 1: Newly Added Hotels Styles */
        .spotlight-card-new {
          position: relative;
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 45%, #fed7aa 100%);
          border-radius: 20px;
          padding: 24px;
          overflow: hidden;
          cursor: pointer;
          border: 1.5px solid #fdba74;
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          min-height: 230px;
          animation: newlyAddedGlow 4s infinite ease-in-out;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
          text-decoration: none;
          color: inherit;
        }

        .spotlight-card-new:hover {
          transform: translateY(-6px) scale(1.015);
          box-shadow: 0 20px 42px rgba(234, 88, 12, 0.35), 0 0 0 2.5px #ea580c;
          border-color: #ea580c;
        }

        .spotlight-card-new:active {
          transform: scale(0.975);
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.25);
          filter: brightness(0.97);
        }

        .spotlight-card-new .shimmer-bar {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 100%);
          pointer-events: none;
          animation: lightSweep 4.5s infinite ease-in-out;
          z-index: 2;
        }

        .spotlight-card-new .floating-emojis {
          position: absolute;
          right: 14px;
          bottom: 12px;
          font-size: 4.8rem;
          opacity: 0.14;
          pointer-events: none;
          animation: gentleFloat 5s infinite ease-in-out;
          transition: transform 0.3s ease, opacity 0.3s ease;
          z-index: 1;
        }

        .spotlight-card-new:hover .floating-emojis {
          opacity: 0.22;
          transform: translateY(-8px) scale(1.08) rotate(5deg);
        }

        .spotlight-card-new:hover .action-arrow {
          animation: arrowSlide 0.8s infinite ease-in-out;
        }

        /* Card 2: Corporate Hotels Styles */
        .spotlight-card-corp {
          position: relative;
          background: linear-gradient(135deg, #0b1120 0%, #1e293b 55%, #0f172a 100%);
          border-radius: 20px;
          padding: 24px;
          overflow: hidden;
          cursor: pointer;
          border: 1.5px solid rgba(245, 158, 11, 0.4);
          display: flex;
          flex-direction: column;
          justifyContent: space-between;
          min-height: 230px;
          animation: corporateGlow 4s infinite ease-in-out;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
          text-decoration: none;
          color: white;
        }

        .spotlight-card-corp:hover {
          transform: translateY(-6px) scale(1.015);
          box-shadow: 0 20px 42px rgba(15, 23, 42, 0.65), 0 0 0 2px #f59e0b;
          border-color: #f59e0b;
        }

        .spotlight-card-corp:active {
          transform: scale(0.975);
          box-shadow: 0 4px 14px rgba(15, 23, 42, 0.4);
          filter: brightness(0.95);
        }

        .spotlight-card-corp .shimmer-bar {
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(245, 158, 11, 0.2) 50%, rgba(255,255,255,0) 100%);
          pointer-events: none;
          animation: lightSweep 5s infinite ease-in-out 1.5s;
          z-index: 2;
        }

        .spotlight-card-corp .floating-emojis {
          position: absolute;
          right: 14px;
          bottom: 12px;
          font-size: 4.8rem;
          opacity: 0.12;
          pointer-events: none;
          animation: gentleFloat 6s infinite ease-in-out 1s;
          transition: transform 0.3s ease, opacity 0.3s ease;
          z-index: 1;
        }

        .spotlight-card-corp:hover .floating-emojis {
          opacity: 0.22;
          transform: translateY(-8px) scale(1.08) rotate(-4deg);
        }

        .spotlight-card-corp:hover .action-arrow {
          animation: arrowSlide 0.8s infinite ease-in-out;
        }
      `}</style>

      <div className="spotlight-duo-grid">
        {/* CARD 1: Newly Added Hotels (Full Dynamic Animation) */}
        <div className="spotlight-card-wrapper">
          <Link href="/hotels?sortBy=newest&filter=new" className="spotlight-card-new">
            <div className="shimmer-bar" />
            <div className="floating-emojis">🏨✨</div>

            <div style={{ position: 'relative', zIndex: 3 }}>
              {/* Header Badge with Pulsing Beacon */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: '#ffffff',
                  color: '#ea580c',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  border: '1px solid #fed7aa',
                  boxShadow: '0 2px 8px rgba(234, 88, 12, 0.15)'
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: '#ea580c',
                    display: 'inline-block',
                    animation: 'liveBeaconPing 1.8s infinite ease-in-out'
                  }} />
                  Newly Added Hotels
                </span>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#9a3412',
                  background: 'rgba(255, 237, 213, 0.85)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid #fdba74'
                }}>
                  ⚡ Fresh Onboardings
                </span>
              </div>

              {/* Title & Description */}
              <h3 style={{
                margin: '0 0 6px',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#7c2d12',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                Fresh Hotels & New Arrivals
              </h3>
              <p style={{
                margin: '0 0 14px',
                fontSize: '0.88rem',
                color: '#9a3412',
                lineHeight: 1.45,
                opacity: 0.95
              }}>
                Discover recently onboarded verified properties with special introductory pricing & instant booking confirmation.
              </p>

              {/* Feature Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#7c2d12', background: 'rgba(255, 255, 255, 0.8)', padding: '3px 8px', borderRadius: 6, border: '1px solid #fdba74' }}>
                  🏷️ Launch Discounts
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#7c2d12', background: 'rgba(255, 255, 255, 0.8)', padding: '3px 8px', borderRadius: 6, border: '1px solid #fdba74' }}>
                  🛡️ Verified Clean
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#7c2d12', background: 'rgba(255, 255, 255, 0.8)', padding: '3px 8px', borderRadius: 6, border: '1px solid #fdba74' }}>
                  ⚡ Live Availability
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              borderTop: '1px solid rgba(251, 146, 60, 0.35)'
            }}>
              <span style={{
                color: '#ea580c',
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>Explore New Arrivals</span>
                <span className="action-arrow">→</span>
              </span>
              <span style={{
                background: '#ea580c',
                color: '#ffffff',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(234, 88, 12, 0.4)'
              }}>
                →
              </span>
            </div>
          </Link>
        </div>

        {/* CARD 2: Corporate Hotels (Sleek Executive Business Design) */}
        <div className="spotlight-card-wrapper">
          <Link href="/hotels?corporate=true" className="spotlight-card-corp">
            <div className="shimmer-bar" />
            <div className="floating-emojis">🏢💼</div>

            <div style={{ position: 'relative', zIndex: 3 }}>
              {/* Header Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(245, 158, 11, 0.45)',
                  boxShadow: '0 2px 10px rgba(245, 158, 11, 0.2)'
                }}>
                  <span>💼</span> StayBuddy Corporate
                </span>

                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#e2e8f0',
                  background: 'rgba(30, 41, 59, 0.85)',
                  padding: '3px 8px',
                  borderRadius: 6,
                  border: '1px solid rgba(148, 163, 184, 0.3)'
                }}>
                  📄 100% GST Invoicing
                </span>
              </div>

              {/* Title & Description */}
              <h3 style={{
                margin: '0 0 6px',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#f8fafc',
                letterSpacing: '-0.02em',
                lineHeight: 1.2
              }}>
                Corporate & Business Stays
              </h3>
              <p style={{
                margin: '0 0 14px',
                fontSize: '0.88rem',
                color: '#cbd5e1',
                lineHeight: 1.45,
                opacity: 0.95
              }}>
                Prime corporate rates, dedicated business amenities, express check-in and automated GST tax invoices for seamless expense filing.
              </p>

              {/* Feature Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fef08a', background: 'rgba(245, 158, 11, 0.12)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(245, 158, 11, 0.35)' }}>
                  📄 GST Tax Invoice
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f8fafc', background: 'rgba(30, 41, 59, 0.7)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.35)' }}>
                  ⚡ Express Check-in
                </span>
                <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f8fafc', background: 'rgba(30, 41, 59, 0.7)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(148, 163, 184, 0.35)' }}>
                  📶 High-Speed WiFi
                </span>
              </div>
            </div>

            {/* Action Bar */}
            <div style={{
              position: 'relative',
              zIndex: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: 14,
              borderTop: '1px solid rgba(148, 163, 184, 0.2)'
            }}>
              <span style={{
                color: '#fbbf24',
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6
              }}>
                <span>Book Corporate Stays</span>
                <span className="action-arrow">→</span>
              </span>
              <span style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                width: 32,
                height: 32,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.95rem',
                fontWeight: 800,
                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)'
              }}>
                →
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
