const admin = require("firebase-admin");

// Path to your service account key
const serviceAccount = require("./serviceAccountKey.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function setAdmin() {
  const email = "staybuddyhotels@gmail.com";
  try {
    const snapshot = await db.collection("users").where("email", "==", email).get();
    
    if (snapshot.empty) {
      console.log(`No user found with email ${email}. Creating new admin user.`);
      await db.collection("users").add({
        email: email,
        role: "admin",
        createdAt: new Date().toISOString()
      });
      console.log("Successfully created user and set as admin.");
    } else {
      let updated = false;
      snapshot.forEach(async (doc) => {
        await db.collection("users").doc(doc.id).update({ role: "admin" });
        console.log(`Updated existing user ${doc.id} with admin role.`);
        updated = true;
      });
    }
    console.log("Operation complete.");
  } catch (err) {
    console.error("Error setting admin:", err);
  }
}

setAdmin();
