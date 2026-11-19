'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import Logo from '@/components/Logo';

export default function WelcomeAuthModal() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successWelcome, setSuccessWelcome] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (status === 'authenticated') {
      setIsOpen(false);
      return;
    }
    if (status === 'loading') return;

    // Check if user already dismissed or continued as guest in this browser session
    const guestSession = sessionStorage.getItem('staybuddy_welcome_guest');
    if (guestSession === 'true') return;

    // Open immediately on first visit before browsing
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 200);

    return () => clearTimeout(timer);
  }, [status]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem('staybuddy_welcome_guest', 'true');
    } catch {}
    setIsOpen(false);
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const email = emailInput.trim().toLowerCase();

    if (!email) {
      setErrorMessage('Please enter your email address to continue.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setLoadingEmail(true);
    try {
      const res = await signIn('email-signin', {
        email,
        redirect: false,
      });

      if (res?.error) {
        setErrorMessage(res.error || 'Failed to sign in with email. Please try again.');
        setLoadingEmail(false);
      } else {
        const username = email.split('@')[0];
        setSuccessWelcome(username.charAt(0).toUpperCase() + username.slice(1));
        setTimeout(() => {
          setIsOpen(false);
          window.location.reload();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Network error occurred. Please try again.');
      setLoadingEmail(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    setErrorMessage('');
    try {
      await signIn('google', { callbackUrl: window.location.href });
    } catch (err) {
      console.error('Google sign-in error', err);
      setErrorMessage('Google sign in failed. Please try again.');
      setLoadingGoogle(false);
    }
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
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'sbWelcomeFade 0.25s ease-out',
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
          boxShadow: '0 30px 80px -15px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(234, 88, 12, 0.2)',
          overflow: 'hidden',
          animation: 'sbWelcomePop 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Brand Orange Gradient Bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #fb923c 100%)',
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close welcome modal and continue as guest"
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
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
            fontSize: '0.95rem',
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

        {/* Success Splash */}
        {successWelcome ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a', marginBottom: 8 }}>
              Welcome, {successWelcome}!
            </h3>
            <p style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.95rem', marginBottom: 6 }}>
              ✓ You are now signed in to StayBuddy
            </p>
            <p style={{ color: '#64748b', fontSize: '0.82rem' }}>
              🎁 ₹500 Welcome Credits added to your account.
            </p>
          </div>
        ) : (
          <>
            {/* Header: Logo & Greeting */}
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: 10 }}>
                <Logo size="md" />
              </div>
              <h2
                id="welcome-modal-title"
                style={{
                  fontSize: '1.42rem',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  marginBottom: 4,
                }}
              >
                Welcome to StayBuddy! 🌟
              </h2>
              <p
                style={{
                  fontSize: '0.86rem',
                  color: '#64748b',
                  lineHeight: 1.4,
                  maxWidth: 360,
                  margin: '0 auto',
                }}
              >
                Sign in to unlock exclusive member discounts, instant check-in & wallet credits.
              </p>
            </div>

            {/* Exclusive Welcome Benefit Pill */}
            <div
              style={{
                background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                border: '1.5px solid #fed7aa',
                borderRadius: 14,
                padding: '10px 14px',
                marginBottom: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>🎁</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: '#9a3412' }}>
                    Flat 5% OFF First Stay
                  </span>
                  <span
                    style={{
                      background: '#ea580c',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 900,
                      padding: '1px 6px',
                      borderRadius: 4,
                      letterSpacing: '0.04em',
                    }}
                  >
                    FIRST5
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#7c2d12', marginTop: 1 }}>
                  Instant booking confirmation with zero booking fees
                </div>
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  borderRadius: 10,
                  padding: '8px 12px',
                  color: '#b91c1c',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: 14,
                  textAlign: 'center',
                }}
              >
                {errorMessage}
              </div>
            )}

            {/* Direct Email Sign-In Form */}
            <form onSubmit={handleEmailSignIn} style={{ marginBottom: 14 }}>
              <label
                htmlFor="welcome-email-input"
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  color: '#334155',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Sign In with your Email
              </label>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <input
                  id="welcome-email-input"
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Enter your email (e.g. name@gmail.com)"
                  disabled={loadingEmail}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 40px',
                    borderRadius: 12,
                    border: '1.5px solid #cbd5e1',
                    fontSize: '0.92rem',
                    color: '#0f172a',
                    outline: 'none',
                    background: '#ffffff',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ea580c';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(234, 88, 12, 0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#cbd5e1';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: 14,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '1rem',
                    color: '#94a3b8',
                    pointerEvents: 'none',
                  }}
                >
                  ✉️
                </span>
              </div>

              <button
                type="submit"
                disabled={loadingEmail}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 18px',
                  fontSize: '0.94rem',
                  fontWeight: 800,
                  cursor: loadingEmail ? 'wait' : 'pointer',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'opacity 0.2s ease',
                  opacity: loadingEmail ? 0.75 : 1,
                }}
              >
                {loadingEmail ? (
                  <>
                    <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #ffffff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'sbWelcomeSpin 0.8s linear infinite' }} />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <span>Continue with Email →</span>
                )}
              </button>
            </form>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                margin: '12px 0',
                gap: 10,
                color: '#94a3b8',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}
            >
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span>Or</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {/* Option 2: Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loadingGoogle}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '11px 16px',
                borderRadius: 12,
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: loadingGoogle ? 'wait' : 'pointer',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
                marginBottom: 10,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#94a3b8';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.08)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = '#cbd5e1';
                (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.04)';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
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
              <span>{loadingGoogle ? 'Signing in with Google...' : 'Continue with Google'}</span>
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
                padding: '9px 16px',
                borderRadius: 12,
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'color 0.15s ease',
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
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes sbWelcomeFade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes sbWelcomePop {
          from { opacity: 0; transform: translateY(22px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sbWelcomeSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
