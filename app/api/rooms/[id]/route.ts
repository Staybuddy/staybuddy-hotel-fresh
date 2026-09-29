import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    // Remove _id from body to prevent overwriting
    delete body._id;
    body.updatedAt = new Date().toISOString();

    const roomRef = db.collection('rooms').doc(resolvedParams.id);
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    await roomRef.update(body);
    
    const updatedDoc = await roomRef.get();
    const room = { _id: updatedDoc.id, ...updatedDoc.data() };
    
    return NextResponse.json({ room });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const roomRef = db.collection('rooms').doc(resolvedParams.id);
    
    const roomSnap = await roomRef.get();
    if (!roomSnap.exists) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    await roomRef.update({ isActive: false, updatedAt: new Date().toISOString() });
    
    return NextResponse.json({ message: 'Room deactivated' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
