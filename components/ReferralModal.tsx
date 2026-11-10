'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface ReferralModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
  referralCount?: number;
  walletBalance?: number;
  isAuthenticated: boolean;
}

export default function ReferralModal({
  isOpen,
  onClose,
  referralCode,
  referralCount = 0,
  walletBalance = 0,
  isAuthenticated
}: ReferralModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const maxReferrals = 5;
  const rewardPerReferral = 20;
  const earnedAmount = Math.min(referralCount, maxReferrals) * rewardPerReferral;
  const remainingSlots = Math.max(0, maxReferrals - referralCount);

  const activeCode = referralCode || 'SBSTAY20';
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${activeCode}` : `https://staybuddy.in/?ref=${activeCode}`;
  const whatsappMessage = `Hey! Book your hotel on StayBuddy and get flat discounts with verified stays: ${shareUrl} (Referral Code: ${activeCode})`;
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  const handleCopyCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activeCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.82)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px',
      overflowY: 'auto'
    }}>
      <style>{`
        @keyframes modalPopUp {
          0% { transform: scale(0.92) translateY(16px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes giftGlow {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.08) rotate(-4deg); }
          75% { transform: scale(1.08) rotate(4deg); }
        }
      `}</style>

      <div style={{
        background: '#ffffff',
        borderRadius: 24,
        maxWidth: 580,
        width: '100%',
        maxHeight: '94vh',
        overflowY: 'auto',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
        border: '1.5px solid #fed7aa',
        animation: 'modalPopUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative'
      }}>

        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
          padding: '24px 24px 18px',
          borderBottom: '1px solid #fed7aa',
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16
        }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              boxShadow: '0 6px 18px rgba(234, 88, 12, 0.35)',
              animation: 'giftGlow 4s ease-in-out infinite',
              flexShrink: 0
            }}>
              🎁
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 900, color: '#0f172a' }}>
                  Refer & Earn ₹20
                </h3>
                <span style={{
                  background: '#dcfce7',
                  color: '#15803d',
                  border: '1px solid #86efac',
                  padding: '2px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  ACTIVE REWARD
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
                Share your referral code. Earn ₹20 into your StayBuddy wallet for each friend!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'white',
              border: '1px solid #fed7aa',
              color: '#64748b',
              width: 32,
              height: 32,
              borderRadius: '50%',
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px' }}>

          {/* 5-Slot Referral Allocation Meter */}
          <div style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  Max 5 Referrals Cap
                </span>
                <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f172a', marginTop: 1 }}>
                  {referralCount} of 5 Slots Claimed
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Total Earnable</span>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ea580c' }}>
                  ₹{earnedAmount} / ₹100
                </div>
              </div>
            </div>

            {/* 5 Visual Slot Indicators */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {[0, 1, 2, 3, 4].map(idx => {
                const isClaimed = idx < referralCount;
                return (
                  <div
                    key={idx}
                    style={{
                      background: isClaimed ? '#dcfce7' : '#ffffff',
                      border: isClaimed ? '1.5px solid #22c55e' : '1.5px dashed #cbd5e1',
                      borderRadius: 10,
                      padding: '8px 4px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 2
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{isClaimed ? '✅' : '⚪'}</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: isClaimed ? '#15803d' : '#64748b' }}>
                      {isClaimed ? '+₹20' : `Slot ${idx + 1}`}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 10, textAlign: 'center' }}>
              {remainingSlots > 0 
                ? `🎉 You still have ${remainingSlots} referral slot${remainingSlots === 1 ? '' : 's'} open to earn ₹${remainingSlots * 20} cash!`
                : '🏆 Amazing! You have completed all 5 referral slots (₹100 Max Cap Reached)!'}
            </div>
          </div>

          {/* Referral Code & Share Link Card */}
          {isAuthenticated ? (
            <div style={{
              background: '#ffffff',
              border: '2px dashed #f97316',
              borderRadius: 16,
              padding: '18px 20px',
              marginBottom: 20
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                Your Permanent Referral ID
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#fff7ed',
                border: '1px solid #fed7aa',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 14
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    YOUR PERMANENT REFERRAL ID
                  </div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#ea580c', letterSpacing: '0.06em', marginTop: 2 }}>
                    {activeCode}
                  </div>
                </div>
                <span style={{
                  fontSize: '0.72rem',
                  background: '#ffedd5',
                  color: '#c2410c',
                  border: '1px solid #fed7aa',
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontWeight: 800
                }}>
                  Active ID
                </span>
              </div>

              {/* Action Buttons: WhatsApp & Direct Booking Link (Shares Direct Link with Referral ID) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#25d366',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 12,
                    padding: '13px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.35)'
                  }}
                >
                  <span>💬</span>
                  <span>Share on WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  style={{
                    background: copiedLink ? '#16a34a' : '#f8fafc',
                    color: copiedLink ? '#ffffff' : '#0f172a',
                    border: copiedLink ? '1.5px solid #16a34a' : '1.5px solid #cbd5e1',
                    borderRadius: 12,
                    padding: '13px',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>🔗</span>
                  <span>{copiedLink ? '✓ Link Copied!' : 'Copy Booking Link'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#fff7ed',
              border: '1px solid #fed7aa',
              borderRadius: 16,
              padding: '20px',
              textAlign: 'center',
              marginBottom: 20
            }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🔐</div>
              <h4 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '1.05rem', fontWeight: 800 }}>
                Sign In to Unlock Your Referral ID
              </h4>
              <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: '0.85rem' }}>
                Login with Google to generate your personal referral code and track your ₹20 per friend wallet rewards!
              </p>
              <Link
                href="/login"
                className="btn btn-primary"
                style={{ padding: '10px 24px', fontWeight: 800, borderRadius: 10 }}
              >
                Sign In to Generate Referral Code →
              </Link>
            </div>
          )}

          {/* How It Works & Reward Policy */}
          <div style={{
            background: '#f8fafc',
            border: '1.5px solid #e2e8f0',
            borderRadius: 16,
            padding: '16px 18px'
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>💡</span>
              <span>How Refer & Earn Works:</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.84rem', color: '#475569' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.74rem', flexShrink: 0 }}>
                  1
                </span>
                <div>
                  <strong>Share Your Code:</strong> Send your personal referral code or booking link to friends and family.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.74rem', flexShrink: 0 }}>
                  2
                </span>
                <div>
                  <strong>Friend Books & Stays:</strong> Your friend uses your referral code to book a verified hotel stay on StayBuddy.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.74rem', flexShrink: 0 }}>
                  3
                </span>
                <div>
                  <strong>Reward Credited on Checkout:</strong> Your ₹20 cash reward is deposited directly into your StayBuddy Wallet <strong>after the guest completes their stay</strong>.
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#ffedd5', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.74rem', flexShrink: 0 }}>
                  4
                </span>
                <div>
                  <strong>100% Usable Cash:</strong> Use your wallet balance on any hotel booking or earn up to ₹100 across 5 referrals!
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

