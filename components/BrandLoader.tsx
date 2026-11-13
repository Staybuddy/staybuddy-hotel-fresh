'use client';

import React from 'react';
import Image from 'next/image';

interface BrandLoaderProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
}

export default function BrandLoader({
  message = 'Loading StayBuddy...',
  size = 72,
  fullScreen = false,
}: BrandLoaderProps) {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        userSelect: 'none',
      }}
    >
      {/* StayBuddy Logo — Gentle Pulse only, NEVER rotates */}
      <div
        className="brand-logo-pulse"
        style={{
          width: size,
          height: size,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src="/staybuddy-logo-pin.png"
          alt="StayBuddy"
          width={size}
          height={size}
          style={{
            objectFit: 'contain',
            filter: 'drop-shadow(0 6px 16px rgba(234, 88, 12, 0.35))',
          }}
        />
      </div>

      {/* Brand Title */}
      <div
        style={{
          fontSize: '1.25rem',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: '#0f172a',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          lineHeight: 1,
        }}
      >
        Stay<span style={{ color: '#ea580c' }}>Buddy</span>
      </div>

      {/* Elegant Linear Progress Bar */}
      <div
        style={{
          width: 130,
          height: 4,
          background: 'rgba(234, 88, 12, 0.15)',
          borderRadius: 999,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div className="brand-loader-bar" />
      </div>

      {message && (
        <span
          style={{
            fontSize: '0.8rem',
            color: '#64748b',
            fontWeight: 600,
            letterSpacing: '0.02em',
          }}
        >
          {message}
        </span>
      )}

      <style jsx>{`
        .brand-logo-pulse {
          animation: logoBreathe 1.8s ease-in-out infinite;
        }

        .brand-loader-bar {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;
          background: linear-gradient(90deg, #fb923c, #ea580c);
          border-radius: 999px;
          animation: loaderSlide 1.4s ease-in-out infinite;
        }

        @keyframes logoBreathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.08);
          }
        }

        @keyframes loaderSlide {
          0% {
            left: -50%;
          }
          50% {
            left: 30%;
          }
          100% {
            left: 100%;
          }
        }
      `}</style>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      {content}
    </div>
  );
}
