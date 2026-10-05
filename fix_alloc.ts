import { db } from './lib/firebaseAdmin';

async function fix() {
  const roomsSnap = await db.collection('rooms').get();
  let fixed = 0;
  
  for (const doc of roomsSnap.docs) {
    const data = doc.data();
    
    let needsUpdate = false;
    let updates: any = {};

    let alloc = data.staybuddyAllocation;
    let total = data.totalRooms || 1;

    if (typeof total === 'string') {
        total = parseInt(total) || 1;
        updates.totalRooms = total;
        needsUpdate = true;
    }

    if (typeof alloc === 'string' || alloc === 1) {
        if (alloc === 1 && total > 1) {
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
