'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Logo, { StayBuddyIconMark, StayBuddyAppIcon } from '@/components/Logo';

export default function LogoBrandPage() {
  const [bgMode, setBgMode] = useState<'white' | 'dark' | 'orange' | 'cream' | 'checker'>('white');
  const [activeBoard, setActiveBoard] = useState<'minimal' | 'concepts' | 'hero'>('minimal');
  const [activeConcept, setActiveConcept] = useState<'pin-roof' | 'fluid-s' | 'sun-horizon' | 'cradle'>('pin-roof');
  const [activeVariant, setActiveVariant] = useState<'horizontal' | 'stacked' | 'app-icon' | 'icon' | 'minimal'>('horizontal');
  const [showTagline, setShowTagline] = useState(true);
  const [taglineText, setTaglineText] = useState('HOTELS & STAYS');
  const [activeSize, setActiveSize] = useState<'md' | 'lg' | 'xl' | '2xl'>('xl');
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const previewBoxRef = useRef<HTMLDivElement>(null);

  const colors = [
    { name: 'Sunset Orange (Primary)', hex: '#f97316', text: '#ffffff', desc: 'Core brand energy, friendliness & warmth' },
    { name: 'Deep Sunset (Accent)', hex: '#ea580c', text: '#ffffff', desc: 'Gradients, buttons & hover states' },
    { name: 'Midnight Slate (Luxury)', hex: '#0f172a', text: '#ffffff', desc: 'Typography, dark mode & premium contrast' },
    { name: 'Warm Amber (Highlight)', hex: '#fbbf24', text: '#0f172a', desc: 'Stars, ratings & badge accents' },
    { name: 'Warm Cream (Surface)', hex: '#fff7ed', text: '#c2410c', desc: 'Soft cards, light backgrounds & tints' },
    { name: 'Pure White (Canvas)', hex: '#ffffff', text: '#0f172a', desc: 'Clean backgrounds & crisp badges' },
  ];

  const copyToClipboard = (hex: string) => {
    navigator.clipboard?.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  const getBgStyle = () => {
    switch (bgMode) {
      case 'dark':
        return { background: '#0f172a', color: '#ffffff' };
      case 'orange':
        return { background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: '#ffffff' };
      case 'cream':
        return { background: '#fff7ed', color: '#0f172a' };
      case 'checker':
        return {
          background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 50% / 20px 20px',
          color: '#0f172a',
        };
      default:
        return { background: '#ffffff', color: '#0f172a' };
    }
  };

  const isLightText = bgMode === 'dark' || bgMode === 'orange';

  // Instant SVG download function
  const handleDownloadSVG = () => {
    const isWhite = isLightText;
    const svgCode = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="400" height="120" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sb-orange" x1="10" y1="15" x2="90" y2="90" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#fb923c" />
      <stop offset="50%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
    <linearGradient id="sb-pin" x1="30" y1="30" x2="70" y2="75" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ff7828" />
      <stop offset="100%" stop-color="#c2410c" />
    </linearGradient>
  </defs>
  <!-- StayBuddy Mark -->
  <g transform="translate(10, 10) scale(1)">
    <!-- Chimney -->
    <path d="M68 28.5V20C68 18.9 68.9 18 70 18H74C75.1 18 76 18.9 76 20V36.5" stroke="${isWhite ? '#ffffff' : 'url(#sb-orange)'}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Roof Gable -->
    <path d="M17 48L46.8 20.8C48.6 19.2 51.4 19.2 53.2 20.8L83 48" stroke="${isWhite ? '#ffffff' : 'url(#sb-orange)'}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
    <!-- Pin with S Monogram -->
    <path d="M50 33C42.8 33 37 38.8 37 46C37 54.5 48.2 66.2 49.2 67.2C49.6 67.7 50.4 67.7 50.8 67.2C51.8 66.2 63 54.5 63 46C63 38.8 57.2 33 50 33Z" fill="${isWhite ? '#ffffff' : 'url(#sb-pin)'}"/>
    <text x="50" y="49.5" text-anchor="middle" fill="${isWhite ? '#ea580c' : '#ffffff'}" font-size="11.5" font-family="system-ui, sans-serif" font-weight="900">S</text>
    <!-- Smile Cradle -->
    <path d="M23 58C25 72.5 36.5 83 50 83C63.5 83 75 72.5 77 58" stroke="${isWhite ? '#ffffff' : 'url(#sb-orange)'}" stroke-width="6.5" stroke-linecap="round"/>
    <circle cx="21.5" cy="53.5" r="3.2" fill="${isWhite ? '#ffffff' : 'url(#sb-orange)'}"/>
    <circle cx="78.5" cy="53.5" r="3.2" fill="${isWhite ? '#ffffff' : 'url(#sb-orange)'}"/>
  </g>
  <!-- Wordmark -->
  <text x="120" y="68" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" letter-spacing="-1.5">
    <tspan fill="${isWhite ? '#ffffff' : '#0f172a'}">Stay</tspan><tspan fill="#f97316">Buddy</tspan>
  </text>
  <text x="123" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" letter-spacing="4" fill="${isWhite ? '#cbd5e1' : '#64748b'}">
    ${taglineText}
  </text>
</svg>`;

    const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `staybuddy-logo-${activeVariant}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess('Vector SVG Downloaded!');
    setTimeout(() => setDownloadSuccess(null), 2500);
  };

  // High-resolution raster PNG export
  const handleDownloadPNG = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background fill
    if (bgMode === 'dark') {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 1600, 800);
    } else if (bgMode === 'orange') {
      const grad = ctx.createLinearGradient(0, 0, 1600, 800);
      grad.addColorStop(0, '#f97316');
      grad.addColorStop(1, '#ea580c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1600, 800);
    } else if (bgMode === 'cream') {
      ctx.fillStyle = '#fff7ed';
      ctx.fillRect(0, 0, 1600, 800);
    } else if (bgMode === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1600, 800);
    }

    // Render SVG into Image object
    const isWhite = isLightText;
    const svgString = `<svg width="1200" height="600" viewBox="0 0 400 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sb-orange" x1="10" y1="15" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#fb923c" />
          <stop offset="50%" stop-color="#f97316" />
          <stop offset="100%" stop-color="#ea580c" />
        </linearGradient>
        <linearGradient id="sb-pin" x1="30" y1="30" x2="70" y2="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#ff7828" />
          <stop offset="100%" stop-color="#c2410c" />
        </linearGradient>
      </defs>
      <g transform="translate(10, 10)">
        <path d="M68 28.5V20C68 18.9 68.9 18 70 18H74C75.1 18 76 18.9 76 20V36.5" stroke="${isWhite ? '#ffffff' : 'url(#sb-orange)'}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M17 48L46.8 20.8C48.6 19.2 51.4 19.2 53.2 20.8L83 48" stroke="${isWhite ? '#ffffff' : 'url(#sb-orange)'}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M50 33C42.8 33 37 38.8 37 46C37 54.5 48.2 66.2 49.2 67.2C49.6 67.7 50.4 67.7 50.8 67.2C51.8 66.2 63 54.5 63 46C63 38.8 57.2 33 50 33Z" fill="${isWhite ? '#ffffff' : 'url(#sb-pin)'}"/>
        <text x="50" y="49.5" text-anchor="middle" fill="${isWhite ? '#ea580c' : '#ffffff'}" font-size="11.5" font-family="system-ui, sans-serif" font-weight="900">S</text>
        <path d="M23 58C25 72.5 36.5 83 50 83C63.5 83 75 72.5 77 58" stroke="${isWhite ? '#ffffff' : 'url(#sb-orange)'}" stroke-width="6.5" stroke-linecap="round"/>
        <circle cx="21.5" cy="53.5" r="3.2" fill="${isWhite ? '#ffffff' : 'url(#sb-orange)'}"/>
        <circle cx="78.5" cy="53.5" r="3.2" fill="${isWhite ? '#ffffff' : 'url(#sb-orange)'}"/>
      </g>
      <text x="120" y="68" font-family="system-ui, -apple-system, sans-serif" font-size="44" font-weight="900" letter-spacing="-1.5">
        <tspan fill="${isWhite ? '#ffffff' : '#0f172a'}">Stay</tspan><tspan fill="#f97316">Buddy</tspan>
      </text>
      <text x="123" y="90" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="800" letter-spacing="4" fill="${isWhite ? '#cbd5e1' : '#64748b'}">
        ${taglineText}
      </text>
    </svg>`;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 200, 100, 1200, 600);
      URL.revokeObjectURL(url);

      const link = document.createElement('a');
      link.download = `staybuddy-logo-hires-${bgMode}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess('High-Res PNG (1600x800) Downloaded!');
      setTimeout(() => setDownloadSuccess(null), 2500);
    };

    img.src = url;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, padding: '36px 16px 80px 16px', maxWidth: 1240, margin: '0 auto', width: '100%' }}>
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#fff7ed',
              border: '1px solid #fdba74',
              padding: '6px 18px',
              borderRadius: 30,
              marginBottom: 16,
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>✨</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#c2410c', letterSpacing: '0.04em' }}>
              OFFICIAL BRAND IDENTITY
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 900,
              color: '#0f172a',
              letterSpacing: '-0.03em',
              margin: '0 0 12px 0',
            }}
          >
            StayBuddy Logo & Brand System
          </h1>

          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: 680, margin: '0 auto', lineHeight: 1.6 }}>
            The definitive brand emblem crafted for modern hospitality — uniting shelter, destination discovery, and genuine hospitality warmth.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleDownloadSVG}
              style={{
                background: '#f97316',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              }}
            >
              <span>📥</span> Download Vector SVG
            </button>

            <button
              type="button"
              onClick={handleDownloadPNG}
              style={{
                background: '#0f172a',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(15, 23, 42, 0.2)',
              }}
            >
              <span>🖼️</span> Download High-Res PNG
            </button>

            <Link
              href="/visiting-card"
              style={{
                background: 'white',
                color: '#334155',
                border: '1px solid #cbd5e1',
                padding: '12px 20px',
                borderRadius: 12,
                fontWeight: 700,
                fontSize: '0.95rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>🪪</span> Open Visiting Card
            </Link>
          </div>

          {downloadSuccess && (
            <div
              style={{
                marginTop: 14,
                display: 'inline-block',
                background: '#ecfdf5',
                border: '1px solid #6ee7b7',
                color: '#065f46',
                padding: '6px 16px',
                borderRadius: 20,
                fontWeight: 700,
                fontSize: '0.85rem',
              }}
            >
              ✓ {downloadSuccess}
            </div>
          )}
        </div>

        {/* Brand Presentation Mockup Showcase */}
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            padding: 16,
            boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            marginBottom: 48,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 12, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setActiveBoard('minimal')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  background: activeBoard === 'minimal' ? '#ffffff' : 'transparent',
                  color: activeBoard === 'minimal' ? '#f97316' : '#64748b',
                  boxShadow: activeBoard === 'minimal' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                ✨ Minimalist Concepts (A, B, C, D)
              </button>
              <button
                type="button"
                onClick={() => setActiveBoard('concepts')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  background: activeBoard === 'concepts' ? '#ffffff' : 'transparent',
                  color: activeBoard === 'concepts' ? '#f97316' : '#64748b',
                  boxShadow: activeBoard === 'concepts' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                🎨 Brand Exploration (Infinity, Monogram, Bed & Pin)
              </button>
              <button
                type="button"
                onClick={() => setActiveBoard('hero')}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  background: activeBoard === 'hero' ? '#ffffff' : 'transparent',
                  color: activeBoard === 'hero' ? '#f97316' : '#64748b',
                  boxShadow: activeBoard === 'hero' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                📐 8K Blueprint Presentation
              </button>
            </div>

            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f97316', background: '#fff7ed', padding: '4px 10px', borderRadius: 12 }}>
              AWARD WINNING IDENTITY
            </span>
          </div>

          <div style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
            <img
              src={
                activeBoard === 'minimal'
                  ? '/staybuddy-logo-concepts-2.jpg'
                  : activeBoard === 'concepts'
                  ? '/staybuddy-logo-concepts-1.jpg'
                  : '/staybuddy-logo-presentation.jpg'
              }
              alt="StayBuddy Brand Logo Presentation Board"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </div>

        {/* 3 Pillars of The StayBuddy Emblem */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
              The Anatomy Behind The Symbol
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Why this mark represents StayBuddy better than any generic hotel symbol.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {/* Pillar 1: The Roof */}
            <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #fed7aa', boxShadow: '0 4px 20px rgba(249,115,22,0.06)' }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: 16 }}>
                🏠
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                1. The Modern Gable Roof
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Represents <strong>&quot;Stay&quot;</strong> — a cozy shelter, peace of mind, premium hotel accommodations, and the comfort of feeling at home anywhere in the world.
              </p>
            </div>

            {/* Pillar 2: The Location Pin */}
            <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #fed7aa', boxShadow: '0 4px 20px rgba(249,115,22,0.06)' }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: 16 }}>
                📍
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                2. Location Pin with &apos;S&apos; Monogram
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Represents <strong>Discovery & Destinations</strong> — precise geolocation booking, top-rated city stays, and the signature StayBuddy stamp of verified quality.
              </p>
            </div>

            {/* Pillar 3: The Smile Cradle */}
            <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid #fed7aa', boxShadow: '0 4px 20px rgba(249,115,22,0.06)' }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', marginBottom: 16 }}>
                🧡
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                3. The Hospitality Smile Cradle
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Represents <strong>&quot;Buddy&quot;</strong> — warmth, welcoming smiles, human touch, trust, and 24/7 hospitality companionship throughout every traveler&apos;s trip.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Logo Studio / Playground */}
        <div
          style={{
            background: 'white',
            borderRadius: 24,
            padding: 32,
            boxShadow: '0 8px 30px rgba(0,0,0,0.05)',
            border: '1px solid #e2e8f0',
            marginBottom: 48,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 28, borderBottom: '1px solid #f1f5f9', paddingBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 4px 0' }}>
                Interactive Vector Logo Studio
              </h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
                Preview the live SVG across different backgrounds, sizes, and layout configurations.
              </p>
            </div>

            {/* Background Switcher */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginRight: 4 }}>
                Canvas:
              </span>
              <button
                type="button"
                onClick={() => setBgMode('white')}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#ffffff',
                  border: bgMode === 'white' ? '2px solid #f97316' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                }}
                title="White Background"
              />
              <button
                type="button"
                onClick={() => setBgMode('dark')}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#0f172a',
                  border: bgMode === 'dark' ? '2px solid #f97316' : '1px solid #334155',
                  cursor: 'pointer',
                }}
                title="Dark Midnight Slate Background"
              />
              <button
                type="button"
                onClick={() => setBgMode('orange')}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  border: bgMode === 'orange' ? '2px solid #ffffff' : '1px solid #ea580c',
                  cursor: 'pointer',
                }}
                title="Sunset Orange Background"
              />
              <button
                type="button"
                onClick={() => setBgMode('cream')}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#fff7ed',
                  border: bgMode === 'cream' ? '2px solid #f97316' : '1px solid #fdba74',
                  cursor: 'pointer',
                }}
                title="Warm Cream Background"
              />
              <button
                type="button"
                onClick={() => setBgMode('checker')}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 50% / 10px 10px',
                  border: bgMode === 'checker' ? '2px solid #f97316' : '1px solid #cbd5e1',
                  cursor: 'pointer',
                }}
                title="Transparent Grid"
              />
            </div>
          </div>

          {/* Controls Bar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {/* Concept Selector */}
            <div style={{ display: 'flex', gap: 6, background: '#fff7ed', padding: 6, borderRadius: 14, border: '1px solid #fed7aa', width: '100%', overflowX: 'auto' }}>
              {(
                [
                  { id: 'pin-roof', label: '📍 Option 1: Pin-Roof (Recommended - Clean Minimalist)' },
                  { id: 'fluid-s', label: '♾️ Option 2: Fluid S-Ribbon' },
                  { id: 'sun-horizon', label: '🌅 Option 3: Sun & Horizon' },
                  { id: 'cradle', label: '🧡 Option 4: Hospitality Cradle' },
                ] as const
              ).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveConcept(c.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: activeConcept === c.id ? '#f97316' : 'transparent',
                    color: activeConcept === c.id ? '#ffffff' : '#c2410c',
                    boxShadow: activeConcept === c.id ? '0 2px 6px rgba(249,115,22,0.3)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
            {/* Variant Selector */}
            <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
              {(
                [
                  { id: 'horizontal', label: 'Horizontal Primary' },
                  { id: 'stacked', label: 'Stacked Emblem' },
                  { id: 'app-icon', label: 'App Icon Badge' },
                  { id: 'icon', label: 'Symbol Only' },
                  { id: 'minimal', label: 'Wordmark' },
                ] as const
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActiveVariant(v.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    background: activeVariant === v.id ? '#ffffff' : 'transparent',
                    color: activeVariant === v.id ? '#f97316' : '#64748b',
                    boxShadow: activeVariant === v.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            {/* Size Selector */}
            <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 12 }}>
              {(['md', 'lg', 'xl', '2xl'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveSize(s)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textTransform: 'uppercase',
                    background: activeSize === s ? '#ffffff' : 'transparent',
                    color: activeSize === s ? '#0f172a' : '#64748b',
                    boxShadow: activeSize === s ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Tagline Toggle */}
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.85rem', fontWeight: 700, color: '#475569', cursor: 'pointer', marginLeft: 8 }}>
              <input
                type="checkbox"
                checked={showTagline}
                onChange={(e) => setShowTagline(e.target.checked)}
                style={{ accentColor: '#f97316' }}
              />
              Show Tagline
            </label>
            </div>
          </div>

          {/* Active Logo Render Canvas */}
          <div
            ref={previewBoxRef}
            style={{
              ...getBgStyle(),
              borderRadius: 20,
              minHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 48,
              transition: 'background 0.3s ease, color 0.3s ease',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.02)',
              position: 'relative',
            }}
          >
            <Logo
              concept={activeConcept}
              variant={activeVariant}
              size={activeSize === '2xl' ? 68 : activeSize}
              light={isLightText}
              showTagline={showTagline}
              taglineText={taglineText}
              animated={true}
            />
          </div>
        </div>

        {/* Brand Colors Palette */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', margin: '0 0 6px 0' }}>
              Official StayBuddy Color Palette
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Click any color swatch to instantly copy its exact HEX code.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
            {colors.map((c) => (
              <div
                key={c.hex}
                onClick={() => copyToClipboard(c.hex)}
                style={{
                  background: 'white',
                  borderRadius: 16,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
              >
                <div
                  style={{
                    height: 100,
                    background: c.hex,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: c.text,
                    fontWeight: 900,
                    fontSize: '1rem',
                    letterSpacing: '0.04em',
                  }}
                >
                  {copiedColor === c.hex ? '✓ COPIED!' : c.hex}
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#0f172a', marginBottom: 4 }}>
                    {c.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>
                    {c.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Export & Next Steps */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            borderRadius: 24,
            padding: '40px 32px',
            color: 'white',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle glow */}
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 500,
              height: 300,
              background: 'radial-gradient(ellipse at center, rgba(249, 115, 22, 0.25) 0%, rgba(0,0,0,0) 70%)',
              pointerEvents: 'none',
            }}
          />

          <h2 style={{ fontSize: '2rem', fontWeight: 900, margin: '0 0 12px 0', position: 'relative' }}>
            Ready to Use Across All Touchpoints
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: 640, margin: '0 auto 28px auto', lineHeight: 1.6, position: 'relative' }}>
            The new official logo is already built directly into StayBuddy&apos;s header navigation, footer, mobile splash screen, and the official visiting card generator.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', position: 'relative' }}>
            <Link
              href="/visiting-card"
              style={{
                background: '#f97316',
                color: 'white',
                padding: '14px 28px',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: '1rem',
                textDecoration: 'none',
                boxShadow: '0 6px 20px rgba(249, 115, 22, 0.4)',
              }}
            >
              Open Visiting Card Generator →
            </Link>

            <Link
              href="/"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: 'white',
                padding: '14px 28px',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: '1rem',
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Explore Homepage
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
