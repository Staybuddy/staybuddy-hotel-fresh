import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET() {
  const rooms = await db.collection('rooms').get();
  let updated = 0;
  for (const doc of rooms.docs) {
    const data = doc.data();
    if (data.totalRooms && data.staybuddyAllocation !== data.totalRooms) {
      await doc.ref.update({ staybuddyAllocation: Number(data.totalRooms) });
      updated++;
    }
  }
  return NextResponse.json({ success: true, updated });
}
