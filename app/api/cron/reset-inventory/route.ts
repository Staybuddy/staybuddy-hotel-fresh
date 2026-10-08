import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export const maxDuration = 60; // 60 seconds

export async function GET(request: Request) {
  try {
    // 1. Fetch all active rooms
    const snapshot = await db.collection('rooms').where('isActive', '==', true).get();
    
    // 2. Iterate and update
    const batch = db.batch();
    let updatedCount = 0;
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const baseAlloc = data.staybuddyAllocation || 0;
      
      // If the current available is different from base, or if there's leftover extraInventoryToday, reset it
      if (data.availableRooms !== baseAlloc || data.extraInventoryToday) {
        batch.update(doc.ref, {
          availableRooms: baseAlloc,
          extraInventoryToday: 0,
          updatedAt: new Date().toISOString()
        });
        updatedCount++;
      }
    }
    
    // 3. Commit changes if any
    if (updatedCount > 0) {
      await batch.commit();
    }
    
    return NextResponse.json({ success: true, message: `Successfully reset ${updatedCount} rooms' inventory.` });
  } catch (error: any) {
    console.error('Inventory Reset Cron Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
