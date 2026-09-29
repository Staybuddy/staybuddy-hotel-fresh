import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Fetch all users with role 'partner'
    const partners = await User.find({ role: 'partner' }).sort({ createdAt: -1 }).lean();
    
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

    const { partnerId, action } = await req.json(); // action can be 'approve' or 'reject'
    if (!partnerId || !action) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    await connectDB();
    
    const statusMap: Record<string, string> = {
      'approve': 'approved',
      'reject': 'rejected'
    };

    if (!statusMap[action]) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedUser = await User.findByIdAndUpdate(
      partnerId,
      { partnerStatus: statusMap[action] },
      { new: true }
    ).lean();

    if (!updatedUser) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, partner: updatedUser });
  } catch (error) {
    console.error('Failed to update partner status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
