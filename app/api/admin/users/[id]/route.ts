import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const docRef = db.collection('users').doc(resolvedParams.id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    await docRef.update(body);
    const updated = await docRef.get();
    const user = { _id: updated.id, ...updated.data() };
    delete (user as any).password;
    
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
