'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HomeReferralSection() {
  const { data: session, status } = useSession();
  const [refCode, setRefCode] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/wallet')
        .then(r => r.json())
        .then(data => {
          if (data.referralCode) setRefCode(data.referralCode);
        })
        .catch(e => console.error(e));
    }
  }, [status]);

  if (status === 'loading') return null;

  if (status === 'unauthenticated') {
    return (
      <section className="container" style={{ margin: 'var(--space-6) auto' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--brand-50), white)', border: '1px solid var(--brand-200)', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '2.5rem' }}>🎁</div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Refer & Earn ₹20</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Login to invite your friends and earn real money to your wallet.</p>
            </div>
          </div>
          <Link href="/login" className="btn btn-primary" style={{ padding: '10px 20px', whiteSpace: 'nowrap' }}>Login to Refer</Link>
        </div>
      </section>
    );
  }

  if (!refCode) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${refCode}` : '';
  const message = `Hey! Use my StayBuddy link to book a hotel and get the best deals: ${shareUrl}`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <section className="container" style={{ margin: 'var(--space-6) auto' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--brand-50), white)', border: '1px dashed var(--brand-400)', borderRadius: 'var(--radius-xl)', padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', boxShadow: '0 8px 24px rgba(249, 115, 22, 0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '2.5rem' }}>🎁</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)' }}>Refer & Earn ₹20</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Share your code <strong style={{ color: 'var(--brand-600)' }}>{refCode}</strong> and earn ₹20 on their first booking.</p>
          </div>
        </div>
        <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ background: '#25D366', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)', textDecoration: 'none' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 3.4L3 21" /></svg>
          Share on WhatsApp
        </a>
      </div>
    </section>
  );
}
