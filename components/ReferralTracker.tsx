'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      // Store the referral code in a cookie for 30 days
      document.cookie = `staybuddy_ref=${refCode}; path=/; max-age=${30 * 24 * 60 * 60}; samesite=lax`;
    }
  }, [searchParams]);

  return null;
}
