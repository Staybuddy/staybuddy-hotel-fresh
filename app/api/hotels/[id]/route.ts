import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    // Check if the id is a document ID
    const hotelDoc = await db.collection('hotels').doc(resolvedParams.id).get();
    let hotel: any = null;

    if (hotelDoc.exists) {
      hotel = { _id: hotelDoc.id, ...hotelDoc.data() };
    } else {
      // It might be a string MongoDB ID or we might have indexed it by _id in Firestore
      const snapshot = await db.collection('hotels').where('_id', '==', resolvedParams.id).limit(1).get();
      if (!snapshot.empty) {
        hotel = { _id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
      }
    }

    if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

    // Fetch rooms from Firestore if not embedded
    let rooms: any[] = [];
    if (hotel.rooms && hotel.rooms.length > 0) {
      rooms = hotel.rooms;
    } else {
      const roomsSnapshot = await db.collection('rooms').where('hotelId', '==', resolvedParams.id).where('isActive', '==', true).get();
      rooms = roomsSnapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    }
    
    // Note: Reviews are not fully migrated, but we will return an empty array for now to prevent crashes
    const reviews: any[] = [];

    return NextResponse.json({ hotel, rooms, reviews });
  } catch (error) {
    console.error('Hotels [id] GET error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    
    let docRef = db.collection('hotels').doc(resolvedParams.id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      // Fallback query
      const snapshot = await db.collection('hotels').where('_id', '==', resolvedParams.id).limit(1).get();
      if (snapshot.empty) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      docRef = db.collection('hotels').doc(snapshot.docs[0].id);
    }
    
    await docRef.update(body);
    const updated = await docRef.get();
    
    return NextResponse.json({ hotel: { _id: updated.id, ...updated.data() } });
  } catch (error) {
    console.error('Hotels [id] PUT error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    
    let docRef = db.collection('hotels').doc(resolvedParams.id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      const snapshot = await db.collection('hotels').where('_id', '==', resolvedParams.id).limit(1).get();
      if (snapshot.empty) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });
      docRef = db.collection('hotels').doc(snapshot.docs[0].id);
    }
    
    await docRef.delete();
    return NextResponse.json({ message: 'Hotel deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
