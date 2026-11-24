import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import { getCached, setCached, getFallback } from '@/lib/cache';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest) {
  const cacheKey = 'admin_hotels_list';
  const cached = getCached<any>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, s-maxage=300' }
    });
  }

  try {
    // Fetch all hotels unconditionally without omitting documents lacking createdAt
    const hotelsSnapshot = await db.collection('hotels').get();
    let hotels: any[] = hotelsSnapshot.docs.map(doc => ({ _id: doc.id, ...(doc.data() as any) }));

    // In-memory sort by createdAt descending (robust against missing or formatted createdAt)
    hotels.sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    // Fetch users (partners) to attach name/email
    let usersMap: Record<string, any> = {};
    try {
      const usersSnapshot = await db.collection('users').get();
      usersSnapshot.forEach(doc => {
        usersMap[doc.id] = { _id: doc.id, ...doc.data() };
        if (doc.data()._id) usersMap[doc.data()._id] = { _id: doc.id, ...doc.data() };
      });
    } catch (e) {
      console.warn('Admin hotels users attach non-fatal error:', e);
    }

    // Attach partner info to hotels
    hotels = hotels.map((hotel: any) => {
      const partnerKey = typeof hotel.partnerId === 'object' ? (hotel.partnerId?._id || hotel.partnerId?.id) : hotel.partnerId;
      const partner = partnerKey ? usersMap[partnerKey] : null;
      return {
        ...hotel,
        partnerId: partner 
          ? { _id: partner._id || partnerKey, name: partner.name, email: partner.email, phone: partner.phone } 
          : (typeof hotel.partnerId === 'object' ? hotel.partnerId : { _id: hotel.partnerId })
      };
    });

    // Fetch rooms from rooms collection
    let allRooms: any[] = [];
    try {
      const roomsSnapshot = await db.collection('rooms').get();
      allRooms = roomsSnapshot.docs.map(doc => ({ _id: doc.id, ...(doc.data() as any) }));
    } catch (e) {
      console.warn('Admin hotels rooms fetch non-fatal error:', e);
    }

    const hotelsWithRooms = hotels.map((hotel: any) => {
      const hRooms = allRooms.filter((r: any) => String(r.hotelId) === String(hotel._id) || (hotel.id && String(r.hotelId) === String(hotel.id)));
      const embeddedRooms = hotel.rooms || [];
      const totalRooms = hRooms.reduce((sum: number, r: any) => sum + (Number(r.totalRooms) || 0), 0) || embeddedRooms.reduce((sum: number, r: any) => sum + (Number(r.totalRooms) || parseInt(r.quantity) || 0), 0);
      const staybuddyAllocation = hRooms.reduce((sum: number, r: any) => sum + (Number(r.staybuddyAllocation) || 0), 0) || embeddedRooms.reduce((sum: number, r: any) => sum + (Number(r.staybuddyAllocation) || 0), 0);
      const finalRooms = (hRooms && hRooms.length > 0) ? hRooms : (embeddedRooms || []);
      return { ...hotel, rooms: finalRooms, totalRooms, staybuddyAllocation };
    });

    const payload = { hotels: hotelsWithRooms };
    setCached(cacheKey, payload, 300); // 5 minutes cache to protect quota
    return NextResponse.json(payload);
  } catch (error: any) {
    console.error('Admin Hotels GET error (falling back to cache):', error);
    const fallback = getFallback<any>(cacheKey);
    if (fallback && Array.isArray(fallback.hotels) && fallback.hotels.length > 0) {
      return NextResponse.json(fallback, {
        headers: { 'X-Cache': 'FALLBACK_EXHAUSTED_PROTECTION' }
      });
    }
    return NextResponse.json({ error: 'Database temporarily busy. Please refresh.' }, { status: 503 });
  }
}
