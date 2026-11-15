'use client';
import { useState, useEffect } from 'react';

export default function InstallAppButton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    setDownloading(true);

    // 1. Trigger Direct Standalone APK Download
    const downloadLink = document.createElement('a');
    downloadLink.href = '/StayBuddy.apk';
    downloadLink.setAttribute('download', 'StayBuddy.apk');
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // 2. If browser PWA prompt available, trigger it
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(() => {
          setDeferredPrompt(null);
        });
      } catch (err) {}
    }

    setTimeout(() => {
      setDownloading(false);
      setShowModal(true);
    }, 800);
  };

  return (
    <>
      <button
        onClick={handleInstall}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
          color: '#ffffff',
          fontWeight: 800,
          fontSize: '0.85rem',
          padding: '8px 14px',
          borderRadius: '9999px',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          ...style,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px) scale(1.02)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'none')}
        title="Download & Install Standalone StayBuddy Android APK"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>{downloading ? 'Downloading APK...' : 'Install App'}</span>
        <span
          style={{
            background: 'rgba(255,255,255,0.25)',
            fontSize: '0.65rem',
            padding: '2px 6px',
            borderRadius: '9999px',
            fontWeight: 900,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          APK
        </span>
      </button>

      {/* Confirmation Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 20,
              maxWidth: 420,
              width: '100%',
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 28,
              }}
            >
              ✓
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px' }}>
              Downloading StayBuddy.apk!
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5, margin: '0 0 20px' }}>
              The official Android app binary is downloading to your device. Once complete, tap the file to install and experience native 60 FPS performance!
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: 12,
                textAlign: 'left',
                fontSize: '0.8rem',
                color: '#334155',
                marginBottom: 20,
              }}
            >
              <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>📲 How to Install:</div>
              <div>1. Open your downloaded files notification.</div>
              <div>2. Tap <strong>StayBuddy.apk</strong>.</div>
              <div>3. If prompted, allow <em>"Install unknown apps"</em> for your browser.</div>
              <div>4. Tap <strong>Install</strong> to start booking!</div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <a
                href="/StayBuddy.apk"
                download="StayBuddy.apk"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  background: '#ea580c',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  padding: '10px 16px',
                  borderRadius: 12,
                  textDecoration: 'none',
                }}
              >
                📥 Download Again
              </a>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 16px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

