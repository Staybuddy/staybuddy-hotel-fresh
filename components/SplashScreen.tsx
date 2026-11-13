'use client';
import { useState, useEffect } from 'react';
import BrandLoader from './BrandLoader';

export default function SplashScreen() {
  const [show, setShow] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Only show once on the initial website opening, never block navigation or refresh
    try {
      if (typeof window !== 'undefined') {
        const alreadyShown = sessionStorage.getItem('staybuddy_splash_shown');
        if (alreadyShown) {
          setShow(false);
          return;
        }
        setShow(true);
        sessionStorage.setItem('staybuddy_splash_shown', 'true');
      }
    } catch {
      setShow(false);
      return;
    }

    // Snappy, silky-smooth fadeout
    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1100);

    const removeTimer = setTimeout(() => {
      setShow(false);
    }, 1450);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 99999,
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.4s ease-out',
      }}
    >
      <BrandLoader size={84} message="Find & Book Great Stays" />
    </div>
  );
}
