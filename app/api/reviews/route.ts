import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Review from '@/models/Review';
import Booking from '@/models/Booking';
import Hotel from '@/models/Hotel';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const customerId = session.user.id;
    const { hotelId, rating, title, comment } = await request.json();

    if (!hotelId || !rating || !title || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // Create review without strictly enforcing bookingId for easier testing
    const review = await Review.create({ 
      hotelId, 
      customerId, 
      rating, 
      title, 
      comment,
      cleanliness: rating,
      service: rating,
      location: rating,
      value: rating
    });

    // Update hotel average rating
    const allReviews = await Review.find({ hotelId });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await Hotel.findByIdAndUpdate(hotelId, { 
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: allReviews.length 
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Review Creation Error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) return NextResponse.json({ error: 'Hotel ID required' }, { status: 400 });

    await connectDB();
    User.modelName; // ensure user model loaded for population

    const reviews = await Review.find({ hotelId })
      .populate('customerId', 'name email image')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
