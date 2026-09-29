import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const bookings = await Booking.find({})
      .populate('hotelId', 'name city')
      .populate('roomId', 'type')
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
