'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface BookingInfo {
  _id: string;
  bookingId: string;
  hotelId: string;
  checkIn: string;
  checkOut: string;
  roomSummary: string;
  guestName: string;
  guestEmail: string;
}

interface HotelInfo {
  _id: string;
  name: string;
  city: string;
  address: string;
  image: string;
  avgRating: number;
}

const QUICK_TAGS = [
  '✨ Spotless & Clean',
  '🤝 Courteous Staff',
  '🛏️ Super Comfortable Bed',
  '📍 Prime Location',
  '⚡ Swift Check-in',
  '📶 Fast Wi-Fi',
  '🍳 Delicious Food',
  '🤫 Quiet & Peaceful',
];

const RATING_LABELS: Record<number, { text: string; color: string }> = {
  5: { text: '⭐ Outstanding! (5/5) — Exceeded expectations', color: '#16a34a' },
  4: { text: '⭐ Very Good (4/5) — Comfortable & pleasant stay', color: '#059669' },
  3: { text: '⭐ Average (3/5) — Met basic expectations', color: '#d97706' },
  2: { text: '⭐ Fair (2/5) — Needs noticeable improvement', color: '#ea580c' },
  1: { text: '⭐ Disappointing (1/5) — Unsatisfactory experience', color: '#dc2626' },
};

export default function PostCheckoutReviewModal() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [booking, setBooking] = useState<BookingInfo | null>(null);
  const [hotel, setHotel] = useState<HotelInfo | null>(null);

  // Review Form State
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function checkUnreviewedStay() {
      try {
        // Find best user email from session or localStorage
        let email = session?.user?.email || '';
        if (!email && typeof window !== 'undefined') {
          email = localStorage.getItem('staybuddy_guest_email') || '';
        }

        const res = await fetch(`/api/bookings/unreviewed?email=${encodeURIComponent(email || '')}`);
        if (!res.ok) return;

        const data = await res.json();
        if (!isMounted || !data.hasUnreviewedStay || !data.booking || !data.hotel) {
          return;
        }

        const bookingId = data.booking._id || data.booking.bookingId;

        // Check if user dismissed this specific booking recently
        if (typeof window !== 'undefined') {
          const dismissedUntil = localStorage.getItem(`staybuddy_review_snooze_${bookingId}`);
          if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
            return;
          }
          const sessionDismissed = sessionStorage.getItem(`staybuddy_review_dismissed_${bookingId}`);
          if (sessionDismissed === 'true') {
            return;
          }
        }

        setBooking(data.booking);
        setHotel(data.hotel);

        // Pre-fill a default enthusiastic title
        setTitle(`Great stay at ${data.hotel.name}!`);

        // Open modal after a polite 1.2s delay for smooth page appearance
        setTimeout(() => {
          if (isMounted) {
            setIsOpen(true);
          }
        }, 1200);
      } catch (err) {
        console.warn('Could not check for unreviewed stay:', err);
      }
    }

    checkUnreviewedStay();

    return () => {
      isMounted = false;
    };
  }, [session]);

  const handleDismiss = () => {
    if (booking) {
      const bookingId = booking._id || booking.bookingId;
      try {
        // Snooze for 24 hours so it doesn't repeatedly harass the user
        localStorage.setItem(`staybuddy_review_snooze_${bookingId}`, String(Date.now() + 24 * 60 * 60 * 1000));
        sessionStorage.setItem(`staybuddy_review_dismissed_${bookingId}`, 'true');
      } catch (e) {}
    }
    setIsOpen(false);
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags((prev) => prev.filter((t) => t !== tag));
    } else {
      setSelectedTags((prev) => [...prev, tag]);
      // Also conveniently append helpful keywords to the comment if not already included
      if (!comment.includes(tag.replace(/^[^\w\s]+/, '').trim())) {
        const cleanTag = tag.replace(/^[^\w\s]+/, '').trim();
        setComment((prev) => (prev ? `${prev}. ${cleanTag}` : `${cleanTag}!`));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || !hotel) return;

    if (!title.trim()) {
      setErrorMessage('Please give your review a short title.');
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      setErrorMessage('Please write a brief comment describing your stay.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const combinedComment = selectedTags.length > 0
        ? `${comment.trim()}\n\nHighlights: ${selectedTags.join(', ')}`
        : comment.trim();

      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: hotel._id,
          bookingId: booking._id,
          rating,
          title: title.trim(),
          comment: combinedComment,
          guestName: booking.guestName,
          cleanliness: rating,
          service: rating,
          location: rating,
          value: rating,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setIsSubmitted(true);

      // Permanently remove snooze since it is now reviewed
      const bookingId = booking._id || booking.bookingId;
      try {
        localStorage.removeItem(`staybuddy_review_snooze_${bookingId}`);
        sessionStorage.setItem(`staybuddy_review_dismissed_${bookingId}`, 'true');
      } catch (e) {}

      // Auto close after celebrating
      setTimeout(() => {
        setIsOpen(false);
      }, 2500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong submitting your review.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !booking || !hotel) {
    return null;
  }

  const activeStarCount = hoverRating || rating;
  const ratingDetails = RATING_LABELS[activeStarCount] || RATING_LABELS[5];

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(15, 23, 42, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: '16px',
        animation: 'sbFadeIn 0.25s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleDismiss();
        }
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 24,
          maxWidth: 560,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.4)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          animation: 'sbScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Top Decorative Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 50%, #fef3c7 100%)',
            padding: '20px 24px 16px',
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            borderBottom: '1px solid #fed7aa',
            position: 'relative',
          }}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={handleDismiss}
            disabled={isSubmitting}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: 'none',
              background: '#ffffff',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: '1.1rem',
              fontWeight: 700,
              transition: 'all 0.15s ease',
            }}
          >
            ✕
          </button>

          {/* Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#ea580c',
              color: '#ffffff',
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: '0.75rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 10,
              boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)',
            }}
          >
            <span>✓ Verified Stay Experience</span>
          </div>

          <h2
            style={{
              fontSize: '1.35rem',
              fontWeight: 800,
              color: '#0f172a',
              margin: '0 0 4px',
              lineHeight: 1.25,
            }}
          >
            How was your stay at {hotel.name}?
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
            Welcome back, <strong style={{ color: '#0f172a' }}>{booking.guestName}</strong>! Tell travelers about your experience.
          </p>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {isSubmitted ? (
            /* Celebration Success State */
            <div
              style={{
                textAlign: 'center',
                padding: '36px 16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: '#dcfce7',
                  color: '#16a34a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  boxShadow: '0 10px 25px -5px rgba(22, 163, 74, 0.3)',
                }}
              >
                🎉
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '4px 0 0' }}>
                Thank You for Your Feedback!
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', maxWidth: 380, margin: 0, lineHeight: 1.5 }}>
                Your verified review for <strong>{hotel.name}</strong> has been published and will help fellow travelers plan their perfect stay.
              </p>
              <div
                style={{
                  marginTop: 8,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#ea580c',
                  background: '#fff7ed',
                  padding: '6px 14px',
                  borderRadius: 16,
                }}
              >
                Closing window in 2 seconds...
              </div>
            </div>
          ) : (
            <>
              {/* Hotel & Stay Card Strip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '12px 14px',
                  background: '#f8fafc',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    width: 76,
                    height: 64,
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: '#e2e8f0',
                    flexShrink: 0,
                    position: 'relative',
                  }}
                >
                  {hotel.image ? (
                    <img
                      src={hotel.image}
                      alt={hotel.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem',
                      }}
                    >
                      🏨
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {hotel.name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                    📍 {hotel.city || 'India'} • {booking.roomSummary || 'Deluxe Room'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600, marginTop: 2 }}>
                    Checked out: {formatDate(booking.checkOut)}
                  </div>
                </div>
              </div>

              {/* Star Rating Section */}
              <div
                style={{
                  background: '#fafafa',
                  borderRadius: 16,
                  padding: '16px',
                  border: '1px solid #f1f5f9',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                  Tap stars to rate your overall experience:
                </div>

                {/* Stars Row */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                  onMouseLeave={() => setHoverRating(0)}
                >
                  {[1, 2, 3, 4, 5].map((starVal) => {
                    const isFilled = starVal <= activeStarCount;
                    return (
                      <button
                        type="button"
                        key={starVal}
                        onClick={() => setRating(starVal)}
                        onMouseEnter={() => setHoverRating(starVal)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          fontSize: '2.5rem',
                          lineHeight: 1,
                          transform: isFilled ? 'scale(1.12)' : 'scale(1)',
                          transition: 'transform 0.15s ease, filter 0.15s ease',
                          filter: isFilled
                            ? 'drop-shadow(0 2px 6px rgba(245, 158, 11, 0.5))'
                            : 'grayscale(100%) opacity(35%)',
                        }}
                        aria-label={`Rate ${starVal} Stars`}
                      >
                        ⭐
                      </button>
                    );
                  })}
                </div>

                {/* Expressive rating label */}
                <div
                  style={{
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    color: ratingDetails.color,
                    minHeight: 22,
                    transition: 'color 0.2s ease',
                  }}
                >
                  {ratingDetails.text}
                </div>
              </div>

              {/* Quick Highlight Tags */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#475569',
                    marginBottom: 8,
                  }}
                >
                  What did you like the most? (Tap to add)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        style={{
                          background: isSelected ? '#ea580c' : '#f1f5f9',
                          color: isSelected ? '#ffffff' : '#334155',
                          border: isSelected ? '1px solid #ea580c' : '1px solid #e2e8f0',
                          borderRadius: 20,
                          padding: '5px 12px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Input Fields */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: 6,
                    }}
                  >
                    Review Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Wonderful stay, courteous staff and great food!"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: '#475569',
                      marginBottom: 6,
                    }}
                  >
                    Your Feedback & Review
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Tell us about the room cleanliness, comfort, hospitality, or amenities during your stay..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.9rem',
                      outline: 'none',
                      resize: 'vertical',
                      minHeight: 80,
                    }}
                  />
                </div>

                {errorMessage && (
                  <div
                    style={{
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#b91c1c',
                      borderRadius: 10,
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                    }}
                  >
                    {errorMessage}
                  </div>
                )}

                {/* Footer Actions */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    marginTop: 4,
                  }}
                >
                  <button
                    type="button"
                    onClick={handleDismiss}
                    disabled={isSubmitting}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#64748b',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '8px 12px',
                      borderRadius: 8,
                    }}
                  >
                    Maybe Later
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 12,
                      padding: '12px 24px',
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      opacity: isSubmitting ? 0.75 : 1,
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {isSubmitting ? 'Submitting Review...' : '⭐ Submit Verified Review'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

