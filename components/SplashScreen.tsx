'use client';
import { useState, useEffect } from 'react';
import Logo from './Logo';

export default function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2000);

    // Completely unmount after 2.5 seconds
    const removeTimer = setTimeout(() => {
      setShow(false);
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 99999,
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.5s ease-out',
    }}>
      {/* Brand Name */}
      <div style={{ margin: '0 0 40px 0' }}>
        <Logo size="xl" />
      </div>

      {/* Loading Animation: 3 circles */}
      <div style={{ position: 'relative', width: 120, height: 120 }}>
        {/* Spinning Ring */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          border: '3px solid var(--border)',
          borderTopColor: 'var(--brand-500)',
          borderRadius: '50%',
          animation: 'spin 1.5s linear infinite'
        }} />
        
        {/* Inner Small Circles (Hotel, Resort, Villa emojis) */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          gap: '8px'
        }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', animation: 'bounce 1s infinite alternate' }}>🏨</div>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', animation: 'bounce 1s infinite alternate 0.2s' }}>🌴</div>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', animation: 'bounce 1s infinite alternate 0.4s' }}>🏡</div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
