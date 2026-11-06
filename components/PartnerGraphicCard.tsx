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

  // Listen for open-partner-door event and URL hash to open animation modal from footer or links
  useEffect(() => {
    const handleOpenDoor = () => {
      setModalStage('DOOR');
    };
    window.addEventListener('open-partner-door', handleOpenDoor);

    const checkHash = () => {
      if (typeof window !== 'undefined' && (window.location.hash === '#partner-extranet' || window.location.hash === '#partner-door' || window.location.hash === '#partner-login')) {
        setModalStage('DOOR');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);

    return () => {
      window.removeEventListener('open-partner-door', handleOpenDoor);
      window.removeEventListener('hashchange', checkHash);
    };
  }, []);

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
      <section className="container" style={{ marginBottom: '36px' }}>
        <style>{`
          /* CONTINUOUS END-TO-END FLOATING GOLD COIN ANIMATIONS */
          @keyframes coinFlyEndToEnd1 {
            0% {
              left: 104%;
              top: 15%;
              transform: translateY(0) rotate(0deg) scale(0.9);
              opacity: 0;
            }
            6% {
              opacity: 0.9;
            }
            35% {
              top: 42%;
              transform: translateY(-16px) rotate(120deg) scale(1.15);
            }
            65% {
              top: 20%;
              transform: translateY(-8px) rotate(240deg) scale(1.2);
            }
            92% {
              opacity: 0.9;
            }
            100% {
              left: -14%;
              top: 35%;
              transform: translateY(12px) rotate(360deg) scale(0.9);
              opacity: 0;
            }
          }

          @keyframes coinFlyEndToEnd2 {
            0% {
              left: 104%;
              top: 55%;
              transform: translateY(0) rotate(0deg) scale(0.8);
              opacity: 0;
            }
            7% {
              opacity: 0.85;
            }
            35% {
              top: 25%;
              transform: translateY(-18px) rotate(-140deg) scale(1.1);
            }
            70% {
              top: 60%;
              transform: translateY(8px) rotate(-260deg) scale(1.15);
            }
            92% {
              opacity: 0.85;
            }
            100% {
              left: -14%;
              top: 40%;
              transform: translateY(-6px) rotate(-360deg) scale(0.8);
              opacity: 0;
            }
          }

          @keyframes coinFlyEndToEnd3 {
            0% {
              left: 104%;
              top: 72%;
              transform: translateY(0) rotate(0deg) scale(1);
              opacity: 0;
            }
            6% {
              opacity: 0.95;
            }
            40% {
              top: 42%;
              transform: translateY(-16px) rotate(160deg) scale(1.25);
            }
            75% {
              top: 65%;
              transform: translateY(-4px) rotate(280deg) scale(1.1);
            }
            90% {
              opacity: 0.95;
            }
            100% {
              left: -14%;
              top: 48%;
              transform: translateY(10px) rotate(400deg) scale(1);
              opacity: 0;
            }
          }

          @keyframes coinFlyEndToEnd4 {
            0% {
              left: 104%;
              top: 28%;
              transform: translateY(0) rotate(0deg) scale(0.75);
              opacity: 0;
            }
            6% {
              opacity: 0.8;
            }
            48% {
              top: 62%;
              transform: translateY(-14px) rotate(190deg) scale(1.12);
            }
            92% {
              opacity: 0.8;
            }
            100% {
              left: -14%;
              top: 18%;
              transform: translateY(6px) rotate(360deg) scale(0.75);
              opacity: 0;
            }
          }

          @keyframes pulseBrandGlow {
            0%, 100% { box-shadow: 0 14px 38px -10px rgba(234, 88, 12, 0.45), 0 0 30px rgba(249, 115, 22, 0.25); }
            50% { box-shadow: 0 18px 46px -8px rgba(234, 88, 12, 0.65), 0 0 45px rgba(255, 120, 68, 0.45); }
          }

          /* Individual Animated Letters for "Partner Extranet" */
          @keyframes partnerLetterWave {
            0%, 100% {
              transform: translateY(0px) scale(1);
              color: #ffffff;
              text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
            }
            25% {
              transform: translateY(-7px) scale(1.15);
              color: #fffbeb;
              text-shadow: 0 0 16px rgba(255, 255, 255, 0.95), 0 0 28px rgba(254, 240, 138, 0.85), 0 3px 8px rgba(0,0,0,0.25);
            }
            50% {
              transform: translateY(-2px) scale(1.05);
              color: #fef08a;
              text-shadow: 0 0 14px rgba(254, 240, 138, 0.85);
            }
            75% {
              transform: translateY(0px) scale(1);
              color: #ffffff;
            }
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

        {/* SHORT, VIBRANT STAYBUDDY ORANGE THEME PARTNER CARD */}
        <div
          id="partner-extranet-card"
          onClick={() => setModalStage('DOOR')}
          style={{
            position: 'relative',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #ff6b35 0%, #f97316 45%, #ea580c 100%)',
            border: '1.5px solid rgba(255, 255, 255, 0.4)',
            padding: '24px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 22,
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            animation: 'pulseBrandGlow 4s infinite ease-in-out',
            color: 'white',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          {/* CONTINUOUS END-TO-END FLOATING GOLD COINS STREAM (SYNCED ON MOBILE & DESKTOP) */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 1 }}>
            {/* Ambient luxury glow orbs */}
            <div
              style={{
                position: 'absolute',
                top: '-25%',
                right: '15%',
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.22) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-25%',
                left: '20%',
                width: 240,
                height: 240,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(254, 240, 138, 0.22) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            {/* Coins drifting continuously across the card - with staggered negative delays so always in-flight */}
            <div
              style={{
                position: 'absolute',
                fontSize: '2.8rem',
                filter: 'drop-shadow(0 4px 10px rgba(245, 158, 11, 0.7)) drop-shadow(0 0 16px rgba(251, 191, 36, 0.5))',
                animation: 'coinFlyEndToEnd1 9s linear infinite',
                animationDelay: '-2s',
                pointerEvents: 'none',
              }}
            >
              🪙
            </div>
            <div
              style={{
                position: 'absolute',
                fontSize: '2.3rem',
                filter: 'drop-shadow(0 4px 10px rgba(245, 158, 11, 0.65))',
                animation: 'coinFlyEndToEnd2 11s linear infinite',
                animationDelay: '-5s',
                pointerEvents: 'none',
              }}
            >
              🪙
            </div>
            <div
              style={{
                position: 'absolute',
                fontSize: '3.2rem',
                filter: 'drop-shadow(0 4px 12px rgba(245, 158, 11, 0.75))',
                animation: 'coinFlyEndToEnd3 10s linear infinite',
                animationDelay: '-8s',
                pointerEvents: 'none',
              }}
            >
              🪙
            </div>
            <div
              style={{
                position: 'absolute',
                fontSize: '2.1rem',
                filter: 'drop-shadow(0 4px 8px rgba(245, 158, 11, 0.6))',
                animation: 'coinFlyEndToEnd4 8.5s linear infinite',
                animationDelay: '-1s',
                pointerEvents: 'none',
              }}
            >
              🪙
            </div>
            <div
              style={{
                position: 'absolute',
                fontSize: '2.6rem',
                filter: 'drop-shadow(0 4px 10px rgba(245, 158, 11, 0.7))',
                animation: 'coinFlyEndToEnd1 12s linear infinite',
                animationDelay: '-6.5s',
                pointerEvents: 'none',
              }}
            >
              🪙
            </div>
            <div
              style={{
                position: 'absolute',
                fontSize: '2.4rem',
                filter: 'drop-shadow(0 4px 10px rgba(245, 158, 11, 0.65))',
                animation: 'coinFlyEndToEnd2 9.5s linear infinite',
                animationDelay: '-3.2s',
                pointerEvents: 'none',
              }}
            >
              🪙
            </div>
            <div
              style={{
                position: 'absolute',
                fontSize: '2.4rem',
                opacity: 0.85,
                filter: 'drop-shadow(0 4px 12px rgba(245, 158, 11, 0.5))',
                animation: 'coinFlyEndToEnd3 11.5s linear infinite',
                animationDelay: '-4.8s',
                pointerEvents: 'none',
              }}
            >
              💰
            </div>
            <div
              style={{
                position: 'absolute',
                fontSize: '2.2rem',
                opacity: 0.85,
                filter: 'drop-shadow(0 4px 10px rgba(249, 115, 22, 0.5))',
                animation: 'coinFlyEndToEnd4 10.5s linear infinite',
                animationDelay: '-7.4s',
                pointerEvents: 'none',
              }}
            >
              ✨
            </div>
          </div>

          {/* LEFT CONTENT: ONLY ANIMATED "PARTNER EXTRANET" LETTERS BESIDE THE DOOR */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 13,
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                flexShrink: 0,
              }}
            >
              🏨
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                userSelect: 'none',
              }}
            >
              {"Partner Extranet".split("").map((char, idx) => (
                <span
                  key={idx}
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'pre',
                    fontSize: 'clamp(1.45rem, 3.2vw, 2.1rem)',
                    fontWeight: 900,
                    letterSpacing: char === ' ' ? '0.35em' : '0.01em',
                    animation: 'partnerLetterWave 2.4s ease-in-out infinite',
                    animationDelay: `${idx * 0.09}s`,
                    lineHeight: 1,
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>

          {/* RIGHT ACTION BUTTON: DOOR OPENER */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              style={{
                background: '#ffffff',
                color: '#ea580c',
                border: 'none',
                padding: '13px 26px',
                borderRadius: '14px',
                fontWeight: 900,
                fontSize: '0.94rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15), 0 0 16px rgba(255, 255, 255, 0.35)',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.background = '#fff7ed';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = '#ffffff';
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
            background: 'rgba(9, 13, 22, 0.88)',
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
                {/* Triangular Gable Roof with Terracotta StayBuddy Accent */}
                <div
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '160px solid transparent',
                    borderRight: '160px solid transparent',
                    borderBottom: '55px solid #9a3412',
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
                    borderBottom: '50px solid #ea580c',
                    position: 'absolute',
                    top: 8,
                  }}
                />
                {/* Roof Crest Badge */}
                <div
                  style={{
                    position: 'relative',
                    zIndex: 5,
                    background: '#0f172a',
                    border: '2px solid #f97316',
                    borderRadius: 20,
                    padding: '4px 14px',
                    color: '#ffedd5',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    transform: 'translateY(-12px)',
                  }}
                >
                  🏨 STAYBUDDY PARTNER HOUSE
                </div>
              </div>

              {/* House Frame & Wall with Warm Hotel Entryway */}
              <div
                style={{
                  width: 300,
                  background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
                  border: '2px solid rgba(249, 115, 22, 0.4)',
                  borderRadius: '16px 16px 8px 8px',
                  padding: '24px 20px 20px',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(249, 115, 22, 0.25)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                {/* Warm Entryway Lanterns */}
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: 40,
                    fontSize: '1.4rem',
                    filter: 'drop-shadow(0 0 12px #fdba74)',
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
                    filter: 'drop-shadow(0 0 12px #fdba74)',
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
                    border: '3px solid #ea580c',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    boxShadow: 'inset 0 0 30px rgba(0,0,0,0.95), 0 0 25px rgba(249, 115, 22, 0.35)',
                    perspective: 1000,
                  }}
                >
                  {/* Glowing Portal Interior behind doors */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'radial-gradient(circle at center, #ffedd5 0%, #f97316 45%, #0f172a 90%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      opacity: doorOpen ? 1 : 0,
                      transition: 'opacity 0.6s ease',
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        width: 250,
                        height: 250,
                        background: 'radial-gradient(circle, rgba(254, 215, 170, 0.8) 0%, transparent 60%)',
                        animation: doorOpen ? 'doorGlowBurst 1.2s ease-out forwards' : 'none',
                      }}
                    />

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
                      background: 'linear-gradient(135deg, #7c2d12 0%, #431407 100%)',
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
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 25,
                        left: 8,
                        right: 8,
                        height: 60,
                        border: '2px solid rgba(249, 115, 22, 0.35)',
                        borderRadius: '40px 40px 6px 6px',
                        background: 'rgba(0,0,0,0.2)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 25,
                        left: 8,
                        right: 8,
                        height: 80,
                        border: '2px solid rgba(249, 115, 22, 0.35)',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,0.2)',
                      }}
                    />
                    <div
                      style={{
                        width: 8,
                        height: 24,
                        background: 'linear-gradient(180deg, #fed7aa, #ea580c)',
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
                      background: 'linear-gradient(225deg, #7c2d12 0%, #431407 100%)',
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
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 25,
                        left: 8,
                        right: 8,
                        height: 60,
                        border: '2px solid rgba(249, 115, 22, 0.35)',
                        borderRadius: '40px 40px 6px 6px',
                        background: 'rgba(0,0,0,0.2)',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 25,
                        left: 8,
                        right: 8,
                        height: 80,
                        border: '2px solid rgba(249, 115, 22, 0.35)',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,0.2)',
                      }}
                    />
                    <div
                      style={{
                        width: 8,
                        height: 24,
                        background: 'linear-gradient(180deg, #fed7aa, #ea580c)',
                        borderRadius: 4,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                        zIndex: 2,
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    marginTop: 18,
                    textAlign: 'center',
                    color: '#fed7aa',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    letterSpacing: '0.03em',
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
          {/* STAGE 2: PROFESSIONAL STAYBUDDY OTA PARTNER GROWTH CARD   */}
          {/* ========================================================= */}
          {modalStage === 'GROWTH_CARD' && (
            <div
              style={{
                width: '100%',
                maxWidth: 760,
                background: '#ffffff',
                border: '1.5px solid rgba(249, 115, 22, 0.35)',
                borderRadius: '26px',
                boxShadow: '0 25px 80px -10px rgba(15, 23, 42, 0.22), 0 0 50px rgba(249, 115, 22, 0.12)',
                color: '#0f172a',
                position: 'relative',
                overflow: 'hidden',
                animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                maxHeight: '92vh',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Subtle ambient blooms on white */}
              <div
                style={{
                  position: 'absolute',
                  top: '-15%',
                  right: '-10%',
                  width: 320,
                  height: 320,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(249, 115, 22, 0.08) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: '-15%',
                  left: '-10%',
                  width: 300,
                  height: 300,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(251, 191, 36, 0.08) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />

              {/* CARD TOP BAR: STAYBUDDY BRANDING & CLOSE BUTTON */}
              <div
                style={{
                  padding: '20px 28px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #f1f5f9',
                  background: 'rgba(255, 255, 255, 0.95)',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #ff7844 0%, #ea580c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.3rem',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                    }}
                  >
                    🏨
                  </div>
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.01em', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>StayBuddy Partner Extranet OS</span>
                      <span style={{ fontSize: '0.68rem', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', padding: '2px 8px', borderRadius: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                        ● Live OTA Network
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 2 }}>
                      Enterprise Hospitality Distribution & Revenue Engine
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalStage('CLOSED')}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e2e8f0';
                    e.currentTarget.style.color = '#0f172a';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9';
                    e.currentTarget.style.color = '#475569';
                  }}
                >
                  ✕
                </button>
              </div>

              {/* CARD SCROLLABLE CONTENT */}
              <div
                style={{
                  padding: '24px 28px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 20,
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                {/* Hero Header inside card */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      display: 'inline-block',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: '#ea580c',
                      background: '#fff7ed',
                      border: '1px solid #ffedd5',
                      padding: '3px 10px',
                      borderRadius: 12,
                      marginBottom: 8,
                    }}
                  >
                    REVENUE ACCELERATION PLATFORM
                  </div>
                  <h2
                    style={{
                      fontSize: '1.65rem',
                      fontWeight: 900,
                      margin: '0 0 6px 0',
                      letterSpacing: '-0.02em',
                      color: '#0f172a',
                      lineHeight: 1.25,
                    }}
                  >
                    How StayBuddy Multiplies Your <span style={{ color: '#ea580c' }}>Hotel Bookings & Revenue</span>
                  </h2>
                  <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0, lineHeight: 1.5, maxWidth: 580, marginLeft: 'auto', marginRight: 'auto' }}>
                    Seamless 1-click room inventory distribution, 0% commission on direct bookings, and verified traveler demand.
                  </p>
                </div>

                {/* 4 PROFESSIONAL OTA METRIC CARDS */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: 14,
                  }}
                >
                  {/* Metric 1: Occupancy Growth */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%)',
                      border: '1.5px solid #bbf7d0',
                      borderRadius: 18,
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 18px rgba(16, 185, 129, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.25rem' }}>📈</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Direct Occupancy Surge</span>
                      </div>
                      <span style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                        +44% SURGE
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        52% ➔ <span style={{ color: '#16a34a' }}>96% Occupancy</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4, lineHeight: 1.45 }}>
                        Fills empty weekday and peak weekend rooms with verified corporate and leisure travelers.
                      </div>
                    </div>
                  </div>

                  {/* Metric 2: Revenue Multiplier */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)',
                      border: '1.5px solid #fed7aa',
                      borderRadius: 18,
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 18px rgba(249, 115, 22, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.25rem' }}>💰</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Direct Revenue Growth</span>
                      </div>
                      <span style={{ background: '#ffedd5', color: '#c2410c', border: '1px solid #fdba74', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                        3.4X MULTIPLIER
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        ₹1.2L ➔ <span style={{ color: '#ea580c' }}>₹4.8L+ Monthly</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4, lineHeight: 1.45 }}>
                        Keep 100% of your listed room rates with 0% onboarding fee and daily T+1 direct bank deposits.
                      </div>
                    </div>
                  </div>

                  {/* Metric 3: Frictionless Booking Engine */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)',
                      border: '1.5px solid #bae6fd',
                      borderRadius: 18,
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 18px rgba(14, 165, 233, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.25rem' }}>⚡</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Frictionless Checkout</span>
                      </div>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', border: '1px solid #7dd3fc', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                        45S CHECKOUT
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        Zero Booking Drops
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4, lineHeight: 1.45 }}>
                        Instant WhatsApp vouchers & SMS confirmations backed by bank-grade Razorpay payment security.
                      </div>
                    </div>
                  </div>

                  {/* Metric 4: Smart Walk-In Shield */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #fff1f2 100%)',
                      border: '1.5px solid #fecdd3',
                      borderRadius: 18,
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all 0.2s ease',
                      boxShadow: '0 4px 18px rgba(244, 63, 94, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '1.25rem' }}>🔒</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>Smart Inventory Shield</span>
                      </div>
                      <span style={{ background: '#ffe4e6', color: '#be123c', border: '1px solid #fda4af', fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 20 }}>
                        1-CLICK SHIELD
                      </span>
                    </div>
                    <div>
                      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
                        Zero Overbookings
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: 4, lineHeight: 1.45 }}>
                        Instantly lock walk-in rooms during offline peak rush so double bookings never occur.
                      </div>
                    </div>
                  </div>
                </div>

                {/* VERIFIED LIVE PARTNER BENCHMARK TICKER */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #fff7ed 0%, #f8fafc 100%)',
                    border: '1.5px solid #fed7aa',
                    borderRadius: 16,
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 14,
                    flexWrap: 'wrap',
                    boxShadow: '0 4px 16px rgba(249, 115, 22, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: 'linear-gradient(135deg, #f97316, #c2410c)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        flexShrink: 0,
                        boxShadow: '0 4px 10px rgba(234, 88, 12, 0.25)',
                      }}
                    >
                      🏨
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>
                        Hotel Pushpa Grand <span style={{ color: '#64748b', fontWeight: 500, fontSize: '0.8rem' }}>(Shamshabad, Hyderabad)</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, marginTop: 2 }}>
                        ● 98% Occupancy • Booking Just Received: Deluxe AC Room (₹2,650)
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#ffedd5',
                      border: '1px solid #fdba74',
                      color: '#c2410c',
                      padding: '5px 12px',
                      borderRadius: 10,
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>⚡ Daily T+1 Settlement Active</span>
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
                    marginTop: 4,
                    paddingTop: 16,
                    borderTop: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>
                    100% Encrypted & Authenticated Partner Access
                  </div>

                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Link
                      href={session?.user ? "/partner" : "/partner/login"}
                      onClick={() => setModalStage('CLOSED')}
                      style={{
                        background: '#f8fafc',
                        color: '#0f172a',
                        border: '1.5px solid #cbd5e1',
                        padding: '12px 20px',
                        borderRadius: 14,
                        fontSize: '0.88rem',
                        fontWeight: 700,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f1f5f9')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = '#f8fafc')}
                    >
                      List Your Hotel Free →
                    </Link>

                    {/* LAUNCH EXTRANET BUTTON */}
                    <button
                      type="button"
                      onClick={handleLaunchExtranet}
                      style={{
                        background: 'linear-gradient(135deg, #ff7844 0%, #ea580c 50%, #c2410c 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '12px 26px',
                        borderRadius: 14,
                        fontSize: '0.94rem',
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        boxShadow: '0 8px 24px rgba(234, 88, 12, 0.45)',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.04)';
                        e.currentTarget.style.boxShadow = '0 10px 28px rgba(234, 88, 12, 0.6)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(234, 88, 12, 0.45)';
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
                background: 'linear-gradient(145deg, #090d16 0%, #0f172a 60%, #1e1b4b 100%)',
                border: '2px solid #f97316',
                borderRadius: '24px',
                padding: '36px 28px',
                textAlign: 'center',
                boxShadow: '0 25px 80px rgba(0,0,0,0.85), 0 0 60px rgba(249, 115, 22, 0.35)',
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
                  filter: 'drop-shadow(0 0 20px #f97316)',
                }}
              >
                🚀
              </div>

              {/* Celebratory Money Particles */}
              <div style={{ position: 'absolute', left: 40, top: 40, fontSize: '2rem', animation: 'coinsBurstOut 1s infinite' }}>🪙</div>
              <div style={{ position: 'absolute', right: 40, top: 40, fontSize: '2rem', animation: 'coinsBurstOut 1.1s infinite 0.2s' }}>💸</div>
              <div style={{ position: 'absolute', left: 80, bottom: 40, fontSize: '1.8rem', animation: 'coinsBurstOut 1.3s infinite 0.3s' }}>✨</div>
              <div style={{ position: 'absolute', right: 80, bottom: 40, fontSize: '1.8rem', animation: 'coinsBurstOut 1.2s infinite 0.1s' }}>💰</div>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: '14px 0 6px', color: '#ffedd5' }}>
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
                    background: 'linear-gradient(90deg, #34d399, #f97316, #ea580c)',
                    transition: 'width 0.4s ease',
                    boxShadow: '0 0 12px rgba(249, 115, 22, 0.6)',
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
