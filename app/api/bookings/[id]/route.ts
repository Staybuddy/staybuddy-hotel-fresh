import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { status, paymentId, paymentStatus } = body;

    const docRef = db.collection('bookings').doc(resolvedParams.id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    
    const updates: any = {};
    if (status) updates.status = status;
    if (paymentId) updates.paymentId = paymentId;
    if (paymentStatus) updates.paymentStatus = paymentStatus;
    
    if (Object.keys(updates).length > 0) {
      await docRef.update(updates);
    }
    
    const updated = await docRef.get();
    const booking = { _id: updated.id, ...updated.data() };
    
    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const docRef = db.collection('bookings').doc(resolvedParams.id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    
    await docRef.update({ status: 'cancelled' });
    const updated = await docRef.get();
    
    return NextResponse.json({ message: 'Booking cancelled', booking: { _id: updated.id, ...updated.data() } });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
