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

  // Payment Recheck State
  const [recheckingId, setRecheckingId] = useState<string | null>(null);
  const [recheckStatusMsg, setRecheckStatusMsg] = useState<{ text: string; type: 'success' | 'info' | 'warning' } | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') fetchBookings();
  }, [status]);

  async function fetchBookings(showLoader = true) {
    const customerId = (session?.user as any)?.id;
    if (showLoader) setLoading(true);
    try {
      const res = await fetch(`/api/bookings?customerId=${customerId}`);
      const data = await res.json();
      const list = data.bookings || [];
      setBookings(list);

      // Auto-recheck pending bookings in the background with Razorpay
      const hasPending = list.some((b: any) => b.status === 'pending' || b.paymentStatus === 'pending');
      if (hasPending && customerId) {
        fetch('/api/payments/recheck', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId })
        })
          .then(r => r.json())
          .then(recheckData => {
            if (recheckData.verified && recheckData.verifiedCount > 0) {
              setRecheckStatusMsg({
                text: `🎉 Verified ${recheckData.verifiedCount} payment(s) from Razorpay! Your booking is now confirmed.`,
                type: 'success'
              });
              // Refresh bookings to reflect new confirmed status
              fetch(`/api/bookings?customerId=${customerId}`)
                .then(r => r.json())
                .then(newData => setBookings(newData.bookings || []));
            }
          })
          .catch(() => {});
      }
    } catch (e) { 
      setBookings([]); 
    } finally { 
      if (showLoader) setLoading(false); 
    }
  }

  async function verifyPaymentStatus(bookingId: string) {
    setRecheckingId(bookingId);
    setRecheckStatusMsg({ text: 'Checking Razorpay for your payment...', type: 'info' });
    try {
      const res = await fetch('/api/payments/recheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      const data = await res.json();
      if (data.verified) {
        setRecheckStatusMsg({
          text: '🎉 Payment successfully verified from Razorpay! Your booking is now confirmed.',
          type: 'success'
        });
        await fetchBookings(false);
      } else {
        setRecheckStatusMsg({
          text: data.message || 'Payment not captured on Razorpay yet. If PhonePe/UPI debited your amount, Razorpay will update within 1-2 minutes. Please try again shortly.',
          type: 'warning'
        });
      }
    } catch (err: any) {
      setRecheckStatusMsg({
        text: 'Failed to communicate with payment verification server. Please try again.',
        type: 'warning'
      });
    } finally {
      setRecheckingId(null);
    }
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
          hotelId: reviewBooking.hotelId?._id || reviewBooking.hotelId,
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

        {/* Recheck Payment Notification Banner */}
        {recheckStatusMsg && (
          <div 
            className={`alert ${recheckStatusMsg.type === 'success' ? 'alert-success' : recheckStatusMsg.type === 'warning' ? 'alert-warning' : 'alert-info'}`}
            style={{ 
              marginBottom: 'var(--space-6)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.2rem' }}>
                {recheckStatusMsg.type === 'success' ? '✅' : recheckStatusMsg.type === 'warning' ? '⚠️' : 'ℹ️'}
              </span>
              <span style={{ fontWeight: 500 }}>{recheckStatusMsg.text}</span>
            </div>
            <button 
              onClick={() => setRecheckStatusMsg(null)} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', lineHeight: 1, color: 'inherit', padding: '0 6px' }}
              title="Dismiss"
            >
              ×
            </button>
          </div>
        )}

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
              <div key={booking._id} className={`card booking-card-layout ${!booking.hotelId?.images?.[0] ? 'no-img' : ''}`}>
                {booking.hotelId?.images?.[0] && (
                  <Image src={booking.hotelId.images[0]} alt={booking.hotelId.name} width={120} height={90} className="booking-card-img" />
                )}
                <div className="card-body">
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

                  {(booking.status === 'pending' || booking.paymentStatus === 'pending') && (
                    <div style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      color: '#92400e',
                      fontSize: '0.8rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4
                    }}>
                      <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>⏳ Payment Verification</span>
                      </div>
                      <div style={{ opacity: 0.95, lineHeight: 1.4 }}>
                        If you paid via PhonePe / UPI but closed the window or pressed back, click <strong>&quot;Verify Payment Status&quot;</strong>. We will directly verify Razorpay payment details and confirm your booking immediately.
                      </div>
                    </div>
                  )}
                </div>
                <div className="booking-card-actions">
                  <div className="booking-card-actions-header">
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--brand-600)' }}>₹{booking.totalPrice?.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span className={`badge ${booking.paymentStatus === 'paid' ? 'badge-success' : 'badge-warning'}`}>{booking.paymentStatus}</span>
                    </div>
                  </div>
                  <div className="booking-card-actions-btn-group">
                    <div className="booking-card-actions-btn-row">
                      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((booking.hotelId?.name || '') + " " + (booking.hotelId?.city || ''))}`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{flex: 1, textAlign: 'center', padding: '6px 10px'}}>🗺️ Directions</a>
                      <Link href={`/hotels/${booking.hotelId?._id}`} className="btn btn-secondary btn-sm" style={{flex: 1, textAlign: 'center', padding: '6px 10px'}}>View Hotel</Link>
                    </div>

                    {(booking.status === 'pending' || booking.paymentStatus === 'pending') && (
                      <button
                        className="btn btn-sm"
                        onClick={() => verifyPaymentStatus(booking._id)}
                        disabled={recheckingId === booking._id}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(135deg, var(--brand-500), var(--brand-600))',
                          color: 'white',
                          border: 'none',
                          fontWeight: 600,
                          cursor: recheckingId === booking._id ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '8px 12px'
                        }}
                      >
                        {recheckingId === booking._id ? (
                          <>
                            <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
                            <span>Checking Razorpay...</span>
                          </>
                        ) : (
                          <>
                            <span>🔄</span>
                            <span>Verify Payment Status</span>
                          </>
                        )}
                      </button>
                    )}

                    {booking.status === 'confirmed' && booking.paymentStatus === 'paid' && (
                      <Link href={`/invoice/${booking._id}`} className="btn btn-primary btn-sm" style={{width: '100%', textAlign: 'center'}}>📄 Tax Invoice</Link>
                    )}
                    {booking.status === 'pending' && (
                      <button className="btn btn-outline btn-sm" onClick={() => cancelBooking(booking._id)} style={{width: '100%', color: 'var(--danger)', borderColor: 'var(--danger)'}}>Cancel Booking</button>
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
