'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Image from 'next/image';

export default function MyBookingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') fetchBookings();
  }, [status]);

  async function fetchBookings() {
    const customerId = (session?.user as any)?.id;
    try {
      const res = await fetch(`/api/bookings?customerId=${customerId}`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (e) { setBookings([]); }
    finally { setLoading(false); }
  }

  async function cancelBooking(id: string) {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    fetchBookings();
  }

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  if (status === 'loading' || loading) return (
    <div><Navbar /><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" style={{ width: 48, height: 48 }} /></div></div>
  );

  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-6)', maxWidth: 900 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
          <div>
            <h1>My Bookings</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{bookings.length} total booking{bookings.length !== 1 ? 's' : ''}</p>
          </div>
          <Link href="/hotels" className="btn btn-primary">+ Book a Hotel</Link>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-6)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--space-4)' }}>
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '6px 16px', borderRadius: 'var(--radius-full)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', textTransform: 'capitalize', transition: 'all var(--transition-fast)', background: filter === f ? 'var(--brand-500)' : 'var(--bg-secondary)', color: filter === f ? 'white' : 'var(--text-secondary)' }}>
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📋</div>
            <h3>No bookings {filter !== 'all' ? `with status "${filter}"` : 'yet'}</h3>
            <p style={{ marginTop: 8 }}>Ready to plan your next trip?</p>
            <Link href="/hotels" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-flex' }}>Explore Hotels →</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {filtered.map(booking => (
              <div key={booking._id} className="card" style={{ display: 'grid', gridTemplateColumns: booking.hotelId?.images?.[0] ? '120px 1fr auto' : '1fr auto', gap: 'var(--space-4)', alignItems: 'center' }}>
                {booking.hotelId?.images?.[0] && (
                  <Image src={booking.hotelId.images[0]} alt={booking.hotelId.name} width={120} height={90} style={{ objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                )}
                <div className="card-body" style={{ padding: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1rem' }}>{booking.hotelId?.name || 'Hotel'}</h3>
                    <span className={`badge ${booking.status === 'confirmed' ? 'badge-success' : booking.status === 'cancelled' ? 'badge-danger' : booking.status === 'completed' ? 'badge-info' : 'badge-warning'}`}>{booking.status}</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 8 }}>📍 {booking.hotelId?.city}</div>
                  <div style={{ display: 'flex', gap: 24, fontSize: '0.875rem', flexWrap: 'wrap' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Room:</span> <strong>{booking.roomId?.type}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Check-in:</span> <strong>{new Date(booking.checkIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Check-out:</span> <strong>{new Date(booking.checkOut).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Nights:</span> <strong>{booking.nights}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Guests:</span> <strong>{booking.guests}</strong></div>
                  </div>
                </div>
                <div style={{ padding: 'var(--space-4)', textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-600)', marginBottom: 4 }}>₹{booking.totalPrice?.toLocaleString()}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                    <span className={`badge ${booking.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>{booking.paymentStatus}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((booking.hotelId?.name || '') + " " + (booking.hotelId?.city || ''))}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{flex: 1, textAlign: 'center', padding: '6px 10px'}}>🗺️ Directions</a>
                      <Link href={`/hotels/${booking.hotelId?._id}`} className="btn btn-secondary btn-sm" style={{flex: 1, textAlign: 'center', padding: '6px 10px'}}>View Hotel</Link>
                    </div>
                    {booking.status === 'confirmed' && booking.paymentStatus === 'paid' && (
                      <Link href={`/invoice/${booking._id}`} className="btn btn-primary btn-sm" style={{width: '100%', textAlign: 'center'}}>📄 Tax Invoice</Link>
                    )}
                    {booking.status === 'pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => cancelBooking(booking._id)} style={{width: '100%'}}>Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
