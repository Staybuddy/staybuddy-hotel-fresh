'use client';

import React, { useState, useEffect } from 'react';

interface OnboardingTrainingVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteAndProceed: () => void;
  userEmail?: string | null;
}

const STEPS = [
  {
    stepNumber: 1,
    title: 'Extranet Overview & Property Basics',
    duration: '2:30 min',
    icon: '🏨',
    badge: 'Step 1 of 4',
    summary: 'Mastering the Extranet layout, entering the official Hotel Name, star rating, property type, and strictly entering partner contact details.',
    points: [
      'Navigate to Partner Extranet: Clean dashboard designed for zero-commission partner management.',
      'Property Name & Star Rating: Enter the exact trade name as visible on the physical property signage.',
      'Partner Email & Mobile: Enter the Hotel Owner or GM credentials ONLY. Booking alerts & agreements go strictly to the owner.',
      'Property Type: Classify accurately as Hotel, Resort, Boutique Stay, or Homestay for algorithm matchmaking.'
    ],
    demoScene: 'basics'
  },
  {
    stepNumber: 2,
    title: 'Location, Address & Precise GPS Lat/Long',
    duration: '2:45 min',
    icon: '📍',
    badge: 'Step 2 of 4',
    summary: 'Exact physical address tagging, landmark orientation, and capturing high-precision Latitude & Longitude for turn-by-turn guest navigation.',
    points: [
      'Physical Street Address: Include door number, main road, area, landmark, city, state, and 6-digit Pincode.',
      'Latitude & Longitude Tagging: Pinpoint the exact entrance gate on Google Maps (e.g. Lat: 17.4435, Long: 78.3772).',
      'Why Coordinates Matter: Guests tap "Navigate" on StayBuddy app to reach the hotel gate without phone calls.',
      'Landmark Clarity: Add notable nearby transit spots (e.g. "Opposite Metro Pillar 1142, 500m from Railway Station").'
    ],
    demoScene: 'location'
  },
  {
    stepNumber: 3,
    title: 'High-Resolution Real Photos Uploading',
    duration: '2:15 min',
    icon: '📸',
    badge: 'Step 3 of 4',
    summary: 'Guidelines for capturing and uploading authentic, high-converting property photos with the exterior facade as first photo.',
    points: [
      'First Photo Golden Rule: The 1st photo MUST be the wide exterior building facade with property name signage.',
      'Essential Photo Checklist: 1 Exterior Facade + 1 Lobby/Reception + 2 Bedroom Angles + 1 Attached Clean Washroom.',
      'Quality Standards: Always shoot in horizontal/landscape mode during bright daylight. Never upload blurry or watermarked shots.',
      'Bathroom Hygiene Standard: Clean mirror, sanitized toilet seat, fresh towels. Washroom photos increase booking conversion by 42%!'
    ],
    demoScene: 'photos'
  },
  {
    stepNumber: 4,
    title: 'Room Pricing Architecture (Single, Double & Triple) & AI Description',
    duration: '3:00 min',
    icon: '💰',
    badge: 'Step 4 of 4',
    summary: 'Configuring room types, base inventory, occupancy pricing (Single, Double, Triple), meal plans, and generating AI descriptions.',
    points: [
      'Single Occupancy (1 Guest): Discounted base rate for solo business and corporate corporate travelers.',
      'Double Occupancy (2 Guests): Standard base price for couples or two adults sharing one room.',
      'Triple Occupancy (3 Guests): Base rate + extra bed/mattress charge for three adults in one room.',
      'Inventory & Taxes: Set total available rooms. All prices in StayBuddy show net base rates with automated GST breakdown.',
      'StayBuddy AI Writer: Click "Generate Description" to auto-create high-converting promotional room highlights.'
    ],
    demoScene: 'pricing'
  }
];

export default function OnboardingTrainingVideoModal({
  isOpen,
  onClose,
  onCompleteAndProceed,
  userEmail
}: OnboardingTrainingVideoModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progressSec, setProgressSec] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [characterMood, setCharacterMood] = useState<'explaining' | 'happy' | 'pointing'>('explaining');

  const maxSec = 16; // Simulated video loop length for each interactive cartoon chapter

  useEffect(() => {
    if (!isOpen) return;
    setProgressSec(0);
    setIsPlaying(true);
  }, [isOpen, currentStep]);

  useEffect(() => {
    let timer: any = null;
    if (isOpen && isPlaying) {
      timer = setInterval(() => {
        setProgressSec(prev => {
          if (prev >= maxSec) {
            // Step video finished playing
            setCompletedSteps(old => old.includes(currentStep) ? old : [...old, currentStep]);
            return maxSec;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isPlaying, currentStep]);

  useEffect(() => {
    // Dynamic avatar mood switching based on playback phase
    if (progressSec > 12) {
      setCharacterMood('happy');
    } else if (progressSec > 5) {
      setCharacterMood('pointing');
    } else {
      setCharacterMood('explaining');
    }
  }, [progressSec]);

  if (!isOpen) return null;

  const activeStepData = STEPS[currentStep];
  const allCompleted = completedSteps.length >= 4;

  const handleNextStep = () => {
    if (!completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const formatSec = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <style>{`
        @keyframes floatBuddy {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1.5deg); }
        }
        @keyframes handWave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(18deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(234, 88, 12, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(234, 88, 12, 0); }
        }
        @keyframes mapPinBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.1); }
        }
        @keyframes rippleRing {
          0% { transform: scale(0.6); opacity: 1; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes typingSim {
          0% { width: 0; }
          100% { width: 100%; }
        }
        @keyframes photoSlideIn {
          0% { opacity: 0; transform: translateY(14px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes priceCardHighlight {
          0%, 100% { transform: translateY(0); border-color: rgba(234,88,12,0.3); }
          50% { transform: translateY(-4px); border-color: rgba(234,88,12,0.9); }
        }
      `}</style>

      <div style={{
        background: '#ffffff',
        borderRadius: 24,
        maxWidth: 1080,
        width: '100%',
        maxHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
        overflow: 'hidden',
        border: '1px solid #fed7aa',
        position: 'relative'
      }}>

        {/* Modal Top Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #ea580c',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)'
            }}>
              🎬
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  StayBuddy Hotel Onboarding Masterclass
                </h3>
                <span style={{
                  background: '#ea580c',
                  color: 'white',
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 9999,
                  textTransform: 'uppercase'
                }}>
                  Interactive 4-Step Video
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
                Required animated training before onboarding properties • Learn Extranet, GPS Tagging, Photos & Pricing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#ffffff',
              width: 34,
              height: 34,
              borderRadius: '50%',
              fontSize: '1.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            title="Close video"
          >
            ✕
          </button>
        </div>

        {/* 4 Steps Horizontal Progress Bar */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0'
        }}>
          {STEPS.map((step, idx) => {
            const isActive = idx === currentStep;
            const isDone = completedSteps.includes(idx);
            return (
              <button
                key={step.stepNumber}
                onClick={() => setCurrentStep(idx)}
                style={{
                  background: isActive ? '#ffffff' : '#f8fafc',
                  border: 'none',
                  borderBottom: isActive ? '3px solid #ea580c' : '3px solid transparent',
                  padding: '12px 14px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: isDone ? '#16a34a' : (isActive ? '#ea580c' : '#cbd5e1'),
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isDone ? '✓' : step.stepNumber}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: isActive ? '#ea580c' : '#64748b'
                  }}>
                    {step.duration}
                  </div>
                  <div style={{
                    fontSize: '0.82rem',
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? '#0f172a' : '#475569',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {step.title}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Main Body: Video Player & Learning Checklist */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)',
          flex: 1,
          overflowY: 'auto'
        }}>

          {/* LEFT: Animated Cartoon Video Screen Container */}
          <div style={{
            background: '#090d16',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid #1e293b'
          }}>
            
            {/* The Video Screen Frame */}
            <div style={{
              background: '#0f172a',
              borderRadius: 16,
              border: '2px solid #334155',
              overflow: 'hidden',
              position: 'relative',
              aspectRatio: '16/9',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
            }}>

              {/* Video Player Header Overlay */}
              <div style={{
                padding: '10px 14px',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 10,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    background: '#dc2626',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', animation: 'pulseGlow 1.5s infinite' }} />
                    TRAINING VIDEO
                  </span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.78rem', fontWeight: 700 }}>
                    Chapter {activeStepData.stepNumber}: {activeStepData.title}
                  </span>
                </div>

                <span style={{
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(4px)',
                  color: '#f8fafc',
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 10
                }}>
                  {formatSec(progressSec)} / {formatSec(maxSec)}
                </span>
              </div>

              {/* SCENE DISPLAY: Dynamic Animated Cartoon Simulation for Current Step */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px',
                position: 'relative',
                background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)'
              }}>

                {/* Animated Cartoon Character: Captain Buddy 🦊 / 👨‍💼 */}
                <div style={{
                  position: 'absolute',
                  left: 20,
                  bottom: 20,
                  zIndex: 8,
                  animation: 'floatBuddy 4s ease-in-out infinite',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 10
                }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
                    border: '3px solid #ffffff',
                    boxShadow: '0 8px 24px rgba(234, 88, 12, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                    position: 'relative'
                  }}>
                    {characterMood === 'explaining' && '👨‍💼'}
                    {characterMood === 'pointing' && '🦊'}
                    {characterMood === 'happy' && '🎉'}
                    <span style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      background: '#16a34a',
                      color: 'white',
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      padding: '2px 5px',
                      borderRadius: 10,
                      border: '1px solid white'
                    }}>
                      GUIDE
                    </span>
                  </div>

                  {/* Cartoon Speech Bubble */}
                  <div style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    padding: '8px 14px',
                    borderRadius: 14,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    maxWidth: 220,
                    boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
                    position: 'relative',
                    marginBottom: 10
                  }}>
                    {currentStep === 0 && (progressSec < 8 ? 'Hello! Enter the Hotel Name & Star Rating carefully.' : 'Never enter your email! Enter the Hotel Partner\'s email.')}
                    {currentStep === 1 && (progressSec < 8 ? 'Pinpoint the exact main entrance gate coordinates!' : 'Latitude & Longitude ensure turn-by-turn guest arrival.')}
                    {currentStep === 2 && (progressSec < 8 ? 'Rule #1: First photo MUST be the building facade!' : 'Clean bathroom shots boost bookings by over 40%!')}
                    {currentStep === 3 && (progressSec < 8 ? 'Setup Single, Double & Triple Occupancy rates!' : 'Click AI Writer to create irresistible room highlights!')}
                  </div>
                </div>

                {/* ANIMATED UI MOCKUP BASED ON CURRENT STEP */}
                {/* Scene 1: Basics & Extranet */}
                {currentStep === 0 && (
                  <div style={{
                    background: '#ffffff',
                    borderRadius: 12,
                    padding: '14px 18px',
                    width: '75%',
                    marginLeft: '80px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
                    animation: 'photoSlideIn 0.5s ease-out'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                      <span style={{ fontSize: '1rem' }}>🏨</span>
                      <strong style={{ fontSize: '0.85rem', color: '#0f172a' }}>Step 1: Property Details</strong>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.75rem' }}>
                      <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>Hotel Name</div>
                        <div style={{ color: '#0f172a', fontWeight: 700 }}>Hotel Elite Grand & Suites</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#64748b', fontSize: '0.65rem' }}>Star Rating</div>
                        <div style={{ color: '#d97706', fontWeight: 700 }}>⭐⭐⭐⭐ (4-Star)</div>
                      </div>
                      <div style={{ background: '#eff6ff', padding: '6px 8px', borderRadius: 6, border: '1px solid #bfdbfe' }}>
                        <div style={{ color: '#1e40af', fontSize: '0.65rem' }}>Partner Email (Official)</div>
                        <div style={{ color: '#1d4ed8', fontWeight: 700 }}>reservations@hotelelite.com</div>
                      </div>
                      <div style={{ background: '#ecfdf5', padding: '6px 8px', borderRadius: 6, border: '1px solid #a7f3d0' }}>
                        <div style={{ color: '#065f46', fontSize: '0.65rem' }}>Owner Phone</div>
                        <div style={{ color: '#059669', fontWeight: 700 }}>+91 98765 43210</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scene 2: Map & Lat/Long */}
                {currentStep === 1 && (
                  <div style={{
                    background: '#1e293b',
                    borderRadius: 12,
                    padding: '14px 18px',
                    width: '75%',
                    marginLeft: '80px',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.5)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Simulated Map Grid */}
                    <div style={{
                      height: 120,
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      borderRadius: 8,
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #334155'
                    }}>
                      <div style={{
                        position: 'absolute',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: '2px solid #ea580c',
                        animation: 'rippleRing 2s infinite ease-out'
                      }} />
                      <div style={{
                        fontSize: '2rem',
                        animation: 'mapPinBounce 2s infinite ease-in-out',
                        filter: 'drop-shadow(0 4px 10px rgba(234, 88, 12, 0.8))'
                      }}>
                        📍
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: 6,
                        left: 8,
                        background: 'rgba(15,23,42,0.85)',
                        color: '#38bdf8',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.7rem',
                        fontWeight: 700
                      }}>
                        Lat: 17.4435 • Long: 78.3772
                      </div>
                    </div>
                  </div>
                )}

                {/* Scene 3: Photos */}
                {currentStep === 2 && (
                  <div style={{
                    display: 'flex',
                    gap: 8,
                    marginLeft: '80px',
                    animation: 'photoSlideIn 0.5s ease-out'
                  }}>
                    <div style={{
                      width: 110,
                      background: '#1e293b',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '2px solid #ea580c',
                      boxShadow: '0 6px 16px rgba(234, 88, 12, 0.3)'
                    }}>
                      <div style={{ height: 65, background: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200) center/cover' }} />
                      <div style={{ padding: '4px 6px', fontSize: '0.62rem', color: '#ffedd5', background: '#9a3412', fontWeight: 800 }}>
                        #1 Facade (Exterior)
                      </div>
                    </div>
                    <div style={{
                      width: 95,
                      background: '#1e293b',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #334155'
                    }}>
                      <div style={{ height: 65, background: 'url(https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200) center/cover' }} />
                      <div style={{ padding: '4px 6px', fontSize: '0.62rem', color: '#cbd5e1', textAlign: 'center' }}>
                        #2 Bedroom
                      </div>
                    </div>
                    <div style={{
                      width: 95,
                      background: '#1e293b',
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #334155'
                    }}>
                      <div style={{ height: 65, background: 'url(https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200) center/cover' }} />
                      <div style={{ padding: '4px 6px', fontSize: '0.62rem', color: '#cbd5e1', textAlign: 'center' }}>
                        #3 Clean Bath
                      </div>
                    </div>
                  </div>
                )}

                {/* Scene 4: Pricing */}
                {currentStep === 3 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 8,
                    marginLeft: '80px',
                    width: '75%'
                  }}>
                    <div style={{
                      background: '#1e293b',
                      borderRadius: 8,
                      padding: '8px',
                      border: '1px solid #334155',
                      textAlign: 'center',
                      animation: 'priceCardHighlight 3s infinite ease-in-out'
                    }}>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>👤 Single (1 Person)</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0' }}>₹1,299</div>
                      <div style={{ fontSize: '0.6rem', color: '#16a34a', fontWeight: 700 }}>Base Tariff</div>
                    </div>
                    <div style={{
                      background: '#1e293b',
                      borderRadius: 8,
                      padding: '8px',
                      border: '2px solid #ea580c',
                      textAlign: 'center',
                      boxShadow: '0 4px 14px rgba(234,88,12,0.3)',
                      animation: 'priceCardHighlight 3s infinite ease-in-out 1s'
                    }}>
                      <div style={{ fontSize: '0.65rem', color: '#fdba74' }}>👥 Double (2 Persons)</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffedd5', margin: '4px 0' }}>₹1,599</div>
                      <div style={{ fontSize: '0.6rem', color: '#ea580c', fontWeight: 700 }}>Standard Rate</div>
                    </div>
                    <div style={{
                      background: '#1e293b',
                      borderRadius: 8,
                      padding: '8px',
                      border: '1px solid #334155',
                      textAlign: 'center',
                      animation: 'priceCardHighlight 3s infinite ease-in-out 2s'
                    }}>
                      <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>👥+👤 Triple (3 Persons)</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#f8fafc', margin: '4px 0' }}>₹1,999</div>
                      <div style={{ fontSize: '0.6rem', color: '#38bdf8', fontWeight: 700 }}>Extra Mattress</div>
                    </div>
                  </div>
                )}

              </div>

              {/* Video Player Scrubber & Controls */}
              <div style={{
                background: '#090d16',
                padding: '8px 14px',
                borderTop: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: 6
              }}>
                {/* Scrubber Progress Bar */}
                <div 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = clickX / rect.width;
                    setProgressSec(Math.round(pct * maxSec));
                  }}
                  style={{
                    height: 5,
                    background: '#334155',
                    borderRadius: 3,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    height: '100%',
                    width: `${(progressSec / maxSec) * 100}%`,
                    background: 'linear-gradient(90deg, #ea580c, #f97316)',
                    borderRadius: 3,
                    transition: 'width 0.2s linear'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{
                        background: '#ea580c',
                        border: 'none',
                        color: 'white',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isPlaying ? '⏸' : '▶'}
                    </button>
                    <button
                      onClick={() => setProgressSec(0)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      ↺ Replay Step
                    </button>
                  </div>

                  <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>
                    {progressSec >= maxSec ? '✅ Step Video Finished' : '▶ Video Playing'}
                  </div>
                </div>
              </div>
            </div>

            {/* Step Controls (Prev / Next) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                style={{
                  background: currentStep === 0 ? 'transparent' : '#1e293b',
                  color: currentStep === 0 ? '#475569' : '#f8fafc',
                  border: '1px solid #334155',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Previous Step
              </button>

              <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                Step {currentStep + 1} of {STEPS.length}
              </div>

              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={handleNextStep}
                  style={{
                    background: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>Next Step</span>
                  <span>→</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setCompletedSteps([0, 1, 2, 3]);
                  }}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 18px',
                    borderRadius: 8,
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Mark 4 Steps Complete
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Learning Checklist & Guidelines */}
          <div style={{
            background: '#ffffff',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{
                  background: '#ffedd5',
                  color: '#c2410c',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: 9999
                }}>
                  {activeStepData.badge} • {activeStepData.duration}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {completedSteps.length} / 4 Completed
                </span>
              </div>

              <h2 style={{ fontSize: '1.28rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                {activeStepData.icon} {activeStepData.title}
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#475569', margin: '0 0 16px 0', lineHeight: 1.45 }}>
                {activeStepData.summary}
              </p>

              {/* Key Takeaways Checklist */}
              <div style={{
                background: '#f8fafc',
                borderRadius: 14,
                border: '1px solid #e2e8f0',
                padding: '16px',
                marginBottom: 20
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📌 Mandatory Step Checklist:</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {activeStepData.points.map((pt, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.82rem', color: '#334155', lineHeight: 1.4 }}>
                      <span style={{ color: '#16a34a', fontWeight: 800, flexShrink: 0 }}>✓</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Important Privacy/Strict Isolation Callout */}
              {currentStep === 0 && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: '0.78rem',
                  color: '#991b1b',
                  lineHeight: 1.4
                }}>
                  <strong>🔒 Critical Protocol:</strong> Hotel Owner/Partner contact information must be entered for all property notifications. Your staff email ({userEmail || 'staff email'}) remains 100% private.
                </div>
              )}

              {currentStep === 1 && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: '0.78rem',
                  color: '#166534',
                  lineHeight: 1.4
                }}>
                  <strong>📍 Navigation Tip:</strong> Use Google Maps on mobile to drop a pin at the hotel front gate. Copy the two decimal numbers (Latitude & Longitude) and paste them into the coordinate inputs.
                </div>
              )}

              {currentStep === 2 && (
                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: '0.78rem',
                  color: '#9a3412',
                  lineHeight: 1.4
                }}>
                  <strong>📸 Photography Tip:</strong> Always shoot in landscape mode (horizontal). The first photo is automatically used in the B2C App and Spotlight Card!
                </div>
              )}

              {currentStep === 3 && (
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: '0.78rem',
                  color: '#1e40af',
                  lineHeight: 1.4
                }}>
                  <strong>💰 Occupancy Pricing Rule:</strong> Single (1 guest) is lowest rate, Double (2 guests) is standard, Triple (3 guests) includes extra bed.
                </div>
              )}
            </div>

            {/* UNLOCK / COMPLETE ONBOARDING CTA */}
            <div style={{ paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
              <button
                type="button"
                onClick={() => {
                  onCompleteAndProceed();
                }}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  boxShadow: '0 4px 16px rgba(234, 88, 12, 0.4)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span>🚀</span>
                <span>{allCompleted ? 'I Have Completed Training — Start Onboarding Now' : 'Complete 4-Step Video & Start Onboarding'}</span>
              </button>
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.75rem', color: '#64748b' }}>
                You can re-open this training video at any time from your Onboarding Portal.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
