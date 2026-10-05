const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();
(async () => {
  const rooms = await db.collection('rooms').get();
  let updated = 0;
  for (const doc of rooms.docs) {
    const data = doc.data();
    if (data.totalRooms && data.staybuddyAllocation !== data.totalRooms) {
      await doc.ref.update({ staybuddyAllocation: Number(data.totalRooms) });
      updated++;
    }
  }
  console.log(`Updated ${updated} rooms.`);
  process.exit(0);
})();
