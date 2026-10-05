require('dotenv').config({ path: '.env.local' });
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Check if app already initialized
let app;
try {
  app = initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : '',
    })
  });
} catch(e) {
  // Ignore
}

const db = getFirestore(app);

async function fix() {
  const roomsSnap = await db.collection('rooms').get();
  let fixed = 0;
  
  for (const doc of roomsSnap.docs) {
    const data = doc.data();
    
    let needsUpdate = false;
    let updates = {};

    // 1. Fix string allocations and bad defaults
    let alloc = data.staybuddyAllocation;
    let total = data.totalRooms || 1;

    // Convert total to number if it's a string
    if (typeof total === 'string') {
        total = parseInt(total) || 1;
        updates.totalRooms = total;
        needsUpdate = true;
    }

    if (typeof alloc === 'string' || alloc === 1) {
        if (alloc === 1 && total > 1) {
            // User likely fell victim to the default 1 allocation when adding property
            updates.staybuddyAllocation = total;
            updates.availableRooms = total;
            needsUpdate = true;
        } else if (typeof alloc === 'string') {
            updates.staybuddyAllocation = parseInt(alloc) || total;
            updates.availableRooms = updates.staybuddyAllocation;
            needsUpdate = true;
        }
    }

    if (needsUpdate) {
        await doc.ref.update(updates);
        console.log(`Fixed Room ${doc.id} (type: ${data.type}): ${JSON.stringify(updates)}`);
        fixed++;
    }
  }
  
  console.log(`Fixed ${fixed} rooms.`);
}

fix();
