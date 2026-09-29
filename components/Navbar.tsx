'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Logo from './Logo';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 200);
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
        position: 'sticky', top: 0, zIndex: 200,
        background: scrolled ? 'rgba(255,255,255,0.95)' : 'white',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: '1px solid var(--border)',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
        transition: 'all var(--transition-base)',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 68 }}>
          {/* Logo */}
          <div style={{ flex: 1, display: 'flex' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
              <Logo size="md" />
            </Link>
          </div>

          {/* Center Navbar Property Cards (Only visible when scrolled) */}
          <div style={{ 
            flex: 1, display: 'flex', justifyContent: 'center', 
            opacity: scrolled ? 1 : 0, 
            transform: scrolled ? 'translateY(0)' : 'translateY(-10px)',
            pointerEvents: scrolled ? 'auto' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} className="hide-mobile">
            <div className="hide-scrollbar" style={{ display: 'flex', gap: 0, justifyContent: 'center', overflowX: 'auto', borderRadius: 'var(--radius-xl)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', maxWidth: '100%', WebkitOverflowScrolling: 'touch' }}>
              {[
                { id: 'Hotel', label: 'Hotels', icon: '🏨' },
                { id: 'Resort', label: 'Resorts', icon: '🌴' },
                { id: 'Villa', label: 'Villas', icon: '🏡' },
                { id: 'Homestay', label: 'Homestays', icon: '🏘️' },
                { id: 'HolidayPackage', label: 'Packages', icon: '🎒' }
              ].map((card, index, array) => {
                const isLast = index === array.length - 1;
                return (
                  <Link key={card.id} href={`/hotels?propertyType=${card.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        flexShrink: 0,
                        background: 'white',
                        borderRight: isLast ? 'none' : '1px solid var(--border)',
                        padding: '6px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--brand-50)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'white';
                      }}
                    >
                      <span style={{ fontSize: '1.1rem' }}>{card.icon}</span>
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.8rem', letterSpacing: '0.02em' }}>{card.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Nav */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }} className="hide-mobile">
            {!session && (
              <>
                <Link href="/login" className="btn btn-ghost" style={{ fontWeight: 500 }}>List Your Hotel</Link>
                <Link href="/login" className="btn btn-outline" style={{ border: '2px solid var(--border)' }}>Log In</Link>
                <Link href="/login" className="btn btn-primary">Get Started</Link>
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
                      width: 220, zIndex: 100, overflow: 'hidden',
                    }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{session.user?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{session.user?.email}</div>
                        <span className="badge badge-primary" style={{ marginTop: 4 }}>{role}</span>
                      </div>
                      <div style={{ padding: '8px 0' }}>
                        {[
                          ...(role === 'admin' ? [{ label: 'Admin Panel', href: '/admin', icon: '👑' }] : []),
                          ...(role === 'partner' ? [{ label: 'Partner Dashboard', href: '/partner/dashboard', icon: '⊞' }] : []),
                          { label: 'My Profile', href: '/profile', icon: '👤' },
                          { label: 'My Wallet', href: '/wallet', icon: '💰' },
                          { label: 'My Bookings', href: '/my-bookings', icon: '📋' },
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

          {/* Mobile Burger */}
          <button className="hide-desktop" onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M6 18L18 6M6 6l12 12"/> : <path d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div style={{ borderTop: '1px solid var(--border)', padding: 'var(--space-4)', background: 'var(--surface)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {!session ? (
                <>
                  <Link href="/login" className="btn btn-outline" onClick={() => setMenuOpen(false)}>Log In</Link>
                  <Link href="/login" className="btn btn-primary" onClick={() => setMenuOpen(false)}>Get Started</Link>
                </>
              ) : (
                <>
                  <Link href={getDashboardLink()} className="btn btn-secondary" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                  <button className="btn btn-danger" onClick={() => signOut({ callbackUrl: '/' })}>Sign Out</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      <style>{`.hide-desktop { display: none; } @media (max-width: 768px) { .hide-desktop { display: flex; } .hide-mobile { display: none !important; } }`}</style>
    </>
  );
}
