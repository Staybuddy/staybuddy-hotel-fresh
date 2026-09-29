import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const body = await request.json();
    const { status, paymentId, paymentStatus } = body;

    const booking = await Booking.findByIdAndUpdate(
      resolvedParams.id,
      { ...(status && { status }), ...(paymentId && { paymentId }), ...(paymentStatus && { paymentStatus }) },
      { new: true }
    ).populate('hotelId', 'name city').populate('roomId', 'type');

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    return NextResponse.json({ booking });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const resolvedParams = await params;
    const booking = await Booking.findByIdAndUpdate(resolvedParams.id, { status: 'cancelled' }, { new: true });
    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    return NextResponse.json({ message: 'Booking cancelled', booking });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
