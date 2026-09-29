import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userDoc.data() as any;

    const txSnap = await db.collection('wallet_transactions').where('userId', '==', userId).orderBy('createdAt', 'desc').get();
    const transactions = txSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

    return NextResponse.json({ 
      walletBalance: user.walletBalance || 0,
      referralCode: user.referralCode,
      referralCount: user.referralCount || 0,
      transactions 
    });
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch wallet data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount } = await request.json();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }
    const user = userDoc.data() as any;
    const currentBalance = user.walletBalance || 0;

    if (currentBalance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const newBalance = currentBalance - amount;
    await userRef.update({ walletBalance: newBalance });

    const txRef = db.collection('wallet_transactions').doc();
    const transaction = {
      _id: txRef.id,
      userId,
      amount,
      type: 'withdrawal',
      description: 'Requested withdrawal to bank account',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await txRef.set(transaction);

    return NextResponse.json({ success: true, walletBalance: newBalance, transaction });
  } catch (error) {
    console.error('Wallet withdrawal error:', error);
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }
}
