import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await db.collection('users').where('role', '==', 'partner').get();
    const partners = snapshot.docs.map(doc => {
      const data = doc.data();
      delete data.password;
      return { _id: doc.id, ...data };
    });
    
    // Sort manually since we can't sort by createdAt if we filter by role without composite index
    partners.sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    
    return NextResponse.json({ partners });
  } catch (error) {
    console.error('Failed to fetch partners:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { partnerId, action } = await req.json();
    if (!partnerId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const statusMap: Record<string, string> = {
      'approve': 'approved',
      'reject': 'rejected'
    };

    if (!statusMap[action]) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const docRef = db.collection('users').doc(partnerId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    await docRef.update({ partnerStatus: statusMap[action] });
    const updated = await docRef.get();

    const partner = { _id: updated.id, ...updated.data() };
    delete (partner as any).password;

    return NextResponse.json({ success: true, partner });
  } catch (error) {
    console.error('Failed to update partner status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
