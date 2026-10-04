'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    if (status === 'authenticated') {
      fetchWishlist();
    }
  }, [status]);

  async function fetchWishlist() {
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        setHotels(data.wishlist || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function removeWishlist(hotelId: string) {
    // Optimistic removal
    setHotels(prev => prev.filter(h => h._id !== hotelId));
    try {
      await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId, action: 'remove' })
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid var(--brand-100)', borderTopColor: 'var(--brand-500)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '80vh', padding: 'var(--space-8) var(--space-4)', background: '#f8fafc' }}>
        <div className="container" style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ marginBottom: 'var(--space-8)' }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>My Wishlist ❤️</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Your saved properties for future stays</p>
          </div>

          {hotels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '100px 20px', background: 'white', borderRadius: 'var(--radius-xl)', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <div style={{ fontSize: '4rem', marginBottom: 20 }}>💔</div>
              <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', marginBottom: 10 }}>Your wishlist is empty</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 30 }}>Looks like you haven't saved any properties yet.</p>
              <Link href="/" className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: 'var(--radius-lg)' }}>
                Explore Hotels
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
              {hotels.map((hotel) => (
                <div key={hotel._id} style={{ background: 'white', borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                  
                  {/* Remove Button */}
                  <button 
                    onClick={() => removeWishlist(hotel._id)}
                    style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, background: 'rgba(255,255,255,0.9)', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: '#ef4444' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                  </button>

                  <div style={{ position: 'relative', height: 220 }}>
                    <img 
                      src={hotel.images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80'} 
                      alt={hotel.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                  
                  <div style={{ padding: 20, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>{hotel.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 16 }}>{hotel.city}, {hotel.country}</p>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
                      {hotel.amenities?.slice(0, 3).map((am: string) => (
                        <span key={am} style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.75rem', padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>{am}</span>
                      ))}
                    </div>

                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Starts from</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand-600)' }}>₹{hotel.rooms?.[0]?.priceDouble || 1999}</div>
                      </div>
                      <Link href={`/hotels/${hotel._id}`} className="btn btn-primary" style={{ padding: '8px 20px', borderRadius: 8, fontSize: '0.9rem' }}>
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
