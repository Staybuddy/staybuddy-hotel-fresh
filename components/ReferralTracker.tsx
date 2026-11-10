'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams?.get('ref') || searchParams?.get('referral');
    if (refCode && refCode.trim()) {
      const cleanCode = refCode.trim().toUpperCase();
      // Store in cookie for 30 days
      document.cookie = `staybuddy_ref=${cleanCode}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
      // Store in localStorage for client-side bookings
      try {
        localStorage.setItem('staybuddy_ref', cleanCode);
      } catch (e) {
        // storage disabled
      }
    }
  }, [searchParams]);

  return null;
}
