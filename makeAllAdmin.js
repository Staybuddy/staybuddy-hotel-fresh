const mongoose = require('mongoose');
const uri = "mongodb://localhost:27017/staybuddy";
mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    const res = await db.collection('users').updateMany({}, { $set: { role: 'admin' } });
    console.log("Updated", res.modifiedCount, "users to admin.");
    process.exit(0);
  });
