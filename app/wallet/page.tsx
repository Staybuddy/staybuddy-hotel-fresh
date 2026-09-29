'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import ReferralCard from '@/components/ReferralCard';

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') fetchWallet();
  }, [status]);

  async function fetchWallet() {
    try {
      const res = await fetch('/api/wallet');
      const data = await res.json();
      setWalletData(data);
    } catch (e) { console.error('Failed to fetch wallet'); }
    finally { setLoading(false); }
  }

  async function handleWithdraw() {
    if (!walletData || walletData.walletBalance <= 0) return;
    const amount = prompt(`Enter amount to withdraw (Max: ₹${walletData.walletBalance}):`, walletData.walletBalance.toString());
    if (!amount) return;
    
    const parsedAmount = parseInt(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > walletData.walletBalance) {
      alert('Invalid amount');
      return;
    }

    setWithdrawing(true);
    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount })
      });
      const data = await res.json();
      if (data.success) {
        alert('Withdrawal request submitted! It will be processed shortly.');
        fetchWallet();
      } else {
        alert(data.error || 'Withdrawal failed');
      }
    } catch (e) {
      alert('An error occurred');
    } finally {
      setWithdrawing(false);
    }
  }

  if (status === 'loading' || loading) return (
    <div><Navbar /><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div></div>
  );

  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-6)', maxWidth: 800 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-8)', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: 8 }}>My Wallet</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Manage your referral earnings and withdrawals.</p>
          </div>
          
          {/* Balance Card */}
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            padding: '20px 32px',
            borderRadius: 'var(--radius-xl)',
            textAlign: 'center',
            minWidth: 200
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>Available Balance</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>₹{walletData?.walletBalance || 0}</div>
            <button 
              className="btn btn-primary" 
              onClick={handleWithdraw} 
              disabled={withdrawing || !walletData || walletData.walletBalance <= 0}
              style={{ width: '100%' }}
            >
              {withdrawing ? 'Processing...' : 'Withdraw Funds'}
            </button>
          </div>
        </div>

        {/* Referral Card section */}
        <div style={{ marginBottom: 'var(--space-8)' }}>
          <ReferralCard referralCode={walletData?.referralCode || 'STAYBUDDY'} />
        </div>

        {/* Transaction History */}
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-4)' }}>Transaction History</h2>
          
          {!walletData?.transactions || walletData.transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border)', borderRadius: 'var(--radius-xl)', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>💸</div>
              <h3>No transactions yet</h3>
              <p>Refer friends to start earning real money!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {walletData.transactions.map((tx: any) => (
                <div key={tx._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 24px',
                  background: 'white',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: tx.type === 'referral_reward' ? 'var(--brand-100)' : '#f3f4f6',
                      color: tx.type === 'referral_reward' ? 'var(--brand-600)' : '#4b5563'
                    }}>
                      {tx.type === 'referral_reward' ? '🎁' : '🏦'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.description}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span>{new Date(tx.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span style={{ textTransform: 'capitalize', color: tx.status === 'completed' ? '#10b981' : tx.status === 'pending' ? '#f59e0b' : '#ef4444' }}>
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div style={{ 
                    fontSize: '1.2rem', 
                    fontWeight: 700, 
                    color: tx.type === 'referral_reward' ? '#10b981' : '#111827'
                  }}>
                    {tx.type === 'referral_reward' ? '+' : '-'}₹{tx.amount}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
