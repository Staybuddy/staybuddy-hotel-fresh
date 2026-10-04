import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET() {
  try {
    const snapshot = await db.collection('taxInvoices').orderBy('createdAt', 'desc').get();
    const invoices = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    return NextResponse.json({ invoices });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const docRef = await db.collection('taxInvoices').add({
      ...body,
      createdAt: new Date().toISOString()
    });
    return NextResponse.json({ success: true, id: docRef.id });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
