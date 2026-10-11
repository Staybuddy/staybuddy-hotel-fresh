import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const maxDuration = 60; // 60 seconds

function getDateStr(d: Date | string | number): string {
  const date = new Date(d);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function GET(request: Request) {
  try {
    const todayStr = getDateStr(new Date());

    // 1. Fetch all active rooms
    const roomsSnap = await db.collection('rooms').where('isActive', '==', true).get();
    
    // 2. Fetch all confirmed bookings to calculate active occupancy for today
    const bookingsSnap = await db.collection('bookings')
      .where('status', '==', 'confirmed')
      .get();

    const todayOccupiedByRoom: Record<string, number> = {};
    bookingsSnap.docs.forEach((doc: any) => {
      const b = doc.data();
      if (b.roomId && b.checkIn && b.checkOut) {
        const bIn = getDateStr(b.checkIn);
        const bOut = getDateStr(b.checkOut);
        // Occupied today if checked in on or before today and checking out after today
        if (bIn <= todayStr && bOut > todayStr) {
          todayOccupiedByRoom[b.roomId] = (todayOccupiedByRoom[b.roomId] || 0) + Number(b.rooms || 1);
        }
      }
    });

    // 3. Batch update rooms to reset extra inventory and rollover base allocation
    const batch = db.batch();
    let updatedCount = 0;
    
    for (const doc of roomsSnap.docs) {
      const data = doc.data();
      const baseAlloc = Number(data.staybuddyAllocation !== undefined ? data.staybuddyAllocation : (data.totalRooms || 0));
      const occupiedToday = todayOccupiedByRoom[doc.id] || 0;
      const smartAvailable = Math.max(0, baseAlloc - occupiedToday);
      
      // Update if availableRooms differs or extraInventoryToday was set
      if (data.availableRooms !== smartAvailable || data.extraInventoryToday) {
        batch.update(doc.ref, {
          availableRooms: smartAvailable,
          extraInventoryToday: 0,
          updatedAt: new Date().toISOString()
        });
        updatedCount++;
      }
    }
    
    // 4. Commit changes if any
    if (updatedCount > 0) {
      await batch.commit();
    }
    
    return NextResponse.json({ 
      success: true, 
      date: todayStr,
      message: `12:00 PM Smart Rollover: Updated ${updatedCount} rooms. Base allocations rolled over; extra inventory cleared.` 
    });
  } catch (error: any) {
    console.error('Inventory Reset Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

