import { db } from '../lib/firebaseAdmin';

async function backfillIds() {
  console.log('Connecting to database to backfill IDs...');
  
  const counterRef = db.collection('metadata').doc('counters');

  // Backfill Hotels
  const hotelsSnap = await db.collection('hotels').orderBy('createdAt', 'asc').get();
  console.log(`Found ${hotelsSnap.docs.length} hotels to process.`);
  
  let currentHotelCount = 1;
  for (const doc of hotelsSnap.docs) {
    const data = doc.data();
    if (!data.hotelId || !data.hotelId.startsWith('SB-H-')) {
      const newId = `SB-H-${currentHotelCount.toString().padStart(3, '0')}`;
      console.log(`Updating hotel ${doc.id} to ${newId}`);
      await doc.ref.update({ hotelId: newId });
      currentHotelCount++;
    } else {
      // Extract number to ensure counter is correct
      const num = parseInt(data.hotelId.replace('SB-H-', ''), 10);
      if (!isNaN(num) && num >= currentHotelCount) {
        currentHotelCount = num + 1;
      }
    }
  }

  // Backfill Bookings
  const bookingsSnap = await db.collection('bookings').orderBy('createdAt', 'asc').get();
  console.log(`Found ${bookingsSnap.docs.length} bookings to process.`);
  
  let currentBookingCount = 1;
  for (const doc of bookingsSnap.docs) {
    const data = doc.data();
    if (!data.bookingId || !data.bookingId.startsWith('SB-')) {
      const newId = `SB-${currentBookingCount.toString().padStart(3, '0')}`;
      console.log(`Updating booking ${doc.id} to ${newId}`);
      await doc.ref.update({ bookingId: newId });
      currentBookingCount++;
    } else {
      const num = parseInt(data.bookingId.replace('SB-', ''), 10);
      if (!isNaN(num) && num >= currentBookingCount) {
        currentBookingCount = num + 1;
      }
    }
  }

  // Update Counters Document
  await counterRef.set({
    hotelCount: currentHotelCount - 1,
    bookingCount: currentBookingCount - 1
  }, { merge: true });

  console.log(`Backfill complete. Counters updated: Hotels=${currentHotelCount-1}, Bookings=${currentBookingCount-1}`);
  process.exit(0);
}

backfillIds().catch(console.error);
