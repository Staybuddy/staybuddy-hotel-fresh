import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const wishlistIds = userData?.wishlist || [];

    if (wishlistIds.length === 0) {
      return NextResponse.json({ wishlist: [] });
    }

    // Fetch the actual hotels from wishlist
    // Batch in chunks of 10 if there are many, but usually it's fine for small lists
    // Or fetch all hotels and filter.
    // For safety, we will just fetch them one by one or using 'in' (limit 10).
    const hotelPromises = wishlistIds.map((id: string) => db.collection('hotels').doc(id).get());
    const hotelDocs = await Promise.all(hotelPromises);
    
    const hotels = hotelDocs
      .filter(doc => doc.exists)
      .map(doc => ({ _id: doc.id, ...doc.data() }));

    return NextResponse.json({ wishlist: hotels, wishlistIds });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { hotelId, action } = await request.json(); // action = 'add' or 'remove'
    if (!hotelId) return NextResponse.json({ error: 'Hotel ID is required' }, { status: 400 });

    const userId = session.user.id;
    const userRef = db.collection('users').doc(userId);

    if (action === 'add') {
      await userRef.update({
        wishlist: FieldValue.arrayUnion(hotelId)
      });
    } else if (action === 'remove') {
      await userRef.update({
        wishlist: FieldValue.arrayRemove(hotelId)
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, hotelId, action });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
