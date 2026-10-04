'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function WishlistButton({ hotelId, initialIsWishlisted = false }: { hotelId: string, initialIsWishlisted?: boolean }) {
  const { data: session } = useSession();
  const [isWishlisted, setIsWishlisted] = useState(initialIsWishlisted);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsWishlisted(initialIsWishlisted);
  }, [initialIsWishlisted]);

  async function toggleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      alert("Please login to add to wishlist.");
      return;
    }

    setLoading(true);
    const newStatus = !isWishlisted;
    setIsWishlisted(newStatus); // Optimistic update

    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId, action: newStatus ? 'add' : 'remove' })
      });
      if (!res.ok) {
        throw new Error('Failed to update wishlist');
      }
    } catch (err) {
      console.error(err);
      setIsWishlisted(!newStatus); // Revert on failure
      alert("Something went wrong updating your wishlist.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button 
      onClick={toggleWishlist}
      disabled={loading}
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        background: 'rgba(255, 255, 255, 0.9)',
        border: 'none',
        borderRadius: '50%',
        width: 36,
        height: 36,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        zIndex: 10,
        transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        transform: isWishlisted ? 'scale(1.1)' : 'scale(1)',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.15)'}
      onMouseLeave={e => e.currentTarget.style.transform = isWishlisted ? 'scale(1.1)' : 'scale(1)'}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill={isWishlisted ? '#ef4444' : 'none'} stroke={isWishlisted ? '#ef4444' : '#64748b'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'all 0.2s' }}>
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
      </svg>
    </button>
  );
}
