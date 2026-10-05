require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  })
});

const db = getFirestore(app);

async function check() {
  const roomsSnap = await db.collection('rooms').get();
  console.log("Total rooms:", roomsSnap.size);
  roomsSnap.forEach(doc => {
    const data = doc.data();
    console.log(`Room ${doc.id}: hotelId=${data.hotelId}, staybuddyAllocation=${data.staybuddyAllocation} (type: ${typeof data.staybuddyAllocation})`);
  });
}
check();
