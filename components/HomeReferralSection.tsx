'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReferralModal from './ReferralModal';

export default function HomeReferralSection() {
  const { data: session, status } = useSession();
  const [walletData, setWalletData] = useState<{
    referralCode?: string;
    referralCount?: number;
    walletBalance?: number;
    maxReferrals?: number;
    rewardAmount?: number;
  }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/wallet')
        .then(r => r.json())
        .then(data => {
          if (data) setWalletData(data);
        })
        .catch(e => console.error(e));
    }
  }, [status]);

  const activeCode = walletData.referralCode || (session?.user?.name ? `SB${session.user.name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}20` : 'SBSTAY20');
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${activeCode}` : 'https://staybuddy.in';
  const message = `Hey! Use my StayBuddy link to book your hotel & get flat discounts: ${shareUrl} (Referral Code: ${activeCode})`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  return (
    <>
      <section className="container" style={{ margin: '0 auto 22px', padding: '0 16px' }}>
        <div
          onClick={handleOpenModal}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenModal(); }}
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
            border: '1.5px dashed #f97316',
            borderRadius: '20px',
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '18px',
            boxShadow: '0 8px 30px rgba(234, 88, 12, 0.08)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'pointer',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(234, 88, 12, 0.14)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(234, 88, 12, 0.08)';
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flex: '1 1 320px' }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #ffedd5, #fed7aa)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.15)'
            }}>
              🎁
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>Refer & Earn ₹20</h3>
                <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', padding: '2px 8px', borderRadius: 12, fontWeight: 800 }}>
                  ACTIVE REWARD • UP TO 5 FRIENDS
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                Invite your friends to StayBuddy and earn ₹20 into your wallet on every completed stay!
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal();
              }}
              style={{
                background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                color: '#ffffff',
                border: 'none',
                padding: '13px 26px',
                borderRadius: 14,
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(234, 88, 12, 0.35)',
                transition: 'all 0.2s ease',
              }}
            >
              <span>Refer a Friend</span>
              <span style={{ fontSize: '1.1rem' }}>→</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive 5-Slot Refer & Earn Modal */}
      <ReferralModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        referralCode={activeCode}
        referralCount={walletData.referralCount || 0}
        walletBalance={walletData.walletBalance || 0}
        isAuthenticated={status === 'authenticated'}
      />
    </>
  );
}
