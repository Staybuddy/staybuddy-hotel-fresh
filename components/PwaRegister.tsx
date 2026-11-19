'use client';

import React, { useEffect, useState } from 'react';

export default function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('StayBuddy PWA: Service Worker registered with scope:', registration.scope);
          })
          .catch((err) => {
            console.warn('StayBuddy PWA: Service Worker registration failed:', err);
          });
      });
    }

    // 2. Check if already installed / standalone
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      // Check if user dismissed banner recently (suppress for 24 hours)
      const dismissedUntil = localStorage.getItem('staybuddy_pwa_dismissed');
      const isDismissed = dismissedUntil && Date.now() < Number(dismissedUntil);

      // 3. Capture beforeinstallprompt for native install prompt
      const handleBeforeInstall = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
        if (!isStandaloneMode && !isDismissed) {
          setShowBanner(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('PWA install outcome:', outcome);
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 24 hours
    try {
      localStorage.setItem('staybuddy_pwa_dismissed', String(Date.now() + 24 * 60 * 60 * 1000));
    } catch (_) {}
  };

  if (isStandalone || !showBanner || !deferredPrompt) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        left: '16px',
        right: '16px',
        maxWidth: 480,
        margin: '0 auto',
        zIndex: 19990,
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        color: '#ffffff',
        padding: '12px 16px',
        borderRadius: 16,
        boxShadow: '0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        animation: 'slideUpPwa 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <style>{`
        @keyframes slideUpPwa {
          0% { transform: translateY(100px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: '#ea580c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.2rem',
            flexShrink: 0,
            boxShadow: '0 4px 10px rgba(234, 88, 12, 0.4)',
          }}
        >
          🏨
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff', lineHeight: 1.2 }}>
            Install StayBuddy App
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: '#94a3b8',
              lineHeight: 1.2,
              marginTop: 2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Fast 1-tap bookings & offline access
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleInstallClick}
          style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 8,
            padding: '7px 14px',
            fontSize: '0.78rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          Install App
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'rgba(255,255,255,0.1)',
            color: '#cbd5e1',
            border: 'none',
            borderRadius: '50%',
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            cursor: 'pointer',
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

