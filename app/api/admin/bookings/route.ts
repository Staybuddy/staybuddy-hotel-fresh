import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { getCached, setCached, getFallback } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cacheKey = 'admin_bookings_list';
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=120' }
    });
  }

  try {
    const [bookingsSnap, hotelsSnap, usersSnap] = await Promise.all([
      db.collection('bookings').orderBy('createdAt', 'desc').get().catch(() => db.collection('bookings').get()),
      db.collection('hotels').get().catch(() => ({ forEach: () => {} } as any)),
      db.collection('users').get().catch(() => ({ forEach: () => {} } as any))
    ]);

    const hotelsMap: Record<string, any> = {};
    if (hotelsSnap && typeof hotelsSnap.forEach === 'function') {
      hotelsSnap.forEach((d: any) => { hotelsMap[d.id] = d.data(); });
    }

    const usersMap: Record<string, any> = {};
    if (usersSnap && typeof usersSnap.forEach === 'function') {
      usersSnap.forEach((d: any) => { usersMap[d.id] = d.data(); });
    }

    const bookings = bookingsSnap.docs.map((doc: any) => {
      const data = doc.data();
      const hotelData = (data.hotelId && hotelsMap[data.hotelId]) || { name: 'Unknown', city: 'Unknown' };
      const customerData = (data.customerId && usersMap[data.customerId]) || { name: 'Unknown', email: 'Unknown', phone: '' };

      const referrerId = data.referredByUserId || customerData.referredBy;
      const referrerUser = referrerId && usersMap[referrerId];
      const isReferral = Boolean(data.isReferralBooking || data.referralCode || referrerId);
      const referralCode = data.referralCode || referrerUser?.referralCode || customerData.referralCodeUsed || null;
      const referrerName = data.referrerName || referrerUser?.name || referrerUser?.email || (referralCode ? `Referrer (${referralCode})` : null);

      return { 
        _id: doc.id, 
        ...data,
        isReferralBooking: isReferral,
        referralCode,
        referrerName,
        referredByUserId: referrerId || null,
        referralRewardAmount: data.referralRewardAmount || 20,
        referralRewardStatus: data.referralRewardStatus || (data.status === 'completed' ? 'rewarded' : 'pending_checkout'),
        hotelId: { _id: data.hotelId, name: hotelData.name || data.hotelName || 'StayBuddy Property', city: hotelData.city || data.city || 'India' },
        customerId: { _id: data.customerId, name: customerData.name || data.guestName || 'Guest', email: customerData.email || data.guestEmail || '', phone: customerData.phone || data.guestPhone || '' }
      };
    });
    
    const payload = { bookings };
    setCached(cacheKey, payload, 180); // 3 minutes cache
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Admin Bookings GET error (falling back to cache):', error);
    const fallback = getFallback<any>(cacheKey);
    if (fallback && Array.isArray(fallback.bookings)) {
      return NextResponse.json(fallback, {
        headers: { 'X-Cache': 'FALLBACK_EXHAUSTED_PROTECTION' }
      });
    }
    return NextResponse.json({ bookings: [] });
  }
}
