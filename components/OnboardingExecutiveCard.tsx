'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import OnboardingTrainingVideoModal from './OnboardingTrainingVideoModal';

interface OnboardingExecutiveCardProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  } | null;
  hotelsCount: number;
  onStartOnboarding: () => void;
  onViewHotels: () => void;
}

export default function OnboardingExecutiveCard({
  user,
  hotelsCount,
  onStartOnboarding,
  onViewHotels
}: OnboardingExecutiveCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isTrainingVideoOpen, setIsTrainingVideoOpen] = useState(false);
  const [hasCompletedTraining, setHasCompletedTraining] = useState(false);

  // Auto-check if user previously minimized or completed training
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedState = sessionStorage.getItem('staybuddy_onboarding_card_minimized');
      if (savedState === 'true') {
        setIsMinimized(true);
      }
      const trained = localStorage.getItem('staybuddy_onboarding_training_completed');
      if (trained === 'true') {
        setHasCompletedTraining(true);
      }
    }
  }, []);

  const handleToggleMinimize = () => {
    setIsMinimized(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('staybuddy_onboarding_card_minimized', String(next));
      }
      return next;
    });
  };

  const handleStartOnboardingClick = () => {
    if (!hasCompletedTraining) {
      // First-time onboarding: Must watch the 4-step video tutorial!
      setIsTrainingVideoOpen(true);
    } else {
      onStartOnboarding();
    }
  };

  const handleFinishTraining = () => {
    setHasCompletedTraining(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('staybuddy_onboarding_training_completed', 'true');
    }
    setIsTrainingVideoOpen(false);
    onStartOnboarding();
  };

  const staffName = user?.name || 'Onboarding Executive';
  const staffEmail = user?.email || 'onboarding@staybuddy.in';

  return (
    <>
      <style>{`
        @keyframes glowingBorderFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        @keyframes cardPopIn {
          0% {
            opacity: 0;
            transform: translateY(-16px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes radarPulseDot {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          }
          70% {
            transform: scale(1.15);
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
          }
        }

        @keyframes lightSweepBeam {
          0% {
            transform: translateX(-150%) skewX(-25deg);
          }
          50%, 100% {
            transform: translateX(250%) skewX(-25deg);
          }
        }

        .onboarding-outer-wrapper {
          position: relative;
          border-radius: 20px;
          padding: 2.5px;
          background: linear-gradient(135deg, #f97316, #a855f7, #3b82f6, #10b981, #f97316);
          background-size: 300% 300%;
          animation: glowingBorderFlow 8s ease infinite;
          box-shadow: 0 12px 36px -8px rgba(249, 115, 22, 0.22), 0 6px 16px -4px rgba(168, 85, 247, 0.18);
          margin-bottom: 24px;
          animation-fill-mode: both;
        }

        .onboarding-inner-card {
          background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
          border-radius: 18px;
          padding: 24px 28px;
          position: relative;
          overflow: hidden;
        }

        .onboarding-light-beam {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 60%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
          pointer-events: none;
          animation: lightSweepBeam 6s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        .onboarding-btn-primary {
          background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
          color: white;
          border: none;
          padding: 12px 22px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 6px 18px -4px rgba(234, 88, 12, 0.45);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .onboarding-btn-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 10px 24px -4px rgba(234, 88, 12, 0.6);
        }

        .onboarding-btn-primary:active {
          transform: translateY(0) scale(0.98);
        }

        .onboarding-btn-secondary {
          background: white;
          color: #334155;
          border: 1px solid #cbd5e1;
          padding: 12px 20px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .onboarding-btn-secondary:hover {
          background: #f8fafc;
          border-color: #94a3b8;
          color: #0f172a;
          transform: translateY(-1px);
        }

        .isolation-rule-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
          border: 1px solid #a7f3d0;
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }

        @media (max-width: 768px) {
          .onboarding-inner-card {
            padding: 18px 16px;
          }
          .onboarding-actions-row {
            flex-direction: column !important;
            align-items: stretch !important;
          }
          .onboarding-btn-primary, .onboarding-btn-secondary {
            justify-content: center;
            width: 100%;
          }
        }
      `}</style>

      {/* When Minimized: Sleek floating top bar */}
      {isMinimized ? (
        <div 
          onClick={handleToggleMinimize}
          style={{
            marginBottom: '20px',
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
            border: '1px solid #fed7aa',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(249, 115, 22, 0.1)',
            transition: 'all 0.2s ease'
          }}
          title="Click to expand Onboarding Executive Portal"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.25rem' }}>🚀</span>
            <div>
              <strong style={{ color: '#9a3412', fontSize: '0.92rem' }}>StayBuddy Hotel Onboarding Active</strong>
              <span style={{ color: '#c2410c', fontSize: '0.85rem', marginLeft: 8 }}>
                Logged in as <b>{staffName}</b> ({staffEmail})
              </span>
            </div>
            <span style={{
              background: '#ecfdf5',
              color: '#059669',
              border: '1px solid #a7f3d0',
              padding: '2px 8px',
              borderRadius: 20,
              fontSize: '0.72rem',
              fontWeight: 700
            }}>
              {hotelsCount} Property{hotelsCount === 1 ? '' : 'ies'} Onboarded
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); setIsTrainingVideoOpen(true); }}
              style={{
                background: '#ffedd5',
                color: '#c2410c',
                border: '1px solid #fed7aa',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}
            >
              <span>🎬</span>
              <span>4-Step Video Tutorial</span>
            </button>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); handleStartOnboardingClick(); }}
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700 }}
            >
              + Onboard Hotel
            </button>
            <span style={{ color: '#9a3412', fontSize: '0.82rem', fontWeight: 700 }}>Expand ▼</span>
          </div>
        </div>
      ) : (
        /* Full Animated Spotlight Onboarding Card */
        <div className="onboarding-outer-wrapper">
          <div className="onboarding-inner-card">
            <div className="onboarding-light-beam" />

            {/* Top Bar: Badge, User Info & Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  padding: '5px 12px',
                  borderRadius: 24,
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase'
                }}>
                  <span style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: '#22c55e',
                    display: 'inline-block',
                    animation: 'radarPulseDot 2s infinite ease-out'
                  }} />
                  StayBuddy Onboarding Specialist Portal
                </div>

                <span style={{
                  background: 'linear-gradient(135deg, #fef3c7, #ffedd5)',
                  color: '#b45309',
                  border: '1px solid #fde68a',
                  padding: '4px 10px',
                  borderRadius: 20,
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}>
                  ✨ Commission-Free B2B Model
                </span>
              </div>

              {/* Minimize action button */}
              <button
                type="button"
                onClick={handleToggleMinimize}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  color: '#64748b',
                  padding: '5px 10px',
                  borderRadius: 8,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                <span>Collapse</span>
                <span>▲</span>
              </button>
            </div>

            {/* Main Content Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                  Welcome back, <span style={{ color: '#ea580c' }}>{staffName}</span>! 👋
                </h2>
                <p style={{ color: '#475569', fontSize: '0.92rem', margin: 0, lineHeight: 1.5 }}>
                  You are authorized to onboard new hotel properties to StayBuddy from your staff account (<b>{staffEmail}</b>). 
                  Properties you onboard appear directly in your dashboard below with real-time B2B inventory tracking.
                </p>
              </div>

              {/* Live Metric Pills */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ flex: '1 1 120px', background: '#fff7ed', border: '1px solid #ffedd5', padding: '12px 16px', borderRadius: 14 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c2410c', textTransform: 'uppercase' }}>Onboarded Hotels</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#9a3412', marginTop: 2 }}>{hotelsCount}</div>
                  <div style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 600 }}>In Extranet CRM</div>
                </div>

                <div style={{ flex: '1 1 120px', background: '#eff6ff', border: '1px solid #dbeafe', padding: '12px 16px', borderRadius: 14 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase' }}>B2B Net Tariff</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#1e40af', marginTop: 2 }}>0%</div>
                  <div style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>Zero Commission</div>
                </div>

                <div style={{ flex: '1 1 120px', background: '#f5f3ff', border: '1px solid #ede9fe', padding: '12px 16px', borderRadius: 14 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6d28d9', textTransform: 'uppercase' }}>Legal Contract</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#5b21b6', marginTop: 2 }}>Auto</div>
                  <div style={{ fontSize: '0.72rem', color: '#7c3aed', fontWeight: 600 }}>Digital Agreement</div>
                </div>
              </div>
            </div>

            {/* STRICT PARTNER ISOLATION CALLOUT (Highlighted Rule Box) */}
            <div className="isolation-rule-box" style={{ marginBottom: 20 }}>
              <div style={{ fontSize: '1.6rem', lineHeight: 1 }}>🔒</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#065f46', fontWeight: 800, fontSize: '0.92rem', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>STRICT PARTNER CREDENTIAL ISOLATION GUARANTEED</span>
                  <span style={{ fontSize: '0.7rem', background: '#d1fae5', color: '#047857', padding: '1px 6px', borderRadius: 10 }}>VERIFIED</span>
                </div>
                <p style={{ color: '#047857', fontSize: '0.84rem', margin: 0, lineHeight: 1.45 }}>
                  When onboarding a hotel, enter the <strong>Hotel Partner's Official Email & Phone Number</strong> in the contact fields. 
                  All customer reservation alerts, WhatsApp vouchers, payout summaries, and Partner Agreements are dispatched <strong>ONLY to the Hotel Partner's email</strong>. 
                  Your onboarding staff email (<b>{staffEmail}</b>) remains 100% private and will never receive hotel guest messages.
                </p>
              </div>
            </div>

            {/* ANIMATED 4-STEP CARTOON TRAINING VIDEO BANNER */}
            <div style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '2px solid #ea580c',
              borderRadius: 16,
              padding: '16px 20px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              boxShadow: '0 8px 24px -4px rgba(234, 88, 12, 0.25)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.8rem',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.45)',
                  flexShrink: 0
                }}>
                  🎬
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <strong style={{ color: '#ffffff', fontSize: '1rem', fontWeight: 800 }}>
                      StayBuddy Onboarding Video Masterclass (4 Steps)
                    </strong>
                    <span style={{
                      background: hasCompletedTraining ? '#16a34a' : '#ea580c',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      textTransform: 'uppercase'
                    }}>
                      {hasCompletedTraining ? '✓ Completed' : 'Required First'}
                    </span>
                    <span style={{ color: '#fed7aa', fontSize: '0.75rem', fontWeight: 700 }}>
                      ⏱️ 2 to 3 Mins Each Step
                    </span>
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.82rem', lineHeight: 1.4 }}>
                    Step 1: Property Name & Extranet • Step 2: Precise Latitude/Longitude GPS • Step 3: Real Photos • Step 4: Single, Double & Triple Pricing
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsTrainingVideoOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 18px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>▶️</span>
                <span>{hasCompletedTraining ? 'Replay 4-Step Training Video' : 'Watch 4-Step Animated Video'}</span>
              </button>
            </div>

            {/* Action Buttons Row */}
            <div className="onboarding-actions-row" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={handleStartOnboardingClick}
                className="onboarding-btn-primary"
              >
                <span>➕</span>
                <span>Onboard New Hotel Property</span>
              </button>

              <button 
                type="button" 
                onClick={onViewHotels}
                className="onboarding-btn-secondary"
              >
                <span>🏨</span>
                <span>Manage Onboarded Hotels ({hotelsCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setIsTrainingVideoOpen(true)}
                className="onboarding-btn-secondary"
              >
                <span>🎬</span>
                <span>Watch Training Tutorial</span>
              </button>

              <Link 
                href="/partner-agreement" 
                target="_blank" 
                className="onboarding-btn-secondary"
                style={{ textDecoration: 'none' }}
              >
                <span>📜</span>
                <span>Partner Agreement Template</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 4-STEP INTERACTIVE ANIMATED TRAINING VIDEO MODAL */}
      <OnboardingTrainingVideoModal
        isOpen={isTrainingVideoOpen}
        onClose={() => setIsTrainingVideoOpen(false)}
        onCompleteAndProceed={handleFinishTraining}
        userEmail={staffEmail}
      />
    </>
  );
}

