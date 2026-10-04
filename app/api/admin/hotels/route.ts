import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const hotelsSnapshot = await db.collection('hotels').orderBy('createdAt', 'desc').get().catch(() => db.collection('hotels').get());
    let hotels = hotelsSnapshot.docs.map(doc => doc.data());

    // Fetch users (partners) to attach name/email
    const usersSnapshot = await db.collection('users').get();
    const usersMap: Record<string, any> = {};
    usersSnapshot.forEach(doc => {
      usersMap[doc.id] = doc.data(); // doc.id is either the Firebase UID or MongoDB _id
      // Also map by _id in case they are stored differently
      if (doc.data()._id) usersMap[doc.data()._id] = doc.data();
    });

    // Attach partner info to hotels
    hotels = hotels.map(hotel => {
      const partner = usersMap[hotel.partnerId];
      return {
        ...hotel,
        partnerId: partner ? { _id: partner._id || hotel.partnerId, name: partner.name, email: partner.email, phone: partner.phone } : hotel.partnerId
      };
    });

    // We no longer strictly need to fetch separate Rooms if they are embedded. 
    // But if we still have a 'rooms' collection, we can fetch it:
    const roomsSnapshot = await db.collection('rooms').get();
    const allRooms = roomsSnapshot.docs.map(doc => doc.data());

    const hotelsWithRooms = hotels.map(hotel => {
      const hRooms = allRooms.filter(r => String(r.hotelId) === String(hotel._id));
      // If the hotel has embedded rooms array, use that for totals as fallback
      const embeddedRooms = hotel.rooms || [];
      const totalRooms = hRooms.reduce((sum, r) => sum + (r.totalRooms || 0), 0) || embeddedRooms.reduce((sum: number, r: any) => sum + (r.totalRooms || parseInt(r.quantity) || 0), 0);
      const staybuddyAllocation = hRooms.reduce((sum, r) => sum + (r.staybuddyAllocation || 0), 0) || embeddedRooms.reduce((sum: number, r: any) => sum + (r.staybuddyAllocation || 0), 0);
      return { ...hotel, totalRooms, staybuddyAllocation };
    });

    return NextResponse.json({ hotels: hotelsWithRooms });
  } catch (error) {
    console.error('Admin Hotels GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
