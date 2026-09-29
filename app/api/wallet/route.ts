import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import WalletTransaction from '@/models/WalletTransaction';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const userId = (session.user as any).id;
    
    // Get full user object to ensure we have latest balance and referral code
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get transaction history
    const transactions = await WalletTransaction.find({ userId }).sort({ createdAt: -1 });

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

    await connectDB();
    const userId = (session.user as any).id;
    const user = await User.findById(userId);
    
    if (!user || user.walletBalance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct balance
    user.walletBalance -= amount;
    await user.save();

    // Create withdrawal transaction
    const transaction = await WalletTransaction.create({
      userId,
      amount,
      type: 'withdrawal',
      description: `Requested withdrawal to bank account`,
      status: 'pending' // pending manual admin payout
    });

    return NextResponse.json({ success: true, walletBalance: user.walletBalance, transaction });
  } catch (error) {
    console.error('Wallet withdrawal error:', error);
    return NextResponse.json({ error: 'Failed to process withdrawal' }, { status: 500 });
  }
}
