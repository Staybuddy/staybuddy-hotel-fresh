'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Navbar({ middleContent, extendedContent }: { middleContent?: React.ReactNode, extendedContent?: React.ReactNode }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const role = (session?.user as any)?.role;

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin';
    if (role === 'partner') return '/partner';
    return '/my-bookings';
  };

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 999,
        background: 'white',
        borderBottom: scrolled ? 'none' : '1px solid var(--border)',
        boxShadow: scrolled ? '0 4px 20px rgba(0,0,0,0.08)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div className="container" style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          {/* Logo */}
          <div style={{ flex: 1, display: 'flex' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Logo size="md" />
            </Link>
          </div>

          {/* MIDDLE SECTION - Appears when scrolled (Hidden on Mobile) */}
          <div className="hide-mobile" style={{ flex: 2, display: 'flex', justifyContent: 'center', opacity: scrolled ? 1 : 0, transition: 'opacity 0.3s ease', pointerEvents: scrolled ? 'auto' : 'none' }}>
            {middleContent}
          </div>

          {/* Right Nav */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            {!session && (
              <>
                <Link href="/login" className="btn btn-ghost hide-mobile" style={{ fontWeight: 500 }}>List Your Hotel</Link>
                <Link href="/login" className="btn btn-outline" style={{ border: '2px solid var(--border)' }}>Log In</Link>
                <Link href="/login" className="btn btn-primary hide-mobile">Get Started</Link>
              </>
            )}
            {session && (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 12px 6px 6px', borderRadius: 'var(--radius-full)',
                    border: '2px solid var(--border)', background: 'var(--bg-primary)',
                    cursor: 'pointer', transition: 'all var(--transition-fast)',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--brand-400), var(--brand-600))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '0.875rem',
                  }}>
                    {session.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{session.user?.name?.split(' ')[0]}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--text-muted)' }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {profileOpen && (
                  <>
                    <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setProfileOpen(false)} />
                    <div style={{
                      position: 'absolute', right: 0, top: 'calc(100% + 8px)',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-xl)',
                      width: 240, minWidth: 240, zIndex: 100, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{session.user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user?.email}</div>
                        <span className="badge badge-primary" style={{ marginTop: 4 }}>{role}</span>
                      </div>
                      <div style={{ padding: '8px 0' }}>
                        {[
                          ...(role === 'admin' ? [{ label: 'Admin Panel', href: '/admin', icon: '👑' }] : []),
                          ...(role === 'partner' ? [{ label: 'Partner Dashboard', href: '/partner/dashboard', icon: '⊞' }] : []),
                          { label: 'My Profile', href: '/profile', icon: '👤' },
                          { label: 'My Wallet', href: '/wallet', icon: '💰' },
                          { label: 'My Bookings', href: '/my-bookings', icon: '📋' },
                          { label: 'My Wishlist', href: '/wishlist', icon: '❤️' },
                        ].map(item => (
                          <Link key={item.href} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', fontSize: '0.875rem', color: 'var(--text-primary)', transition: 'background var(--transition-fast)' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            onClick={() => setProfileOpen(false)}>
                            <span>{item.icon}</span> {item.label}
                          </Link>
                        ))}
                        <div style={{ borderTop: '1px solid var(--border)', margin: '8px 0' }} />
                        <button
                          onClick={() => { signOut({ callbackUrl: '/' }); setProfileOpen(false); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', fontSize: '0.875rem', color: 'var(--danger)', width: '100%', background: 'none', border: 'none', cursor: 'pointer', transition: 'background var(--transition-fast)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#fee2e2')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span>🚪</span> Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Extended Sticky Content */}
        {extendedContent && scrolled && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: '16px 0', animation: 'fadeIn 0.2s ease-out' }}>
            <div className="container" style={{ padding: '0 16px' }}>
              {extendedContent}
            </div>
          </div>
        )}
      </nav>
      <style>{`.hide-desktop { display: none; } @media (max-width: 768px) { .hide-desktop { display: flex; } .hide-mobile { display: none !important; } }`}</style>
    </>
  );
}
