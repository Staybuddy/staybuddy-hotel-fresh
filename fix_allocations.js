const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function fixAllocations() {
  const roomsSnap = await db.collection('rooms').get();
  let count = 0;
  for (const doc of roomsSnap.docs) {
    const data = doc.data();
    if (typeof data.staybuddyAllocation === 'string' || typeof data.totalRooms === 'string') {
      const updateData = {};
      if (typeof data.staybuddyAllocation === 'string') {
        updateData.staybuddyAllocation = Number(data.staybuddyAllocation);
        updateData.availableRooms = Number(data.staybuddyAllocation);
      }
      if (typeof data.totalRooms === 'string') {
        updateData.totalRooms = Number(data.totalRooms);
      }
      await db.collection('rooms').doc(doc.id).update(updateData);
      console.log(`Updated room ${doc.id}`);
      count++;
    }
  }
  console.log(`Fixed ${count} rooms.`);
}

fixAllocations().catch(console.error);
