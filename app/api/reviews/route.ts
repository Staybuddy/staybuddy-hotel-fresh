/* eslint-disable */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { hotelId, rating, title, comment, bookingId, guestName } = body;

    if (!hotelId || !rating || !title || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let customerId = (session.user as any)?.id || (session.user as any)?._id || body.customerId;
    if (!customerId && session.user.email) {
      try {
        const uSnap = await db.collection('users').where('email', '==', session.user.email).limit(1).get();
        if (!uSnap.empty) {
          customerId = uSnap.docs[0].id;
        }
      } catch (err) {
        console.warn('Error finding user by email:', err);
      }
    }
    if (!customerId) {
      customerId = session.user.email || 'customer_' + Date.now();
    }

    const authorName = guestName || session.user.name || 'Guest';
    const authorImage = session.user.image || '';

    const reviewRef = db.collection('reviews').doc();
    const newReview = {
      _id: reviewRef.id,
      hotelId, 
      customerId, 
      guestName: authorName,
      customerImage: authorImage,
      rating: Number(rating), 
      title, 
      comment,
      cleanliness: Number(rating),
      service: Number(rating),
      location: Number(rating),
      value: Number(rating),
      status: 'approved',
      bookingId: bookingId || null,
      createdAt: new Date().toISOString()
    };
    await reviewRef.set(newReview);

    // If submitted from a booking, update the booking status to reviewed
    if (bookingId) {
      try {
        const bRef = db.collection('bookings').doc(bookingId);
        const bDoc = await bRef.get();
        if (bDoc.exists) {
          await bRef.update({ isReviewed: true });
        } else {
          const bSnap = await db.collection('bookings').where('_id', '==', bookingId).limit(1).get();
          if (!bSnap.empty) {
            await bSnap.docs[0].ref.update({ isReviewed: true });
          }
        }
      } catch (bErr) {
        console.warn('Could not mark booking as reviewed:', bErr);
      }
    }

    // Recalculate average rating for hotel
    const allReviewsSnap = await db.collection('reviews').where('hotelId', '==', hotelId).get();
    const allReviews = allReviewsSnap.docs.map(doc => doc.data());
    const validRatings = allReviews.filter(r => typeof r.rating === 'number' && !isNaN(r.rating));
    const avgRating = validRatings.length > 0
      ? validRatings.reduce((sum, r) => sum + r.rating, 0) / validRatings.length
      : Number(rating);
    
    try {
      const hDoc = await db.collection('hotels').doc(hotelId).get();
      if (hDoc.exists) {
        await hDoc.ref.update({ 
          avgRating: parseFloat(avgRating.toFixed(1)),
          totalReviews: allReviews.length 
        });
      } else {
        const hSnap = await db.collection('hotels').where('_id', '==', hotelId).limit(1).get();
        if (!hSnap.empty) {
          await hSnap.docs[0].ref.update({
            avgRating: parseFloat(avgRating.toFixed(1)),
            totalReviews: allReviews.length
          });
        }
      }
    } catch (hErr) {
      console.warn('Could not update hotel avg rating:', hErr);
    }

    return NextResponse.json({ 
      review: {
        ...newReview,
        customerId: {
          _id: customerId,
          name: authorName,
          email: session.user.email || '',
          image: authorImage
        }
      } 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Review Creation Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit review' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const hotelId = searchParams.get('hotelId');

    if (!hotelId) return NextResponse.json({ error: 'Hotel ID required' }, { status: 400 });

    // In Cloud Firestore, querying with .where() and .orderBy() on different fields requires a composite index.
    // Querying by hotelId and sorting in memory avoids 500 index errors.
    const reviewsSnap = await db.collection('reviews').where('hotelId', '==', hotelId).get();
    
    const reviews = await Promise.all(reviewsSnap.docs.map(async (doc) => {
      const data = doc.data();
      let customerName = data.guestName || 'Guest';
      let customerEmail = '';
      let customerImage = data.customerImage || '';

      if (data.customerId && (!data.guestName || data.guestName === 'Guest')) {
        try {
          const custDoc = await db.collection('users').doc(data.customerId).get();
          if (custDoc.exists) {
            const uData = custDoc.data() as any;
            customerName = uData.name || customerName;
            customerEmail = uData.email || '';
            customerImage = uData.avatar || uData.image || customerImage;
          }
        } catch (e) {
          // ignore lookup error
        }
      }

      return {
        _id: doc.id,
        ...data,
        customerId: {
          _id: data.customerId,
          name: customerName,
          email: customerEmail,
          image: customerImage
        }
      };
    }));

    reviews.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('Failed to fetch reviews:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}
