import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebaseAdmin';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get('email') || session?.user?.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ phone: '' });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ phone: '' });
    }

    const userData = snapshot.docs[0].data();
    return NextResponse.json({
      success: true,
      phone: userData.phone || '',
      name: userData.name || '',
      email: userData.email || email,
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ phone: '' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const email = (body.email || session?.user?.email || '').trim().toLowerCase();
    const phone = (body.phone || '').trim();

    if (!email || !phone) {
      return NextResponse.json({ error: 'Email and phone are required' }, { status: 400 });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        phone: phone,
        updatedAt: new Date(),
      });
    } else {
      await usersRef.add({
        email: email,
        phone: phone,
        name: body.name || session?.user?.name || email.split('@')[0],
        role: 'customer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return NextResponse.json({ success: true, phone });
  } catch (error: any) {
    console.error('Error updating user phone:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

