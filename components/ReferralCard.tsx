'use client';

import React from 'react';

export default function ReferralCard({ referralCode }: { referralCode: string }) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${referralCode}` : '';
  const message = `Hey! Use my StayBuddy link to book a hotel and get the best deals: ${shareUrl}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div style={{
      background: 'linear-gradient(135deg, var(--brand-50), white)',
      border: '1px solid var(--brand-200)',
      borderRadius: 'var(--radius-xl)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: '0 12px 32px rgba(249, 115, 22, 0.08)'
    }}>
      {/* Decorative blobs */}
      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, background: 'var(--brand-100)', borderRadius: '50%', filter: 'blur(20px)', opacity: 0.6 }} />
      <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, background: 'var(--brand-200)', borderRadius: '50%', filter: 'blur(16px)', opacity: 0.4 }} />
      
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--brand-500)',
            color: 'white',
            width: 48,
            height: 48,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>Refer & Earn ₹20</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Get ₹20 real money when your friend makes their first booking.</p>
          </div>
        </div>

        <div style={{
          background: 'white',
          border: '1px dashed var(--brand-400)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block' }}>YOUR REFERRAL CODE</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--brand-600)', letterSpacing: '1px' }}>{referralCode}</strong>
          </div>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#25D366',
              color: 'white',
              padding: '10px 16px',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 3.4L3 21" /></svg>
            Share on WhatsApp
          </a>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
          Valid for up to 5 successful referrals (Max ₹100).
        </p>
      </div>
    </div>
  );
}
