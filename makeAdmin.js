const mongoose = require('mongoose');
const uri = "mongodb://localhost:27017/staybuddy";

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const admin = await db.collection('users').findOne({ role: 'admin' });
    if (admin) {
        console.log("Found admin:", admin.phone || admin.email);
    } else {
        console.log("No admin found. Setting all users to admin...");
        await db.collection('users').updateMany({}, { $set: { role: 'admin' } });
        console.log("Done.");
    }
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
