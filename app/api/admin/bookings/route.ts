import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const [bookingsSnap, hotelsSnap, usersSnap] = await Promise.all([
      db.collection('bookings').orderBy('createdAt', 'desc').get().catch(() => db.collection('bookings').get()),
      db.collection('hotels').get(),
      db.collection('users').get()
    ]);

    const hotelsMap: Record<string, any> = {};
    hotelsSnap.forEach(d => { hotelsMap[d.id] = d.data(); });

    const usersMap: Record<string, any> = {};
    usersSnap.forEach(d => { usersMap[d.id] = d.data(); });

    const bookings = bookingsSnap.docs.map(doc => {
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
        hotelId: { _id: data.hotelId, name: hotelData.name, city: hotelData.city },
        customerId: { _id: data.customerId, name: customerData.name, email: customerData.email, phone: customerData.phone || data.guestPhone || '' }
      };
    });
    
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
