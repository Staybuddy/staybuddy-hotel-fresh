'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function PartnerLoginPage() {
  const router = useRouter();
  
  // Phone OTP State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  // App State - Restricted to B2B
  const [role, setRole] = useState<'partner' | 'admin'>('partner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    // Set a short-lived cookie so NextAuth knows this is a partner login attempt
    document.cookie = 'intended_role=partner; path=/; max-age=300';
    await signIn('google', { callbackUrl: '/partner' });
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setLoading(true);
    
    // Simulate sending OTP
    setTimeout(() => {
      setStep('otp');
      setLoading(false);
    }, 800);
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('phone-otp', {
      redirect: false,
      phone,
      otp,
      role, // Pass 'partner' or 'admin'
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      router.push('/partner'); // Default route for partners
      router.refresh();
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <Navbar />
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 'var(--space-6)',
        background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--surface) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Background Elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '40vw', height: '40vw', background: 'var(--brand-100)', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.5, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '30vw', height: '30vw', background: 'var(--brand-50)', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.5, pointerEvents: 'none' }} />

        <div className="card fade-in" style={{ 
          width: '100%', 
          maxWidth: 440, 
          padding: 'var(--space-8)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
          border: '1px solid rgba(249,115,22,0.1)',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 12, display: 'inline-block', padding: '16px', background: 'var(--brand-50)', borderRadius: '50%', color: 'var(--brand-600)' }}>
              {role === 'admin' ? '🛡️' : '💼'}
            </div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 8, color: 'var(--brand-900)' }}>Partner & Admin Portal</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Secure access for StayBuddy management</p>
          </div>

          {/* B2B Role Selector */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 'var(--space-6)', background: 'var(--bg-secondary)', padding: 6, borderRadius: 'var(--radius-lg)' }}>
            {(['partner', 'admin'] as const).map(r => (
              <button key={r} type="button" onClick={() => setRole(r)}
                style={{ 
                  flex: 1, padding: '10px 0', border: 'none', 
                  background: role === r ? 'var(--brand-500)' : 'transparent', 
                  color: role === r ? 'white' : 'var(--text-muted)', 
                  borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '0.875rem', 
                  textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer', 
                  boxShadow: role === r ? '0 4px 12px rgba(249,115,22,0.3)' : 'none', 
                  transition: 'all var(--transition-fast)' 
                }}>
                {r} Login
              </button>
            ))}
          </div>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-6)', padding: '12px', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {/* Google Auth */}
          <button 
            type="button" 
            onClick={handleGoogleSignIn} 
            disabled={loading}
            className="btn btn-outline" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 'var(--space-5)', padding: '12px', borderColor: '#e2e8f0', color: 'var(--text-primary)', background: 'white' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--space-5) 0', color: 'var(--text-muted)' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ padding: '0 12px', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or continue with phone</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Phone Auth */}
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--brand-900)' }}>Registered Phone Number</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 12px', display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontWeight: 600 }}>+91</div>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    style={{ flex: 1 }}
                    required
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? <div className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Send OTP securely'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--brand-900)' }}>
                  <span>Enter Security OTP</span>
                  <button type="button" onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: '0.8rem', cursor: 'pointer' }}>Change number</button>
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 700 }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? <div className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Verify & Access Portal'}
              </button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 'var(--space-6)' }}>
            <Link href="/login" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
              Not a partner? <span style={{ color: 'var(--brand-600)', fontWeight: 600 }}>Go to Customer Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
