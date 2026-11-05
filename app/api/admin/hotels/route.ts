import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const hotelsSnapshot = await db.collection('hotels').orderBy('createdAt', 'desc').get().catch(() => db.collection('hotels').get());
    let hotels: any[] = hotelsSnapshot.docs.map(doc => ({ _id: doc.id, ...(doc.data() as any) }));

    // Fetch users (partners) to attach name/email
    const usersSnapshot = await db.collection('users').get();
    const usersMap: Record<string, any> = {};
    usersSnapshot.forEach(doc => {
      usersMap[doc.id] = { _id: doc.id, ...doc.data() };
      if (doc.data()._id) usersMap[doc.data()._id] = { _id: doc.id, ...doc.data() };
    });

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
    const roomsSnapshot = await db.collection('rooms').get();
    const allRooms: any[] = roomsSnapshot.docs.map(doc => ({ _id: doc.id, ...(doc.data() as any) }));

    const hotelsWithRooms = hotels.map((hotel: any) => {
      const hRooms = allRooms.filter((r: any) => String(r.hotelId) === String(hotel._id) || (hotel.id && String(r.hotelId) === String(hotel.id)));
      const embeddedRooms = hotel.rooms || [];
      const totalRooms = hRooms.reduce((sum: number, r: any) => sum + (Number(r.totalRooms) || 0), 0) || embeddedRooms.reduce((sum: number, r: any) => sum + (Number(r.totalRooms) || parseInt(r.quantity) || 0), 0);
      const staybuddyAllocation = hRooms.reduce((sum: number, r: any) => sum + (Number(r.staybuddyAllocation) || 0), 0) || embeddedRooms.reduce((sum: number, r: any) => sum + (Number(r.staybuddyAllocation) || 0), 0);
      const finalRooms = (hRooms && hRooms.length > 0) ? hRooms : (embeddedRooms || []);
      return { ...hotel, rooms: finalRooms, totalRooms, staybuddyAllocation };
    });

    return NextResponse.json({ hotels: hotelsWithRooms });
  } catch (error) {
    console.error('Admin Hotels GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
