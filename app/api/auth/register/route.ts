import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role, phone } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const usersRef = db.collection('users');
    const existing = await usersRef.where('email', '==', email.toLowerCase()).limit(1).get();
    
    if (!existing.empty) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const userRole = role === 'partner' ? 'partner' : 'customer';

    const base = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4) || 'USER';
    const randomStr = crypto.randomBytes(2).toString('hex').toUpperCase();
    const refCode = `${base}${randomStr}`;

    const newUser = {
      name,
      email: email.toLowerCase(),
      role: userRole,
      phone: phone || '',
      partnerStatus: userRole === 'partner' ? 'pending' : 'none',
      isActive: true,
      referralCode: refCode,
      referralCount: 0,
      walletBalance: 0,
      createdAt: new Date()
    };

    const docRef = await usersRef.add(newUser);

    return NextResponse.json(
      {
        message: 'Account created successfully',
        user: { id: docRef.id, name: newUser.name, email: newUser.email, role: newUser.role },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
