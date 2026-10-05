const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function checkBookings() {
  const bookingsSnap = await db.collection('bookings').get();
  console.log(`Total bookings: ${bookingsSnap.size}`);
  for (const doc of bookingsSnap.docs) {
      console.log(doc.id, doc.data().status, doc.data().hotelId, doc.data().rooms);
  }
}
checkBookings().catch(console.error);
