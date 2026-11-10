'use client';

import React, { useState, useEffect, useRef } from 'react';

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
    shortTitle: '1. Basics',
    duration: '2:30 min',
    icon: '🏨',
    badge: 'Step 1 of 4',
    voiceText: 'Welcome to StayBuddy Hotel Onboarding. Step 1: Extranet Overview and Property Basics. Always enter the hotel\'s official trade name and star rating. Most importantly, enter the hotel owner or general manager\'s official email and mobile phone number. All customer bookings, payments, and legal agreements go strictly to the owner, keeping your staff account completely private.',
    summary: 'Mastering the Extranet layout, entering the official Hotel Name, star rating, property type, and strictly entering partner contact details.',
    points: [
      'Official Property Trade Name: Enter the exact name displayed on the physical hotel building signage.',
      'Partner Contact Isolation: Enter the HOTEL OWNER or GM credentials ONLY. Booking alerts & legal contracts go strictly to the partner.',
      'Staff Privacy: Your staff email never receives hotel guest messages or partner agreements.',
      'Property Category: Classify accurately as Hotel, Boutique Stay, Resort, or Homestay for search discovery.'
    ]
  },
  {
    stepNumber: 2,
    title: 'Location, Address & GPS Lat/Long',
    shortTitle: '2. GPS Map',
    duration: '2:45 min',
    icon: '📍',
    badge: 'Step 2 of 4',
    voiceText: 'Step 2: Location and Precise GPS Tagging. Enter the physical street address, landmark, and pincode. Make sure to capture the exact Latitude and Longitude coordinates of the hotel entrance gate so guests can navigate directly to the door without phone calls.',
    summary: 'Exact physical address tagging, landmark orientation, and capturing high-precision Latitude & Longitude for turn-by-turn guest navigation.',
    points: [
      'Physical Street Address: Include door number, main road, area, landmark, city, state, and 6-digit Pincode.',
      'Latitude & Longitude Tagging: Pinpoint the exact entrance gate on Google Maps (e.g. Lat: 17.4435, Long: 78.3772).',
      'Why Coordinates Matter: Guests tap "Navigate" on StayBuddy app to reach the hotel gate without calling reception.',
      'Landmark Orientation: Add notable nearby transit spots (e.g. "Opposite Metro Pillar 1142, 500m from Railway Station").'
    ]
  },
  {
    stepNumber: 3,
    title: 'High-Resolution Real Photos Uploading',
    shortTitle: '3. Photos',
    duration: '2:15 min',
    icon: '📸',
    badge: 'Step 3 of 4',
    voiceText: 'Step 3: High-Resolution Real Photos. The very first photo must be the wide exterior building facade with property name signage. Capture bright daylight landscape photos of the reception, bedrooms, and spotless clean washrooms.',
    summary: 'Guidelines for capturing and uploading authentic, high-converting property photos with the exterior facade as first photo.',
    points: [
      'First Photo Golden Rule: The 1st photo MUST be the wide exterior building facade with property name signage.',
      'Essential Photo Checklist: 1 Exterior Facade + 1 Lobby/Reception + 2 Bedroom Angles + 1 Attached Clean Washroom.',
      'Quality Standards: Always shoot in horizontal/landscape mode during bright daylight. Never upload blurry or watermarked shots.',
      'Washroom Hygiene: Clean mirror, sanitized toilet seat, fresh towels. Clean washroom photos boost bookings by over 40%!'
    ]
  },
  {
    stepNumber: 4,
    title: 'Room Pricing (Single, Double, Triple) & AI Description',
    shortTitle: '4. Pricing & AI',
    duration: '3:00 min',
    icon: '💰',
    badge: 'Step 4 of 4',
    voiceText: 'Step 4: Room Pricing and AI Descriptions. Configure your base inventory and set Single Occupancy for solo business travelers, Double Occupancy for couples, and Triple Occupancy with extra bed charges. Then tap AI Description to generate high-converting room highlights.',
    summary: 'Configuring room types, base inventory, occupancy pricing (Single, Double, Triple), meal plans, and generating AI descriptions.',
    points: [
      'Single Occupancy (1 Guest): Discounted base rate for solo business and corporate travelers.',
      'Double Occupancy (2 Guests): Standard base price for couples or two adults sharing one room.',
      'Triple Occupancy (3 Guests): Base rate + extra bed/mattress charge for three adults in one room.',
      'StayBuddy AI Writer: Click "Generate Description" to auto-create high-converting promotional room highlights.'
    ]
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
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const maxSec = 14; // Simulated video duration for auto-play per step
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Stop speech when modal closes
  useEffect(() => {
    if (!isOpen && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isOpen]);

  // Voice narration function
  const speakText = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop any previous utterance

    if (!isVoiceEnabled) {
      setIsSpeaking(false);
      return;
    }

    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.lang = 'en-US';

      // Pick a natural english voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.lang.startsWith('en')));
      if (preferredVoice) utterance.voice = preferredVoice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (_) {
      setIsSpeaking(false);
    }
  };

  // Play voice when step changes or video starts
  useEffect(() => {
    if (!isOpen) return;
    setProgressSec(0);
    setIsPlaying(true);

    if (isVoiceEnabled) {
      // Small timeout to allow browser voice synthesis initialization
      const voiceTimer = setTimeout(() => {
        speakText(STEPS[currentStep].voiceText);
      }, 400);
      return () => clearTimeout(voiceTimer);
    }
  }, [isOpen, currentStep, isVoiceEnabled]);

  // Auto-play timer and AUTO-ADVANCE to next step when finished
  useEffect(() => {
    let timer: any = null;
    if (isOpen && isPlaying) {
      timer = setInterval(() => {
        setProgressSec(prev => {
          if (prev >= maxSec) {
            // Mark current step as completed
            setCompletedSteps(old => old.includes(currentStep) ? old : [...old, currentStep]);

            // AUTO ADVANCE TO NEXT STEP ONE BY ONE!
            if (currentStep < STEPS.length - 1) {
              setCurrentStep(curr => curr + 1);
              return 0;
            } else {
              // Final step reached
              setCompletedSteps([0, 1, 2, 3]);
              return maxSec;
            }
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isOpen, isPlaying, currentStep]);

  if (!isOpen) return null;

  const activeStepData = STEPS[currentStep];
  const allCompleted = completedSteps.length >= 4;

  const togglePlayPause = () => {
    setIsPlaying(prev => {
      const next = !prev;
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (!next) {
          // Pause speech
          try {
            window.speechSynthesis.pause();
          } catch (_) {
            window.speechSynthesis.cancel();
          }
          setIsSpeaking(false);
        } else {
          // Resume speech
          try {
            if (window.speechSynthesis.paused) {
              window.speechSynthesis.resume();
              setIsSpeaking(true);
            } else if (isVoiceEnabled) {
              speakText(activeStepData.voiceText);
            }
          } catch (_) {
            if (isVoiceEnabled) speakText(activeStepData.voiceText);
          }
        }
      }
      return next;
    });
  };

  const toggleVoice = () => {
    if (isVoiceEnabled) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setIsVoiceEnabled(false);
    } else {
      setIsVoiceEnabled(true);
      speakText(activeStepData.voiceText);
    }
  };

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
    <div className="onboarding-modal-overlay">
      <style>{`
        .onboarding-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 99999;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(8px);
          display: flex;
          alignItems: center;
          justify-content: center;
          padding: 16px;
          overflow-y: auto;
          -webkit-tap-highlight-color: transparent;
        }

        .onboarding-modal-dialog {
          background: #ffffff;
          border-radius: 20px;
          max-width: 1040px;
          width: 100%;
          max-height: 94vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.5);
          overflow: hidden;
          border: 1px solid #fed7aa;
          position: relative;
        }

        .modal-body-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.35fr) minmax(300px, 1fr);
          flex: 1;
          overflow-y: auto;
        }

        .step-tabs-strip {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          width: 100%;
        }

        @media (max-width: 768px) {
          .onboarding-modal-overlay {
            padding: 0 !important;
            align-items: flex-start !important;
          }
          .onboarding-modal-dialog {
            border-radius: 0 !important;
            max-height: 100vh !important;
            height: 100vh !important;
            border: none !important;
          }
          .modal-body-layout {
            display: flex !important;
            flex-direction: column !important;
            overflow-y: auto !important;
          }
          .modal-header-responsive {
            padding: 12px 14px !important;
          }
          .step-tabs-strip button {
            padding: 8px 4px !important;
            gap: 4px !important;
            justify-content: center !important;
            text-align: center !important;
          }
          .step-tab-text-full {
            display: none !important;
          }
          .step-tab-text-mobile {
            display: block !important;
            font-size: 0.68rem !important;
            font-weight: 700 !important;
          }
          .video-stage-padding {
            padding: 12px !important;
          }
          .checklist-padding {
            padding: 14px !important;
          }
        }

        @keyframes floatBuddy {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(1.5deg); }
        }
        @keyframes soundWave {
          0%, 100% { height: 6px; }
          50% { height: 16px; }
        }
        @keyframes mapPinBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.1); }
        }
        @keyframes radarRipple {
          0% { transform: scale(0.6); opacity: 0.9; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes sceneFadeIn {
          0% { opacity: 0; transform: scale(0.96); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="onboarding-modal-dialog">

        {/* Modal Top Header */}
        <div className="modal-header-responsive" style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid #ea580c',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              boxShadow: '0 4px 10px rgba(234, 88, 12, 0.4)',
              flexShrink: 0
            }}>
              🎬
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Onboarding Video Masterclass
                </h3>
                <span style={{
                  background: '#ea580c',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: 9999,
                  textTransform: 'uppercase'
                }}>
                  4 Steps • Voice-Over
                </span>
              </div>
              <p style={{ margin: '1px 0 0 0', fontSize: '0.74rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Automated 4-Step Training with Voiceover & Real Extranet Simulation
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Real Voiceover Audio Toggle */}
            <button
              onClick={toggleVoice}
              style={{
                background: isVoiceEnabled ? '#ea580c' : 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: 'white',
                padding: '5px 10px',
                borderRadius: 20,
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s'
              }}
              title={isVoiceEnabled ? 'Voiceover Active — Click to Mute' : 'Click to Enable Voiceover'}
            >
              <span>{isVoiceEnabled ? '🔊' : '🔇'}</span>
              <span>{isVoiceEnabled ? 'Voice ON' : 'Muted'}</span>
              {isSpeaking && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 2 }}>
                  <span style={{ width: 2, background: 'white', animation: 'soundWave 0.8s infinite 0.1s' }} />
                  <span style={{ width: 2, background: 'white', animation: 'soundWave 0.8s infinite 0.3s' }} />
                  <span style={{ width: 2, background: 'white', animation: 'soundWave 0.8s infinite 0.2s' }} />
                </span>
              )}
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                width: 32,
                height: 32,
                borderRadius: '50%',
                fontSize: '1.1rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close training video"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 4 Steps Horizontal Progress Bar (Responsive Mobile Optimized) */}
        <div className="step-tabs-strip">
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
                  padding: '10px 12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isDone ? '#16a34a' : (isActive ? '#ea580c' : '#cbd5e1'),
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {isDone ? '✓' : step.stepNumber}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div className="step-tab-text-full" style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: isActive ? '#ea580c' : '#64748b'
                  }}>
                    {step.duration}
                  </div>
                  <div className="step-tab-text-full" style={{
                    fontSize: '0.78rem',
                    fontWeight: isActive ? 800 : 600,
                    color: isActive ? '#0f172a' : '#475569',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {step.title}
                  </div>
                  <div className="step-tab-text-mobile" style={{ display: 'none', color: isActive ? '#ea580c' : '#64748b' }}>
                    {step.shortTitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Main Body: Video Player + Checklist */}
        <div className="modal-body-layout">

          {/* LEFT: Video Player Stage */}
          <div className="video-stage-padding" style={{
            background: '#090d16',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid #1e293b'
          }}>
            
            {/* The Video Screen Frame */}
            <div 
              onClick={togglePlayPause}
              title={isPlaying ? "Click to Pause Video" : "Click to Play Video"}
              style={{
                background: '#0f172a',
                borderRadius: 14,
                border: isPlaying ? '1.5px solid #334155' : '1.5px solid #ea580c',
                overflow: 'hidden',
                position: 'relative',
                aspectRatio: '16/9',
                minHeight: 220,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: isPlaying ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 28px rgba(234, 88, 12, 0.35)',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            >

              {/* Video Player Header Overlay */}
              <div 
                onClick={(e) => e.stopPropagation()}
                style={{
                  padding: '8px 12px',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 0%, transparent 100%)',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 20,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                    style={{
                      background: isPlaying ? '#ea580c' : '#16a34a',
                      color: 'white',
                      border: 'none',
                      padding: '3px 9px',
                      borderRadius: 6,
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                      transition: 'transform 0.15s'
                    }}
                    title={isPlaying ? "Pause video" : "Play video"}
                  >
                    <span>{isPlaying ? '⏸' : '▶'}</span>
                    <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
                  </button>

                  <span style={{ color: '#e2e8f0', fontSize: '0.74rem', fontWeight: 700 }}>
                    Step {activeStepData.stepNumber}: {activeStepData.shortTitle}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isSpeaking && (
                    <span style={{
                      background: 'rgba(234, 88, 12, 0.35)',
                      border: '1px solid #ea580c',
                      color: '#fdba74',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      🗣️ Voiceover Speaking
                    </span>
                  )}
                  <span style={{
                    background: 'rgba(255,255,255,0.18)',
                    color: '#f8fafc',
                    fontSize: '0.68rem',
                    padding: '2px 6px',
                    borderRadius: 8
                  }}>
                    {formatSec(progressSec)} / {formatSec(maxSec)}
                  </span>
                </div>
              </div>

              {/* CENTER PLAY/PAUSE OVERLAY: Pops up prominently when paused */}
              {!isPlaying && (
                <div 
                  onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 25,
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(3px)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    cursor: 'pointer',
                    animation: 'sceneFadeIn 0.2s ease-out'
                  }}
                >
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    color: 'white',
                    boxShadow: '0 8px 28px rgba(234, 88, 12, 0.65)',
                    border: '3px solid #ffffff',
                    paddingLeft: '4px'
                  }}>
                    ▶
                  </div>
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.85)',
                    color: '#ffffff',
                    padding: '4px 14px',
                    borderRadius: 20,
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    letterSpacing: '0.02em',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)'
                  }}>
                    ⏸ VIDEO PAUSED • TAP TO PLAY
                  </div>
                </div>
              )}

              {/* SCENE DISPLAY: Dynamic Animated Real Extranet Simulation for Current Step */}
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px',
                position: 'relative',
                background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)',
                overflow: 'hidden'
              }}>

                {/* Animated Cartoon Character Guide: Captain Buddy 👨‍💼 / 🦊 */}
                <div style={{
                  position: 'absolute',
                  left: 12,
                  bottom: 12,
                  zIndex: 8,
                  animation: 'floatBuddy 3.5s ease-in-out infinite',
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: 8
                }}>
                  <div style={{
                    width: 54,
                    height: 54,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #ea580c 0%, #fb923c 100%)',
                    border: '2px solid #ffffff',
                    boxShadow: '0 6px 18px rgba(234, 88, 12, 0.45)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    position: 'relative',
                    flexShrink: 0
                  }}>
                    {currentStep === 0 && '👨‍💼'}
                    {currentStep === 1 && '📍'}
                    {currentStep === 2 && '📸'}
                    {currentStep === 3 && '💰'}
                    <span style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      background: '#16a34a',
                      color: 'white',
                      fontSize: '0.55rem',
                      fontWeight: 800,
                      padding: '1px 4px',
                      borderRadius: 8,
                      border: '1px solid white'
                    }}>
                      GUIDE
                    </span>
                  </div>

                  {/* Cartoon Speech Bubble */}
                  <div style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    padding: '6px 10px',
                    borderRadius: 12,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    maxWidth: 190,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    lineHeight: 1.3
                  }}>
                    {currentStep === 0 && 'Fill hotel name & official owner contact details! Never personal email.'}
                    {currentStep === 1 && 'Pin the exact front gate latitude and longitude for guest arrival!'}
                    {currentStep === 2 && 'Rule #1: First photo MUST be the wide exterior facade!'}
                    {currentStep === 3 && 'Set Single, Double & Triple occupancy rates + AI highlights!'}
                  </div>
                </div>

                {/* ANIMATED UI MOCKUPS BASED ON CURRENT STEP */}

                {/* Scene 1: Basics & Extranet */}
                {currentStep === 0 && (
                  <div style={{
                    background: '#ffffff',
                    borderRadius: 10,
                    padding: '10px 14px',
                    width: '75%',
                    marginLeft: '65px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                    animation: 'sceneFadeIn 0.4s ease-out'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, borderBottom: '1px solid #f1f5f9', paddingBottom: 4 }}>
                      <strong style={{ fontSize: '0.78rem', color: '#0f172a' }}>🏨 Property Info (Extranet)</strong>
                      <span style={{ fontSize: '0.62rem', background: '#ecfdf5', color: '#059669', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>Step 1</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '0.7rem' }}>
                      <div style={{ background: '#f8fafc', padding: '4px 6px', borderRadius: 5, border: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#64748b', fontSize: '0.58rem' }}>Property Name</div>
                        <div style={{ color: '#0f172a', fontWeight: 700 }}>Hotel Elite Grand</div>
                      </div>
                      <div style={{ background: '#f8fafc', padding: '4px 6px', borderRadius: 5, border: '1px solid #e2e8f0' }}>
                        <div style={{ color: '#64748b', fontSize: '0.58rem' }}>Star Category</div>
                        <div style={{ color: '#d97706', fontWeight: 700 }}>⭐⭐⭐⭐ 4-Star</div>
                      </div>
                      <div style={{ background: '#eff6ff', padding: '4px 6px', borderRadius: 5, border: '1px solid #bfdbfe' }}>
                        <div style={{ color: '#1e40af', fontSize: '0.58rem' }}>Partner Official Email</div>
                        <div style={{ color: '#1d4ed8', fontWeight: 700 }}>owner@hotelelite.com</div>
                      </div>
                      <div style={{ background: '#ecfdf5', padding: '4px 6px', borderRadius: 5, border: '1px solid #a7f3d0' }}>
                        <div style={{ color: '#065f46', fontSize: '0.58rem' }}>Partner Phone</div>
                        <div style={{ color: '#059669', fontWeight: 700 }}>+91 98765 43210</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scene 2: Map & Lat/Long */}
                {currentStep === 1 && (
                  <div style={{
                    background: '#1e293b',
                    borderRadius: 10,
                    padding: '10px 14px',
                    width: '75%',
                    marginLeft: '65px',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                    position: 'relative',
                    animation: 'sceneFadeIn 0.4s ease-out'
                  }}>
                    <div style={{
                      height: 100,
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
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: '2px solid #ea580c',
                        animation: 'radarRipple 1.8s infinite ease-out'
                      }} />
                      <div style={{
                        fontSize: '1.8rem',
                        animation: 'mapPinBounce 1.8s infinite ease-in-out'
                      }}>
                        📍
                      </div>
                      <div style={{
                        position: 'absolute',
                        bottom: 4,
                        left: 6,
                        background: 'rgba(15,23,42,0.9)',
                        color: '#38bdf8',
                        padding: '2px 6px',
                        borderRadius: 4,
                        fontSize: '0.62rem',
                        fontWeight: 700
                      }}>
                        Lat: 17.4435 • Long: 78.3772 (Gate Pin)
                      </div>
                    </div>
                  </div>
                )}

                {/* Scene 3: Photos */}
                {currentStep === 2 && (
                  <div style={{
                    display: 'flex',
                    gap: 6,
                    marginLeft: '65px',
                    animation: 'sceneFadeIn 0.4s ease-out'
                  }}>
                    <div style={{
                      width: 95,
                      background: '#1e293b',
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: '2px solid #ea580c'
                    }}>
                      <div style={{ height: 55, background: 'url(https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200) center/cover' }} />
                      <div style={{ padding: '3px 4px', fontSize: '0.58rem', color: '#ffedd5', background: '#9a3412', fontWeight: 800, textAlign: 'center' }}>
                        #1 Facade
                      </div>
                    </div>
                    <div style={{
                      width: 80,
                      background: '#1e293b',
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: '1px solid #334155'
                    }}>
                      <div style={{ height: 55, background: 'url(https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200) center/cover' }} />
                      <div style={{ padding: '3px 4px', fontSize: '0.58rem', color: '#cbd5e1', textAlign: 'center' }}>
                        #2 Bedroom
                      </div>
                    </div>
                    <div style={{
                      width: 80,
                      background: '#1e293b',
                      borderRadius: 6,
                      overflow: 'hidden',
                      border: '1px solid #334155'
                    }}>
                      <div style={{ height: 55, background: 'url(https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=200) center/cover' }} />
                      <div style={{ padding: '3px 4px', fontSize: '0.58rem', color: '#cbd5e1', textAlign: 'center' }}>
                        #3 Washroom
                      </div>
                    </div>
                  </div>
                )}

                {/* Scene 4: Pricing */}
                {currentStep === 3 && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 6,
                    marginLeft: '65px',
                    width: '75%',
                    animation: 'sceneFadeIn 0.4s ease-out'
                  }}>
                    <div style={{
                      background: '#1e293b',
                      borderRadius: 6,
                      padding: '6px',
                      border: '1px solid #334155',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.58rem', color: '#94a3b8' }}>👤 Single (1p)</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', margin: '2px 0' }}>₹1,299</div>
                      <div style={{ fontSize: '0.55rem', color: '#16a34a', fontWeight: 700 }}>Solo Tariff</div>
                    </div>
                    <div style={{
                      background: '#1e293b',
                      borderRadius: 6,
                      padding: '6px',
                      border: '1.5px solid #ea580c',
                      textAlign: 'center',
                      boxShadow: '0 3px 10px rgba(234,88,12,0.3)'
                    }}>
                      <div style={{ fontSize: '0.58rem', color: '#fdba74' }}>👥 Double (2p)</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffedd5', margin: '2px 0' }}>₹1,599</div>
                      <div style={{ fontSize: '0.55rem', color: '#ea580c', fontWeight: 700 }}>Standard</div>
                    </div>
                    <div style={{
                      background: '#1e293b',
                      borderRadius: 6,
                      padding: '6px',
                      border: '1px solid #334155',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '0.58rem', color: '#94a3b8' }}>👥+👤 Triple (3p)</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', margin: '2px 0' }}>₹1,999</div>
                      <div style={{ fontSize: '0.55rem', color: '#38bdf8', fontWeight: 700 }}>Extra Bed</div>
                    </div>
                  </div>
                )}

              </div>

              {/* Scrubber & Controls */}
              <div style={{
                background: '#090d16',
                padding: '6px 12px',
                borderTop: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
                gap: 5
              }}>
                <div 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = clickX / rect.width;
                    setProgressSec(Math.round(pct * maxSec));
                  }}
                  style={{
                    height: 4,
                    background: '#334155',
                    borderRadius: 2,
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{
                    height: '100%',
                    width: `${(progressSec / maxSec) * 100}%`,
                    background: 'linear-gradient(90deg, #ea580c, #f97316)',
                    borderRadius: 2,
                    transition: 'width 0.2s linear'
                  }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}
                      style={{
                        background: isPlaying ? 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)' : '#16a34a',
                        border: 'none',
                        color: 'white',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: '0.74rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                        transition: 'transform 0.15s'
                      }}
                      title={isPlaying ? "Pause video" : "Play video"}
                    >
                      <span>{isPlaying ? '⏸' : '▶'}</span>
                      <span>{isPlaying ? 'Pause Video' : 'Play Video'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProgressSec(0);
                        if (isVoiceEnabled) speakText(activeStepData.voiceText);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: '#cbd5e1',
                        padding: '4px 8px',
                        borderRadius: 6,
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                    >
                      ↺ Replay
                    </button>
                  </div>

                  <div style={{ color: '#94a3b8', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isPlaying ? '#22c55e' : '#f59e0b' }} />
                    <span>{isPlaying ? 'Playing • Click video to pause' : 'Paused • Click to resume'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Step Controls (Prev / Next) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                style={{
                  background: currentStep === 0 ? 'transparent' : '#1e293b',
                  color: currentStep === 0 ? '#475569' : '#f8fafc',
                  border: '1px solid #334155',
                  padding: '6px 12px',
                  borderRadius: 6,
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Prev Step
              </button>

              <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                Step {currentStep + 1} of {STEPS.length}
              </div>

              {currentStep < STEPS.length - 1 ? (
                <button
                  onClick={handleNextStep}
                  style={{
                    background: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5
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
                    padding: '6px 14px',
                    borderRadius: 6,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Complete All Steps
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Learning Checklist & Guidelines */}
          <div className="checklist-padding" style={{
            background: '#ffffff',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{
                  background: '#ffedd5',
                  color: '#c2410c',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 9999
                }}>
                  {activeStepData.badge} • {activeStepData.duration}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {completedSteps.length} / 4 Completed
                </span>
              </div>

              <h2 style={{ fontSize: '1.18rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', lineHeight: 1.3 }}>
                {activeStepData.icon} {activeStepData.title}
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                {activeStepData.summary}
              </p>

              {/* Key Takeaways Checklist */}
              <div style={{
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px solid #e2e8f0',
                padding: '12px 14px',
                marginBottom: 16
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span>📌 Mandatory Step Checklist:</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeStepData.points.map((pt, pIdx) => (
                    <div key={pIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: '0.78rem', color: '#334155', lineHeight: 1.35 }}>
                      <span style={{ color: '#16a34a', fontWeight: 800, flexShrink: 0 }}>✓</span>
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step Context Callout */}
              {currentStep === 0 && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  color: '#991b1b',
                  lineHeight: 1.35
                }}>
                  <strong>🔒 Critical Protocol:</strong> Hotel Owner/Partner contact information must be entered for all property notifications. Your staff email ({userEmail || 'staff email'}) remains 100% private.
                </div>
              )}

              {currentStep === 1 && (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  color: '#166534',
                  lineHeight: 1.35
                }}>
                  <strong>📍 Navigation Tip:</strong> Use Google Maps on mobile to drop a pin at the hotel front gate. Copy the two decimal numbers (Latitude & Longitude) and paste them into the coordinate inputs.
                </div>
              )}

              {currentStep === 2 && (
                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  color: '#9a3412',
                  lineHeight: 1.35
                }}>
                  <strong>📸 Photography Tip:</strong> Always shoot in landscape mode (horizontal). The first photo is automatically used in the B2C App and Spotlight Card!
                </div>
              )}

              {currentStep === 3 && (
                <div style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: '0.75rem',
                  color: '#1e40af',
                  lineHeight: 1.35
                }}>
                  <strong>💰 Occupancy Pricing Rule:</strong> Single (1 guest) is lowest rate, Double (2 guests) is standard, Triple (3 guests) includes extra bed.
                </div>
              )}
            </div>

            {/* UNLOCK / COMPLETE ONBOARDING CTA */}
            <div style={{ paddingTop: 14, borderTop: '1px solid #f1f5f9', marginTop: 10 }}>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                    window.speechSynthesis.cancel();
                  }
                  onCompleteAndProceed();
                }}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span>🚀</span>
                <span>{allCompleted ? 'Training Complete — Start Onboarding Property' : 'Complete 4-Step Video & Start Onboarding'}</span>
              </button>
              <div style={{ textAlign: 'center', marginTop: 6, fontSize: '0.72rem', color: '#64748b' }}>
                You can re-open this training video at any time from your Onboarding Portal.
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
