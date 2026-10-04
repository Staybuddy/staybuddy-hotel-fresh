/* eslint-disable */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebaseAdmin';

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

    const reviewRef = db.collection('reviews').doc();
    const newReview = {
      _id: reviewRef.id,
      hotelId, 
      customerId, 
      rating, 
      title, 
      comment,
      cleanliness: rating,
      service: rating,
      location: rating,
      value: rating,
      status: 'approved',
      createdAt: new Date().toISOString()
    };
    await reviewRef.set(newReview);

    const allReviewsSnap = await db.collection('reviews').where('hotelId', '==', hotelId).get();
    const allReviews = allReviewsSnap.docs.map(doc => doc.data());
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    
    await db.collection('hotels').doc(hotelId).update({ 
      avgRating: parseFloat(avgRating.toFixed(1)),
      totalReviews: allReviews.length 
    });

    return NextResponse.json({ review: newReview }, { status: 201 });
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

    const reviewsSnap = await db.collection('reviews').where('hotelId', '==', hotelId).orderBy('createdAt', 'desc').get();
    
    const reviews = await Promise.all(reviewsSnap.docs.map(async (doc) => {
      const data = doc.data();
      let customerData = { name: 'Unknown', email: 'Unknown', image: '' };
      if (data.customerId) {
        const custDoc = await db.collection('users').doc(data.customerId).get();
        if (custDoc.exists) customerData = custDoc.data() as any;
      }
      return {
        _id: doc.id,
        ...data,
        customerId: { _id: data.customerId, name: customerData.name, email: customerData.email, image: customerData.image }
      };
    }));

    return NextResponse.json({ reviews });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
