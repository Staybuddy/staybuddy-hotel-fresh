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
  
  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewBooking, setReviewBooking] = useState<any>(null);
  const [reviewData, setReviewData] = useState({ rating: 5, title: '', comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');

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

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewBooking) return;
    setReviewLoading(true);
    setReviewError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: reviewBooking._id,
          hotelId: reviewBooking.hotelId._id,
          customerId: (session?.user as any)?.id,
          guestName: (session?.user as any)?.name || 'Guest',
          rating: reviewData.rating,
          title: reviewData.title,
          comment: reviewData.comment
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');
      
      setReviewModalOpen(false);
      setReviewBooking(null);
      setReviewData({ rating: 5, title: '', comment: '' });
      fetchBookings(); // Refresh to update isReviewed status
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setReviewLoading(false);
    }
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
                    {(booking.status === 'completed' || booking.status === 'confirmed') && booking.paymentStatus === 'paid' && !booking.isReviewed && (
                      <button className="btn btn-sm" style={{ background: '#f59e0b', color: 'white', width: '100%', border: 'none', cursor: 'pointer' }} onClick={() => { setReviewBooking(booking); setReviewModalOpen(true); }}>⭐ Write Review</button>
                    )}
                    {booking.isReviewed && (
                      <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>✓ Reviewed</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewModalOpen && reviewBooking && (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }} onClick={() => setReviewModalOpen(false)} />
          <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'white', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', zIndex: 1000, width: '90%', maxWidth: 500, boxShadow: 'var(--shadow-xl)' }}>
            <h2 style={{ marginBottom: 16 }}>Review {reviewBooking.hotelId?.name}</h2>
            {reviewError && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{reviewError}</div>}
            <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Rating</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1,2,3,4,5].map(num => (
                    <button type="button" key={num} onClick={() => setReviewData(p => ({...p, rating: num}))} style={{ background: 'none', border: 'none', fontSize: '2rem', cursor: 'pointer', opacity: reviewData.rating >= num ? 1 : 0.3 }}>
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input type="text" className="form-input" required placeholder="Summarize your experience" value={reviewData.title} onChange={e => setReviewData(p => ({...p, title: e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Review</label>
                <textarea className="form-input" rows={4} required placeholder="Tell us what you liked or disliked" value={reviewData.comment} onChange={e => setReviewData(p => ({...p, comment: e.target.value}))} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn btn-outline" onClick={() => setReviewModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={reviewLoading}>{reviewLoading ? 'Submitting...' : 'Submit Review'}</button>
              </div>
            </form>
          </div>
        </>
      )}

    </div>
  );
}
