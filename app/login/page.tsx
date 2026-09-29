'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const router = useRouter();
  
  // Phone OTP State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  
  // App State
  const role = 'customer';
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    // Role will be mapped automatically if user exists, else defaults to 'customer'
    // in the NextAuth configuration for Google. 
    await signIn('google', { callbackUrl: '/' });
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    setError('');
    setLoading(true);
    
    // Simulate sending OTP (In a real app, call your SMS API here)
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
      role, // Pass role in case it's a new registration
    });

    setLoading(false);

    if (res?.error) {
      setError(res.error);
    } else {
      router.push('/');
      router.refresh();
    }
  }

  return (
    <div>
      <Navbar />
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: 'var(--space-6)', background: 'var(--bg-secondary)' }}>
        <div className="card fade-in" style={{ width: '100%', maxWidth: 420, padding: 'var(--space-8)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>👋</div>
            <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>Welcome to StayBuddy</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Sign in or create an account to book your stay</p>
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
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 'var(--space-5)', padding: '12px', borderColor: '#e2e8f0', color: 'var(--text-primary)' }}
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
                <label className="form-label">Phone Number</label>
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
                {loading ? <div className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Enter OTP Code</span>
                  <button type="button" onClick={() => setStep('phone')} style={{ background: 'none', border: 'none', color: 'var(--brand-600)', fontSize: '0.8rem', cursor: 'pointer' }}>Change number</button>
                </label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="123456 (Use this for testing)"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.2rem', fontWeight: 700 }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? <div className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Verify & Login'}
              </button>
            </form>
          )}

          <p style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            By continuing, you agree to StayBuddy's <a href="#" style={{ color: 'var(--brand-600)' }}>Terms of Service</a> and <a href="#" style={{ color: 'var(--brand-600)' }}>Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
