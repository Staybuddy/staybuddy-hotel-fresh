'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';

export default function WelcomeAuthModal() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  useEffect(() => {
    // Only show to unauthenticated visitors who haven't dismissed it in the current session
    if (status === 'authenticated') return;
    if (typeof window === 'undefined') return;

    try {
      const dismissed = sessionStorage.getItem('staybuddy_welcome_dismissed');
      if (!dismissed) {
        // Small delay so page renders smoothly before modal pops
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch {
      // Ignore storage errors
    }
  }, [status]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('staybuddy_welcome_dismissed', 'true');
    } catch {}
    setIsOpen(false);
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    try {
      sessionStorage.setItem('staybuddy_welcome_dismissed', 'true');
      await signIn('google', { callbackUrl: '/' });
    } catch (err) {
      console.error('Google sign-in error', err);
      setLoadingGoogle(false);
    }
  };

  const handlePhoneEmailSignIn = () => {
    try {
      sessionStorage.setItem('staybuddy_welcome_dismissed', 'true');
    } catch {}
    setIsOpen(false);
    router.push('/login');
  };

  if (!isOpen || status === 'authenticated') {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleDismiss();
        }
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          background: '#ffffff',
          borderRadius: 24,
          padding: '28px 24px',
          boxShadow: '0 25px 65px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(234, 88, 12, 0.15)',
          overflow: 'hidden',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle top brand orange glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: 'linear-gradient(90deg, #ea580c, #f97316, #fb923c)',
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close welcome modal and continue as guest"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: '#f1f5f9',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 700,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#e2e8f0';
            (e.currentTarget as HTMLElement).style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#f1f5f9';
            (e.currentTarget as HTMLElement).style.color = '#64748b';
          }}
        >
          ✕
        </button>

        {/* Header with Logo */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: 12 }}>
            <Logo size="md" />
          </div>
          <h2
            id="welcome-modal-title"
            style={{
              fontSize: '1.45rem',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.02em',
              marginBottom: 6,
            }}
          >
            Welcome to StayBuddy! 🌟
          </h2>
          <p
            style={{
              fontSize: '0.88rem',
              color: '#64748b',
              lineHeight: 1.45,
              maxWidth: 360,
              margin: '0 auto',
            }}
          >
            Book verified hotels across India with Best Price Guarantee & zero hidden fees.
          </p>
        </div>

        {/* Exclusive Welcome Member Perks */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            border: '1.5px solid #fed7aa',
            borderRadius: 16,
            padding: '12px 14px',
            marginBottom: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem' }}>🎁</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9a3412' }}>
                FLAT 5% OFF First Booking
              </span>
              <span
                style={{
                  display: 'inline-block',
                  marginLeft: 6,
                  background: '#ea580c',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                  padding: '1px 6px',
                  borderRadius: 6,
                  letterSpacing: '0.04em',
                }}
              >
                FIRST5
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem' }}>⚡</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
              Instant Check-in & Pay at Hotel options
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.25rem' }}>🛡️</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
              100% Verified properties with zero cancellation fee
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {/* Option 1: Continue with Google */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '12px 18px',
              borderRadius: 14,
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontSize: '0.94rem',
              fontWeight: 700,
              cursor: loadingGoogle ? 'wait' : 'pointer',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#94a3b8';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.05)';
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loadingGoogle ? 'Signing in with Google...' : 'Continue with Google'}
          </button>

          {/* Option 2: Sign In with Phone / Email */}
          <button
            type="button"
            onClick={handlePhoneEmailSignIn}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '11px 18px',
              borderRadius: 14,
              border: '1.5px solid #ffedd5',
              background: '#fffaf5',
              color: '#ea580c',
              fontSize: '0.9rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#ffedd5';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = '#fffaf5';
            }}
          >
            <span>📱</span> Sign In with Phone or Email
          </button>

          {/* Option 3: Continue as Guest & Browse */}
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '11px 18px',
              borderRadius: 14,
              border: 'none',
              background: 'transparent',
              color: '#64748b',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#0f172a';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.color = '#64748b';
            }}
          >
            Continue as Guest & Browse Website →
          </button>
        </div>

        {/* Footer Note */}
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.72rem',
            color: '#94a3b8',
            margin: 0,
            lineHeight: 1.35,
          }}
        >
          By proceeding, you agree to StayBuddy's Terms of Service and Privacy Policy.
        </p>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(18px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

