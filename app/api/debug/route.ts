import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET() {
  const rooms = await db.collection('rooms').get();
  const bookings = await db.collection('bookings').get();
  
  return NextResponse.json({
    rooms: rooms.docs.map(d => d.data()),
    bookings: bookings.docs.map(d => d.data())
  });
}
