import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const snapshot = await db.collection('bookings').orderBy('createdAt', 'desc').get();
    
    // Manual pseudo-populate (best effort for admin dashboard)
    const bookings = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      let hotelData = { name: 'Unknown', city: 'Unknown' };
      if (data.hotelId) {
        const hotelDoc = await db.collection('hotels').doc(data.hotelId).get();
        if (hotelDoc.exists) hotelData = hotelDoc.data() as any;
      }
      
      let customerData = { name: 'Unknown', email: 'Unknown' };
      if (data.customerId) {
        const custDoc = await db.collection('users').doc(data.customerId).get();
        if (custDoc.exists) customerData = custDoc.data() as any;
      }

      return { 
        _id: doc.id, 
        ...data,
        hotelId: { _id: data.hotelId, name: hotelData.name, city: hotelData.city },
        customerId: { _id: data.customerId, name: customerData.name, email: customerData.email }
      };
    }));
    
    return NextResponse.json({ bookings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
