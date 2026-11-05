'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function PartnerGraphicCard() {
  const { data: session } = useSession();
  const router = useRouter();

  // Modal State: 'CLOSED' | 'DOOR' | 'GROWTH_CARD' | 'LAUNCHING'
  const [modalStage, setModalStage] = useState<'CLOSED' | 'DOOR' | 'GROWTH_CARD' | 'LAUNCHING'>('CLOSED');
  const [doorOpen, setDoorOpen] = useState(false);
  const [launchProgress, setLaunchProgress] = useState(0);

  // When door modal opens, trigger the 3D door swing after a short delay, then transition to growth card
  useEffect(() => {
    if (modalStage === 'DOOR') {
      setDoorOpen(false);
      const openTimer = setTimeout(() => {
        setDoorOpen(true);
      }, 400);

      const cardTimer = setTimeout(() => {
        setModalStage('GROWTH_CARD');
      }, 2100);

      return () => {
        clearTimeout(openTimer);
        clearTimeout(cardTimer);
      };
    }
  }, [modalStage]);

  // Handle the Launch Extranet Button click
  const handleLaunchExtranet = () => {
    setModalStage('LAUNCHING');
    setLaunchProgress(20);

    const p1 = setTimeout(() => setLaunchProgress(60), 400);
    const p2 = setTimeout(() => setLaunchProgress(100), 800);

    const redirectTimer = setTimeout(() => {
      // Directs straight to the Partner Extranet (/partner) where partners & admins manage/add properties
      const targetUrl = session?.user ? '/partner' : '/partner/login';
      router.push(targetUrl);
    }, 1200);

    return () => {
      clearTimeout(p1);
      clearTimeout(p2);
      clearTimeout(redirectTimer);
    };
  };

  return (
    <>
      <section className="container" style={{ marginBottom: '32px' }}>
        <style>{`
          /* Floating Animated Money Keyframes */
          @keyframes moneyFloat1 {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-12px) rotate(8deg); }
          }
          @keyframes moneyFloat2 {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-16px) rotate(-10deg); }
          }
          @keyframes moneyFloat3 {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-10px) scale(1.15); }
          }
          @keyframes coinGlint {
            0%, 100% { opacity: 0.8; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2) rotate(15deg); }
          }
          @keyframes pulseGoldGlow {
            0%, 100% { box-shadow: 0 12px 32px -8px rgba(5, 150, 105, 0.4), 0 0 24px rgba(245, 158, 11, 0.25); }
            50% { box-shadow: 0 16px 42px -6px rgba(5, 150, 105, 0.55), 0 0 36px rgba(245, 158, 11, 0.45); }
          }
          @keyframes shimmerSweep {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }

          /* 3D House Door Animations */
          @keyframes doorSwingLeft {
            0% { transform: perspective(800px) rotateY(0deg); }
            100% { transform: perspective(800px) rotateY(-88deg); }
          }
          @keyframes doorSwingRight {
            0% { transform: perspective(800px) rotateY(0deg); }
            100% { transform: perspective(800px) rotateY(88deg); }
          }
          @keyframes doorGlowBurst {
            0% { opacity: 0; transform: scale(0.6); }
            50% { opacity: 0.9; transform: scale(1.2); }
            100% { opacity: 1; transform: scale(1.4); }
          }
          @keyframes coinsBurstOut {
            0% { transform: translateY(20px) scale(0.4); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(-80px) scale(1.3); opacity: 0; }
          }
          @keyframes rocketFlyUp {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            50% { transform: translateY(-30px) scale(1.2); opacity: 1; }
            100% { transform: translateY(-140px) scale(0.4); opacity: 0; }
          }
        `}</style>

        {/* SHORT, ULTRA-SLEEK & LUXURIOUS PARTNER GRAPHIC CARD */}
        <div
          onClick={() => setModalStage('DOOR')}
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-xl, 20px)',
            background: 'linear-gradient(135deg, #064e3b 0%, #047857 32%, #0f172a 75%, #1e1b4b 100%)',
            border: '1px solid rgba(251, 191, 36, 0.35)',
            padding: '22px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'pulseGoldGlow 4s infinite ease-in-out',
            color: 'white',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* FLOATING ANIMATED MONEY, COINS & SPARKLING REVENUE (Flat Discount Style) */}
          <div
            style={{
              position: 'absolute',
              right: '28%',
              top: '-15%',
              fontSize: '3.6rem',
              opacity: 0.22,
              pointerEvents: 'none',
              animation: 'moneyFloat1 4.2s ease-in-out infinite',
              filter: 'drop-shadow(0 4px 12px rgba(245, 158, 11, 0.4))',
            }}
          >
            💰
          </div>
          <div
            style={{
              position: 'absolute',
              right: '14%',
              bottom: '-12%',
              fontSize: '3.2rem',
              opacity: 0.25,
              pointerEvents: 'none',
              animation: 'moneyFloat2 3.6s ease-in-out infinite',
            }}
          >
            🪙
          </div>
          <div
            style={{
              position: 'absolute',
              left: '46%',
              top: '-18%',
              fontSize: '2.8rem',
              opacity: 0.18,
              pointerEvents: 'none',
              animation: 'moneyFloat3 5s ease-in-out infinite',
            }}
          >
            💸
          </div>
          <div
            style={{
              position: 'absolute',
              left: '32%',
              bottom: '-10%',
              fontSize: '2.4rem',
              opacity: 0.16,
              pointerEvents: 'none',
              animation: 'moneyFloat1 4.8s ease-in-out infinite reverse',
            }}
          >
            ✨
          </div>
          <div
            style={{
              position: 'absolute',
              right: '4%',
              top: '12%',
              fontSize: '2rem',
              opacity: 0.3,
              pointerEvents: 'none',
              animation: 'coinGlint 2.8s ease-in-out infinite',
            }}
          >
            🪙
          </div>

          {/* LEFT CONTENT: BADGE, HEADLINE & PROMISE */}
          <div style={{ position: 'relative', zIndex: 2, flex: '1 1 480px', minWidth: 260 }}>
            {/* Golden Header Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(251, 191, 36, 0.18)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(251, 191, 36, 0.45)',
                color: '#fef08a',
                padding: '3px 12px',
                borderRadius: 'var(--radius-full, 999px)',
                fontSize: '0.72rem',
                fontWeight: 800,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <span>💰 0% ONBOARDING FEE</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>📈 3.4X REVENUE</span>
              <span style={{ opacity: 0.5 }}>•</span>
              <span>🔒 SMART OVERBOOKING SHIELD</span>
            </div>

            {/* Headline */}
            <h2
              style={{
                color: 'white',
                margin: '0 0 6px 0',
                fontSize: '1.45rem',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                lineHeight: 1.25,
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              }}
            >
              Grow Your Hotel Business with <span style={{ color: '#fbbf24' }}>StayBuddy Extranet CRM</span> 🚀
            </h2>

            {/* Subtitle */}
            <p
              style={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.88rem',
                margin: 0,
                lineHeight: 1.45,
                maxWidth: 580,
              }}
            >
              Showcase your rooms to millions of verified travelers, automate 100% of bookings, and enjoy daily bank settlements.
            </p>
          </div>

          {/* RIGHT ACTION BUTTON: DOOR OPENER */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              style={{
                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                color: '#0f172a',
                border: 'none',
                padding: '12px 22px',
                borderRadius: '14px',
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.5), 0 0 12px rgba(251, 191, 36, 0.4)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span>🚪 Open Partner Door</span>
              <span style={{ fontSize: '1.1rem' }}>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* ANIMATION MODAL: 1) SMALL HOUSE DOOR OPENING -> 2) GROWTH CARD -> 3) LAUNCH */}
      {/* ========================================================================= */}
      {modalStage !== 'CLOSED' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(9, 13, 22, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            padding: '16px',
            animation: 'fadeIn 0.25s ease-out forwards',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && modalStage !== 'LAUNCHING') {
              setModalStage('CLOSED');
            }
          }}
        >
          {/* ========================================================= */}
          {/* STAGE 1: 3D SMALL HOUSE DOOR OPENING ANIMATION */}
          {/* ========================================================= */}
          {modalStage === 'DOOR' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                animation: 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              {/* Cute House Facade Top Roof */}
              <div
                style={{
                  width: 320,
                  height: 60,
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-end',
                }}
              >
                {/* Triangular Gable Roof with Terracotta Gradient */}
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '160px solid transparent',
                    borderRight: '160px solid transparent',
                    borderBottom: '55px solid #b45309',
                    position: 'absolute',
                    top: 5,
                    filter: 'drop-shadow(0 -4px 10px rgba(0,0,0,0.4))',
                  }}
                />
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '150px solid transparent',
                    borderRight: '150px solid transparent',
                    borderBottom: '50px solid #d97706',
                    position: 'absolute',
                    top: 8,
                  }}
                />
                {/* Roof Crest Badge */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 5,
                    background: '#064e3b',
                    border: '2px solid #fbbf24',
                    borderRadius: 20,
                    padding: '4px 14px',
                    color: '#fef08a',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    transform: 'translateY(-12px)',
                  }}
                >
                  🏨 STAYBUDDY PARTNER HOUSE
                </div>
              </div>

              {/* House Frame & Wall with Lanterns */}
              <div
                style={{
                  width: 300,
                  background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                  border: '3px solid #78350f',
                  borderRadius: '16px 16px 8px 8px',
                  padding: '24px 20px 20px',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(245, 158, 11, 0.3)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Warm Lantern Lights on Left & Right */}
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: 40,
                    fontSize: '1.4rem',
                    filter: 'drop-shadow(0 0 12px #fde047)',
                    animation: 'coinGlint 2s infinite ease-in-out',
                  }}
                >
                  🏮
                </div>
                <div
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: 40,
                    fontSize: '1.4rem',
                    filter: 'drop-shadow(0 0 12px #fde047)',
                    animation: 'coinGlint 2s infinite ease-in-out',
                  }}
                >
                  🏮
                </div>

                {/* THE 3D DOORWAY FRAME */}
                <div
                  style={{
                    width: 170,
                    height: 220,
                    background: '#040711',
                    borderRadius: '80px 80px 4px 4px',
                    border: '4px solid #b45309',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9), 0 0 25px rgba(251, 191, 36, 0.25)',
                    perspective: 1000,
                  }}
                >
                  {/* Glowing Portal Interior behind doors (revealed as doors swing open) */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'radial-gradient(circle at center, #fef08a 0%, #f59e0b 40%, #064e3b 85%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: doorOpen ? 1 : 0,
                      transition: 'opacity 0.6s ease',
                    }}
                  >
                    {/* Beaming Light Radiation */}
                    <div
                      style={{
                        position: 'absolute',
                        width: 250,
                        height: 250,
                        background: 'radial-gradient(circle, rgba(254, 240, 138, 0.8) 0%, transparent 60%)',
                        animation: doorOpen ? 'doorGlowBurst 1.2s ease-out forwards' : 'none',
                      }}
                    />

                    {/* Flying Money Stream Burst */}
                    {doorOpen && (
                      <>
                        <div style={{ fontSize: '2rem', animation: 'coinsBurstOut 1.2s ease-out infinite' }}>🪙</div>
                        <div style={{ fontSize: '1.8rem', animation: 'coinsBurstOut 1.4s ease-out infinite 0.2s' }}>💸</div>
                        <div style={{ fontSize: '1.6rem', animation: 'coinsBurstOut 1.1s ease-out infinite 0.4s' }}>✨</div>
                      </>
                    )}
                  </div>

                  {/* LEFT DOOR LEAF */}
                  <div
                    style={{
                      width: '50%',
                      height: '100%',
                      background: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
                      borderRight: '1px solid rgba(0,0,0,0.6)',
                      transformOrigin: 'left center',
                      transform: doorOpen ? 'perspective(800px) rotateY(-88deg)' : 'perspective(800px) rotateY(0deg)',
                      transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      paddingRight: 6,
                      boxShadow: 'inset -2px 0 6px rgba(0,0,0,0.4)',
                    }}
                  >
                    {/* Inset Door Panels */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 25,
                        left: 8,
                        right: 8,
                        height: 60,
                        border: '2px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '40px 40px 6px 6px',
                        background: 'rgba(0,0,0,0.15)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 25,
                        left: 8,
                        right: 8,
                        height: 80,
                        border: '2px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,0.15)',
                      }}
                    />
                    {/* Golden Door Handle */}
                    <div
                      style={{
                        width: 8,
                        height: 24,
                        background: 'linear-gradient(180deg, #fef08a, #d97706)',
                        borderRadius: 4,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                        zIndex: 2,
                      }}
                    />
                  </div>

                  {/* RIGHT DOOR LEAF */}
                  <div
                    style={{
                      width: '50%',
                      height: '100%',
                      background: 'linear-gradient(225deg, #78350f 0%, #451a03 100%)',
                      borderLeft: '1px solid rgba(0,0,0,0.6)',
                      transformOrigin: 'right center',
                      transform: doorOpen ? 'perspective(800px) rotateY(88deg)' : 'perspective(800px) rotateY(0deg)',
                      transition: 'transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'flex-start',
                      paddingLeft: 6,
                      boxShadow: 'inset 2px 0 6px rgba(0,0,0,0.4)',
                    }}
                  >
                    {/* Inset Door Panels */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 25,
                        left: 8,
                        right: 8,
                        height: 60,
                        border: '2px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: '40px 40px 6px 6px',
                        background: 'rgba(0,0,0,0.15)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 25,
                        left: 8,
                        right: 8,
                        height: 80,
                        border: '2px solid rgba(251, 191, 36, 0.3)',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,0.15)',
                      }}
                    />
                    {/* Golden Door Handle */}
                    <div
                      style={{
                        width: 8,
                        height: 24,
                        background: 'linear-gradient(180deg, #fef08a, #d97706)',
                        borderRadius: 4,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                        zIndex: 2,
                      }}
                    />
                  </div>
                </div>

                {/* Animated Status Label below the door */}
                <div
                  style={{
                    marginTop: 18,
                    textAlign: 'center',
                    color: '#fef08a',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    letterSpacing: '0.03em',
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  {doorOpen ? '✨ Opening StayBuddy Growth Portal...' : '🚪 Unlocking Partner House...'}
                </div>

                <button
                  type="button"
                  onClick={() => setModalStage('GROWTH_CARD')}
                  style={{
                    marginTop: 10,
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Skip to Growth Card →
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 2: THE BEAUTIFUL STAYBUDDY GROWTH SHOWCASE CARD */}
          {/* ========================================================= */}
          {modalStage === 'GROWTH_CARD' && (
            <div
              style={{
                width: '100%',
                maxWidth: 720,
                background: 'linear-gradient(145deg, #09131e 0%, #064e3b 40%, #0f172a 80%, #1e1b4b 100%)',
                border: '1.5px solid rgba(251, 191, 36, 0.4)',
                borderRadius: '28px',
                boxShadow: '0 25px 70px rgba(0,0,0,0.7), 0 0 50px rgba(245, 158, 11, 0.25)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                animation: 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Floating ambient coins & money particles in modal background */}
              <div
                style={{
                  position: 'absolute',
                  right: -20,
                  top: -20,
                  fontSize: '8rem',
                  opacity: 0.08,
                  pointerEvents: 'none',
                  animation: 'moneyFloat1 5s infinite ease-in-out',
                }}
              >
                💰
              </div>
              <div
                style={{
                  position: 'absolute',
                  left: -20,
                  bottom: -20,
                  fontSize: '7rem',
                  opacity: 0.06,
                  pointerEvents: 'none',
                  animation: 'moneyFloat2 6s infinite ease-in-out',
                }}
              >
                📈
              </div>

              {/* CARD TOP BAR: BADGE & CLOSE BUTTON */}
              <div
                style={{
                  padding: '20px 26px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                    }}
                  >
                    🏨
                  </div>
                  <div>
                    <div style={{ fontSize: '0.96rem', fontWeight: 900, color: '#fef08a', letterSpacing: '-0.01em' }}>
                      StayBuddy Partner Growth Engine
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                      Proven Performance Across 2,400+ Verified Stays
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalStage('CLOSED')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#e2e8f0',
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
                >
                  ✕
                </button>
              </div>

              {/* CARD SCROLLABLE CONTENT: HOW STAYBUDDY GROWS YOUR BUSINESS */}
              <div
                style={{
                  padding: '22px 26px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 18,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Hero Header inside card */}
                <div style={{ textAlign: 'center' }}>
                  <h2
                    style={{
                      fontSize: '1.5rem',
                      fontWeight: 900,
                      margin: '0 0 6px 0',
                      letterSpacing: '-0.02em',
                      color: 'white',
                    }}
                  >
                    How StayBuddy Multiplies Your <span style={{ color: '#fbbf24' }}>Hotel Revenue & Bookings</span>
                  </h2>
                  <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                    Real-time inventory management, 0% onboarding fee, and verified direct customer demand.
                  </p>
                </div>

                {/* 4 INTERACTIVE GROWTH PILLARS (Grid) */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: 12,
                  }}
                >
                  {/* Pillar 1: Occupancy Surge */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      borderRadius: 16,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.3rem' }}>📈</span>
                      <span style={{ background: '#059669', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                        +44% SURGE
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#34d399' }}>
                        52% ➔ 96% Occupancy
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: 4, lineHeight: 1.4 }}>
                        Fills empty weekday and weekend rooms with high-intent verified travelers.
                      </div>
                    </div>
                  </div>

                  {/* Pillar 2: 3.4x Direct Revenue Bump */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid rgba(251, 191, 36, 0.25)',
                      borderRadius: 16,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.3rem' }}>💰</span>
                      <span style={{ background: '#d97706', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                        3.4X MULTIPLIER
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fef08a' }}>
                        ₹1.2L ➔ ₹4.8L+ Monthly
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: 4, lineHeight: 1.4 }}>
                        Keep 100% of your listed room price. 0% commission on direct inventory.
                      </div>
                    </div>
                  </div>

                  {/* Pillar 3: Fast 45-Second Bookings */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: 16,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.3rem' }}>⚡</span>
                      <span style={{ background: '#0284c7', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                        45S CHECKOUT
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#38bdf8' }}>
                        Zero Booking Drops
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: 4, lineHeight: 1.4 }}>
                        Guests confirm in seconds with WhatsApp vouchers & Razorpay payment security.
                      </div>
                    </div>
                  </div>

                  {/* Pillar 4: Smart Overbooking Shield */}
                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      borderRadius: 16,
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '1.3rem' }}>🔒</span>
                      <span style={{ background: '#e11d48', color: 'white', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                        1-CLICK SHIELD
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fb7185' }}>
                        Smart Room Block
                      </div>
                      <div style={{ fontSize: '0.76rem', color: '#cbd5e1', marginTop: 4, lineHeight: 1.4 }}>
                        Lock offline walk-in rooms in 1 click so double bookings never happen.
                      </div>
                    </div>
                  </div>
                </div>

                {/* LIVE HOTEL CASE STUDY TICKER */}
                <div
                  style={{
                    background: 'rgba(6, 78, 59, 0.45)',
                    border: '1px solid rgba(52, 211, 153, 0.35)',
                    borderRadius: 14,
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>🏨</span>
                    <div>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: 'white' }}>
                        Hotel Pushpa Grand (Shamshabad, Hyderabad)
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#86efac' }}>
                        ● 98% Occupancy • Booking Just Received: Deluxe AC (₹2,650)
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: 'rgba(251, 191, 36, 0.2)',
                      border: '1px solid rgba(251, 191, 36, 0.4)',
                      color: '#fef08a',
                      padding: '4px 10px',
                      borderRadius: 10,
                      fontSize: '0.74rem',
                      fontWeight: 800,
                    }}
                  >
                    T+1 Bank Payout Active ⚡
                  </div>
                </div>

                {/* PROMINENT LAUNCH ACTION AREA */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 14,
                    marginTop: 6,
                    paddingTop: 12,
                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                    Instant 1-Click Access for Verified Hoteliers
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Link
                      href={session?.user ? "/partner" : "/partner/login"}
                      onClick={() => setModalStage('CLOSED')}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        color: '#e2e8f0',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        padding: '10px 18px',
                        borderRadius: 12,
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        cursor: 'pointer',
                      }}
                    >
                      List Your Hotel Free →
                    </Link>

                    {/* LAUNCH EXTRANET BUTTON */}
                    <button
                      type="button"
                      onClick={handleLaunchExtranet}
                      style={{
                        background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                        color: '#0f172a',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: 12,
                        fontSize: '0.92rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 6px 20px rgba(245, 158, 11, 0.45), 0 0 16px rgba(251, 191, 36, 0.3)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.04)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <span>🚀 Launch Partner Extranet</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* STAGE 3: LAUNCHING CELEBRATION & CONNECTION ANIMATION */}
          {/* ========================================================= */}
          {modalStage === 'LAUNCHING' && (
            <div
              style={{
                width: '100%',
                maxWidth: 480,
                background: 'linear-gradient(145deg, #09131e 0%, #064e3b 60%, #0f172a 100%)',
                border: '2px solid #fbbf24',
                borderRadius: '24px',
                padding: '36px 28px',
                textAlign: 'center',
                boxShadow: '0 25px 80px rgba(0,0,0,0.85), 0 0 60px rgba(245, 158, 11, 0.4)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
              }}
            >
              {/* Rocket Blasting Off Upwards */}
              <div
                style={{
                  fontSize: '4.5rem',
                  display: 'inline-block',
                  animation: 'rocketFlyUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  filter: 'drop-shadow(0 0 20px #fbbf24)',
                }}
              >
                🚀
              </div>

              {/* Celebratory Money Particles */}
              <div style={{ position: 'absolute', left: 40, top: 40, fontSize: '2rem', animation: 'coinsBurstOut 1s infinite' }}>🪙</div>
              <div style={{ position: 'absolute', right: 40, top: 40, fontSize: '2rem', animation: 'coinsBurstOut 1.1s infinite 0.2s' }}>💸</div>
              <div style={{ position: 'absolute', left: 80, bottom: 40, fontSize: '1.8rem', animation: 'coinsBurstOut 1.3s infinite 0.3s' }}>✨</div>
              <div style={{ position: 'absolute', right: 80, bottom: 40, fontSize: '1.8rem', animation: 'coinsBurstOut 1.2s infinite 0.1s' }}>💰</div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '14px 0 6px', color: '#fef08a' }}>
                Connecting to Partner Extranet...
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', margin: '0 0 20px', lineHeight: 1.4 }}>
                Synchronizing live property inventory, rate plans & instant booking automation.
              </p>

              {/* High-Tech Progress Bar */}
              <div
                style={{
                  width: '100%',
                  height: 8,
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${launchProgress}%`,
                    background: 'linear-gradient(90deg, #34d399, #fbbf24, #ea580c)',
                    transition: 'width 0.4s ease',
                    boxShadow: '0 0 12px rgba(251, 191, 36, 0.6)',
                  }}
                />
              </div>

              <div style={{ marginTop: 14, fontSize: '0.74rem', color: '#34d399', fontWeight: 700 }}>
                ● 100% Secure SSL Bank-Grade Connection Established
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
