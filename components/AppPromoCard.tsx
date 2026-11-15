'use client';
import React from 'react';

export default function AppPromoCard() {
  return (
    <section className="section" style={{ padding: '0 var(--space-6)', marginBottom: 'var(--space-8)' }}>
      <div className="container">
        <div style={{
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          color: 'white',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          {/* Content Area */}
          <div style={{ padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px', zIndex: 2, position: 'relative' }}>
            <div style={{ flex: '1 1 400px' }}>
              <div style={{ display: 'inline-block', padding: '6px 12px', background: 'rgba(249,115,22,0.1)', color: 'var(--brand-500)', borderRadius: '16px', fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                Experience More
              </div>
              <h2 style={{ fontSize: '1.75rem', margin: '0 0 8px 0', color: 'white', fontWeight: 900, letterSpacing: '-0.02em' }}>
                Take StayBuddy Everywhere
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
                Download our mobile app to unlock exclusive deals and manage your bookings on the go.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'white', color: 'black', border: 'none', padding: '10px 20px', borderRadius: 'var(--radius-lg)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'transform var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <span style={{ fontSize: '1.25rem' }}>🍎</span> App Store
              </button>
              <button style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: 'var(--radius-lg)', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', transition: 'all var(--transition-fast)' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1)'; }}>
                <span style={{ fontSize: '1.25rem' }}>🤖</span> Google Play
              </button>
            </div>
          </div>

          {/* Marquee Animation */}
          <div style={{
            position: 'relative',
            padding: '24px 0',
            background: 'var(--brand-500)',
            overflow: 'hidden',
            display: 'flex',
            whiteSpace: 'nowrap'
          }}>
            <div style={{ display: 'flex', gap: 40, animation: 'scroll-left 20s linear infinite' }}>
              {[...Array(2)].map((_, i) => (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '1.25rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>✨ Exclusive Mobile Deals</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '1.25rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🚀 Instant Booking</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '1.25rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔔 Real-time Alerts</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '1.25rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📍 Location Search</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '1.25rem', fontWeight: 800, color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💼 Partner Dashboard</div>
                </React.Fragment>
              ))}
            </div>
          </div>

          <style jsx>{`
            @keyframes scroll-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </div>
      </div>
    </section>
  );
}
