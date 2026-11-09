/* eslint-disable */
// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const paramEmail = (searchParams.get('email') || '').trim().toLowerCase();
    const sessionEmail = (session?.user?.email || '').trim().toLowerCase();
    const userEmail = sessionEmail || paramEmail;
    const sessionUserId = (session?.user as any)?.id || (session?.user as any)?._id || null;

    if (!userEmail && !sessionUserId) {
      return NextResponse.json({ hasUnreviewedStay: false });
    }

    const bookingsMap = new Map();

    // 1. Query by guest email
    if (userEmail) {
      try {
        const snap = await db.collection('bookings')
          .where('guestEmail', '==', userEmail)
          .get();
        snap.forEach(doc => {
          bookingsMap.set(doc.id, { _id: doc.id, ...doc.data() });
        });
      } catch (err) {
        console.warn('Error fetching bookings by guestEmail:', err);
      }
    }

    // 2. Query by customerId if user is authenticated
    if (sessionUserId) {
      try {
        const snap = await db.collection('bookings')
          .where('customerId', '==', sessionUserId)
          .get();
        snap.forEach(doc => {
          if (!bookingsMap.has(doc.id)) {
            bookingsMap.set(doc.id, { _id: doc.id, ...doc.data() });
          }
        });
      } catch (err) {
        console.warn('Error fetching bookings by customerId:', err);
      }
    }

    const allBookings = Array.from(bookingsMap.values());
    const now = Date.now();

    // 3. Filter for paid, confirmed/completed, checked-out, unreviewed stays
    const eligibleBookings = allBookings.filter(b => {
      // Skip if already reviewed
      if (b.isReviewed === true) return false;

      // STRICT REQUIREMENT: Payment MUST be successful / paid
      const isPaid = b.paymentStatus === 'paid' || b.paid === true;
      if (!isPaid) return false;

      // STRICT REQUIREMENT: Never show review for cancelled, failed, pending, or refunded bookings
      if (b.status === 'cancelled' || b.status === 'failed' || b.status === 'pending' || b.status === 'refunded') {
        return false;
      }

      // Must be confirmed or completed
      if (b.status !== 'confirmed' && b.status !== 'completed') {
        return false;
      }

      // Must have a valid checkout date
      if (!b.checkOut) return false;

      const checkOutMs = new Date(b.checkOut).getTime();
      if (isNaN(checkOutMs)) return false;

      // STRICT: ONLY AFTER CHECK-OUT! If checkout time is in the future, never prompt review!
      if (checkOutMs > now) {
        return false;
      }

      // Skip ancient bookings older than 14 days to prevent stale popups
      const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);
      if (checkOutMs < fourteenDaysAgo) {
        return false;
      }

      return true;
    });

    if (eligibleBookings.length === 0) {
      return NextResponse.json({ hasUnreviewedStay: false });
    }

    // Sort descending by checkout date (most recently checked out stay first)
    eligibleBookings.sort((a, b) => {
      const timeA = new Date(a.checkOut).getTime() || 0;
      const timeB = new Date(b.checkOut).getTime() || 0;
      return timeB - timeA;
    });

    const targetBooking = eligibleBookings[0];

    // Must have a valid hotelId
    if (!targetBooking.hotelId) {
      return NextResponse.json({ hasUnreviewedStay: false });
    }

    // Auto-update status to 'completed' in Firestore if still marked 'confirmed'
    if (targetBooking.status === 'confirmed') {
      try {
        await db.collection('bookings').doc(targetBooking._id).update({
          status: 'completed',
          updatedAt: new Date().toISOString()
        });
        targetBooking.status = 'completed';
      } catch (upErr) {
        console.warn('Could not auto-mark booking completed:', upErr);
      }
    }

    // 4. Fetch hotel details - STRICT: Hotel MUST exist in database
    let hDoc = await db.collection('hotels').doc(targetBooking.hotelId).get();
    if (!hDoc.exists) {
      const hSnap = await db.collection('hotels').where('_id', '==', targetBooking.hotelId).limit(1).get();
      if (!hSnap.empty) hDoc = hSnap.docs[0];
    }
    if (!hDoc || !hDoc.exists) {
      // Hotel was deleted or does not exist - NEVER prompt review for ghost hotels!
      return NextResponse.json({ hasUnreviewedStay: false });
    }

    const hData = hDoc.data();
    if (!hData?.name) {
      return NextResponse.json({ hasUnreviewedStay: false });
    }

    const hotelInfo = {
      _id: hDoc.id,
      name: hData.name,
      city: hData?.city || '',
      address: hData?.address || '',
      image: Array.isArray(hData?.images) && hData.images.length > 0 ? hData.images[0] : '',
      avgRating: typeof hData?.avgRating === 'number' ? hData.avgRating : 4.5
    };

    return NextResponse.json({
      hasUnreviewedStay: true,
      booking: {
        _id: targetBooking._id,
        bookingId: targetBooking.bookingId || targetBooking._id,
        hotelId: targetBooking.hotelId,
        checkIn: targetBooking.checkIn,
        checkOut: targetBooking.checkOut,
        roomSummary: targetBooking.roomSummary || 'Deluxe Room',
        guestName: targetBooking.guestName || session?.user?.name || 'Valued Guest',
        guestEmail: targetBooking.guestEmail || userEmail
      },
      hotel: hotelInfo
    });
  } catch (error: any) {
    console.error('Error in unreviewed booking route:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

