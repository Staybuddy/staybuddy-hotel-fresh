const mongoose = require('mongoose');
const uri = "mongodb://localhost:27017/staybuddy"; // adjust if needed
const adminEmail = "staybuddyhotels@gmail.com";

mongoose.connect(uri)
  .then(async () => {
    const db = mongoose.connection.db;
    
    // First, check if user exists
    const user = await db.collection('users').findOne({ email: adminEmail });
    
    if (user) {
        await db.collection('users').updateOne(
            { email: adminEmail }, 
            { $set: { role: 'admin' } }
        );
        console.log(`Successfully updated ${adminEmail} to have admin role.`);
    } else {
        // Create user if they don't exist
        await db.collection('users').insertOne({
            email: adminEmail,
            role: 'admin',
            createdAt: new Date()
        });
        console.log(`User ${adminEmail} did not exist. Created user and set as admin.`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error("Error connecting or updating DB:", err);
    process.exit(1);
  });
