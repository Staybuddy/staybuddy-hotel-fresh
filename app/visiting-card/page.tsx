'use client';

import React, { useState, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Logo, { StayBuddyIconMark, StayBuddyAppIcon } from '@/components/Logo';

export default function VisitingCardPage() {
  const [name, setName] = useState('Arif Shaik');
  const [role, setRole] = useState('Founder & Managing Director');
  const [phone, setPhone] = useState('+91 99890 99436');
  const [email, setEmail] = useState('staybuddyhotels@gmail.com');
  const [website, setWebsite] = useState('www.staybuddy.in');
  const [slogan, setSlogan] = useState('FIND & BOOK YOUR PERFECT STAY');
  const [badgeText, setBadgeText] = useState('Book your perfect stay!');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [activeSide, setActiveSide] = useState<'front' | 'back' | 'both'>('both');
  const [isFlipped, setIsFlipped] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <div className="no-print">
        <Navbar />
      </div>

      <main className="container" style={{ padding: '32px 16px 64px 16px', flex: 1, maxWidth: 1200 }}>
        {/* Header Banner */}
        <div className="no-print" style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff7ed', border: '1px solid #fdba74', padding: '6px 16px', borderRadius: 24, marginBottom: 12 }}>
            <span style={{ fontSize: '1rem' }}>🪪</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c2410c' }}>StayBuddy Official Identity</span>
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>
            Professional Visiting Card Generator
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: 600, margin: '0 auto' }}>
            Tailored in StayBuddy&apos;s signature sunset orange & luxury navy palette with print-ready 3.5&quot; × 2&quot; standard dimensions.
          </p>
        </div>

        {/* Layout: Preview on Left, Customizer on Right */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 1fr)', gap: 32, alignItems: 'start' }} className="visiting-card-grid">
          
          {/* Card Presentation Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* View controls */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '12px 20px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveSide('both')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeSide === 'both' ? '#f97316' : '#f1f5f9',
                    color: activeSide === 'both' ? 'white' : '#475569',
                    transition: 'all 0.2s',
                  }}
                >
                  Side by Side
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveSide('front'); setIsFlipped(false); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeSide === 'front' ? '#f97316' : '#f1f5f9',
                    color: activeSide === 'front' ? 'white' : '#475569',
                    transition: 'all 0.2s',
                  }}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => { setActiveSide('back'); setIsFlipped(true); }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: 'none',
                    cursor: 'pointer',
                    background: activeSide === 'back' ? '#f97316' : '#f1f5f9',
                    color: activeSide === 'back' ? 'white' : '#475569',
                    transition: 'all 0.2s',
                  }}
                >
                  Back
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    border: '1px solid #cbd5e1',
                    background: 'white',
                    cursor: 'pointer',
                    color: '#334155',
                  }}
                >
                  {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 10,
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    border: 'none',
                    background: '#ea580c',
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(234,88,12,0.3)',
                  }}
                >
                  <span>🖨️ Print / PDF</span>
                </button>
              </div>
            </div>

            {/* Printable Container */}
            <div id="visiting-card-print-area" style={{ display: 'flex', flexDirection: 'column', gap: 32, alignItems: 'center' }}>
              
              {/* FRONT CARD */}
              {(activeSide === 'both' || activeSide === 'front') && (
                <div style={{ width: '100%', maxWidth: 520, perspective: 1000 }}>
                  <div className="no-print" style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Card Front Face (3.5&quot; × 2&quot;)</span>
                    <span style={{ color: '#f97316' }}>StayBuddy Identity</span>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1.75 / 1', // 3.5 / 2 standard business card
                      background: theme === 'light' ? '#fdfbf7' : '#0b1120',
                      borderRadius: 16,
                      border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 24,
                      boxSizing: 'border-box',
                      textAlign: 'center',
                    }}
                  >
                    {/* World Map Subtle Watermark Background */}
                    <svg
                      viewBox="0 0 1000 500"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: theme === 'light' ? 0.08 : 0.04,
                        pointerEvents: 'none',
                      }}
                      fill={theme === 'light' ? '#0f172a' : '#ffffff'}
                    >
                      {/* Stylized continent shapes */}
                      <path d="M150,120 Q180,90 240,110 T320,130 Q330,190 280,240 T210,260 Q170,220 140,160 Z" />
                      <path d="M220,290 Q260,300 280,360 T250,440 Q220,450 200,380 T220,290 Z" />
                      <path d="M500,100 Q560,70 650,90 T780,120 Q840,180 810,240 T680,250 Q580,210 500,160 Z" />
                      <path d="M480,200 Q530,190 560,240 T540,350 Q500,390 460,330 T480,200 Z" />
                      <path d="M720,300 Q780,290 820,330 T790,400 Q740,410 710,360 Z" />
                      <circle cx="850" cy="180" r="14" />
                      <circle cx="160" cy="380" r="10" />
                    </svg>

                    {/* Subtle Orange Glow in Center */}
                    <div
                      style={{
                        position: 'absolute',
                        width: 200,
                        height: 200,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, rgba(249,115,22,0) 70%)',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                      }}
                    />

                    {/* Center Brand Emblem */}
                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {/* Official StayBuddy Emblem (Roof + Pin + Smile Cradle) */}
                      <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'center' }}>
                        <StayBuddyIconMark
                          size={60}
                          colorScheme={theme === 'light' ? 'gradient' : 'white'}
                        />
                      </div>

                      {/* Brand Wordmark */}
                      <div style={{ display: 'flex', alignItems: 'baseline', fontSize: '2.1rem', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1 }}>
                        <span style={{ color: theme === 'light' ? '#0f172a' : '#ffffff' }}>Stay</span>
                        <span style={{ color: '#f97316' }}>Buddy</span>
                      </div>

                      {/* Tagline */}
                      <div
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          letterSpacing: '0.22em',
                          textTransform: 'uppercase',
                          color: theme === 'light' ? '#64748b' : '#94a3b8',
                          marginTop: 8,
                        }}
                      >
                        {slogan}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* BACK CARD */}
              {(activeSide === 'both' || activeSide === 'back') && (
                <div style={{ width: '100%', maxWidth: 520, perspective: 1000 }}>
                  <div className="no-print" style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Card Back Face (3.5&quot; × 2&quot;)</span>
                    <span style={{ color: '#f97316' }}>Contact & Credentials</span>
                  </div>

                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1.75 / 1',
                      background: theme === 'light' ? '#ffffff' : '#0b1120',
                      borderRadius: 16,
                      border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid #1e293b',
                      boxShadow: '0 20px 40px -15px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '20px 24px 16px 24px',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Top Right Orange Wave Accent (matching user example) */}
                    <div
                      style={{
                        position: 'absolute',
                        top: -15,
                        right: -15,
                        width: 90,
                        height: 70,
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        borderRadius: '0 0 0 60px',
                        opacity: 0.95,
                        pointerEvents: 'none',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        width: 105,
                        height: 80,
                        border: '3px solid #ffedd5',
                        borderRadius: '0 0 0 70px',
                        pointerEvents: 'none',
                        opacity: 0.7,
                      }}
                    />

                    {/* Bottom Left Orange Wave Accent (matching user example) */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: -10,
                        width: 90,
                        height: 50,
                        background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                        borderRadius: '0 50px 0 0',
                        opacity: 0.9,
                        pointerEvents: 'none',
                      }}
                    />

                    {/* TOP BADGE: "Book your perfect stay!" */}
                    <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', zIndex: 2 }}>
                      <div
                        style={{
                          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                          color: 'white',
                          padding: '6px 20px',
                          borderRadius: 24,
                          fontSize: '0.85rem',
                          fontWeight: 800,
                          letterSpacing: '0.02em',
                          boxShadow: '0 4px 12px rgba(234,88,12,0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                        }}
                      >
                        <StayBuddyIconMark size={16} colorScheme="white" />
                        <span>{badgeText}</span>
                      </div>
                    </div>

                    {/* MIDDLE SECTION: Personal & Contact Credentials */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2, padding: '0 10px' }}>
                      
                      {/* Left: Contact Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
                        <div>
                          <div style={{ fontSize: '1.15rem', fontWeight: 900, color: theme === 'light' ? '#0f172a' : '#f8fafc', lineHeight: 1.1 }}>
                            {name}
                          </div>
                          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                            {role}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                          {/* Website */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: theme === 'light' ? '#334155' : '#cbd5e1', fontWeight: 600 }}>
                            <span style={{ color: '#f97316' }}>🌐</span>
                            <span>{website}</span>
                          </div>

                          {/* Email */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: theme === 'light' ? '#334155' : '#cbd5e1', fontWeight: 600 }}>
                            <span style={{ color: '#f97316' }}>✉️</span>
                            <span>{email}</span>
                          </div>

                          {/* Phone */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: theme === 'light' ? '#334155' : '#cbd5e1', fontWeight: 700 }}>
                            <span style={{ color: '#f97316' }}>📞</span>
                            <span>{phone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: QR Code for Instant Web Booking */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <div
                          style={{
                            background: 'white',
                            padding: 6,
                            borderRadius: 10,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                          }}
                        >
                          {/* SVG QR Code representation */}
                          <svg width="68" height="68" viewBox="0 0 100 100" fill="#0f172a">
                            {/* Outer Finder 1 */}
                            <rect x="5" y="5" width="28" height="28" rx="4" fill="#0f172a" />
                            <rect x="10" y="10" width="18" height="18" rx="2" fill="white" />
                            <rect x="14" y="14" width="10" height="10" rx="1" fill="#f97316" />

                            {/* Outer Finder 2 */}
                            <rect x="67" y="5" width="28" height="28" rx="4" fill="#0f172a" />
                            <rect x="72" y="10" width="18" height="18" rx="2" fill="white" />
                            <rect x="76" y="14" width="10" height="10" rx="1" fill="#f97316" />

                            {/* Outer Finder 3 */}
                            <rect x="5" y="67" width="28" height="28" rx="4" fill="#0f172a" />
                            <rect x="10" y="72" width="18" height="18" rx="2" fill="white" />
                            <rect x="14" y="76" width="10" height="10" rx="1" fill="#f97316" />

                            {/* Data Blocks */}
                            <rect x="38" y="10" width="8" height="8" rx="1" />
                            <rect x="50" y="10" width="8" height="8" rx="1" />
                            <rect x="38" y="24" width="8" height="8" rx="1" />
                            <rect x="10" y="38" width="8" height="8" rx="1" />
                            <rect x="24" y="38" width="8" height="8" rx="1" />
                            <rect x="38" y="38" width="24" height="24" rx="4" fill="#ea580c" />
                            <rect x="44" y="44" width="12" height="12" rx="2" fill="white" />
                            <rect x="68" y="38" width="8" height="8" rx="1" />
                            <rect x="82" y="38" width="8" height="8" rx="1" />
                            <rect x="68" y="52" width="8" height="8" rx="1" />
                            <rect x="38" y="68" width="8" height="8" rx="1" />
                            <rect x="52" y="68" width="8" height="8" rx="1" />
                            <rect x="68" y="68" width="12" height="8" rx="1" />
                            <rect x="82" y="68" width="8" height="14" rx="1" />
                            <rect x="38" y="82" width="14" height="8" rx="1" />
                            <rect x="58" y="82" width="8" height="8" rx="1" />
                          </svg>
                        </div>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Scan to Book</span>
                      </div>
                    </div>

                    {/* BOTTOM SECTION: Social Icons & Solid Bottom Accent Bar */}
                    <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14 }}>
                      {/* Instagram */}
                      <span title="Instagram" style={{ width: 24, height: 24, borderRadius: '50%', background: theme === 'light' ? '#0f172a' : '#1e293b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                        📷
                      </span>
                      {/* Facebook */}
                      <span title="Facebook" style={{ width: 24, height: 24, borderRadius: '50%', background: theme === 'light' ? '#0f172a' : '#1e293b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                        f
                      </span>
                      {/* WhatsApp */}
                      <span title="WhatsApp" style={{ width: 24, height: 24, borderRadius: '50%', background: theme === 'light' ? '#0f172a' : '#1e293b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                        💬
                      </span>
                      {/* LinkedIn */}
                      <span title="LinkedIn" style={{ width: 24, height: 24, borderRadius: '50%', background: theme === 'light' ? '#0f172a' : '#1e293b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>
                        in
                      </span>
                    </div>

                    {/* Solid Bottom Orange Stripe (matching user example) */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 7,
                        background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Customizer Sidebar Form */}
          <div className="no-print card" style={{ padding: 24, background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>✏️</span> Customise Your Card
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Title / Designation
                </label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Official Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Website
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Front Slogan / Tagline
                </label>
                <input
                  type="text"
                  value={slogan}
                  onChange={(e) => setSlogan(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 4 }}>
                  Top Badge Callout
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={(e) => setBadgeText(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ paddingTop: 8 }}>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{
                    width: '100%',
                    padding: '12px 20px',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    border: 'none',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    color: 'white',
                    cursor: 'pointer',
                    boxShadow: '0 6px 18px rgba(234,88,12,0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <span>🖨️ Download / Print Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Print CSS Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          #visiting-card-print-area {
            display: flex !important;
            flex-direction: column !important;
            gap: 20mm !important;
            align-items: center !important;
            justify-content: center !important;
            padding: 20mm 0 !important;
          }
          #visiting-card-print-area > div {
            max-width: 88.9mm !important; /* Standard 3.5 in */
            width: 88.9mm !important;
            page-break-inside: avoid !important;
          }
          #visiting-card-print-area > div > div:last-child {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
          }
        }
        @media (max-width: 900px) {
          .visiting-card-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
