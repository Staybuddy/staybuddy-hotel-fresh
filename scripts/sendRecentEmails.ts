import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../lib/firebaseAdmin';
import { sendBookingConfirmationEmail, sendPartnerNotificationEmail } from '../lib/email';
import connectDB from '../lib/mongodb';
import User from '../models/User';

async function sendRecentEmails() {
  console.log('Connecting to databases...');
  await connectDB();
  
  // Get the most recent 3 bookings
  const snapshot = await db.collection('bookings').orderBy('createdAt', 'desc').limit(3).get();
  
  for (const doc of snapshot.docs) {
    let booking: any = { _id: doc.id, ...doc.data() };
    console.log(`Processing booking ${booking._id}...`);
    
    // Populate hotel
    if (booking.hotelId) {
      const hSnap = await db.collection('hotels').doc(booking.hotelId).get();
      if (hSnap.exists) {
        booking.hotelId = { _id: hSnap.id, ...hSnap.data() };
      }
    }
    
    // Populate customer
    if (booking.customerId) {
      const customer = await User.findById(booking.customerId);
      if (customer) {
        booking.customerId = { _id: customer._id, name: customer.name, email: customer.email };
      }
    }
    
    // Send emails
    console.log(`Sending customer email to ${booking.customerId?.email}...`);
    await sendBookingConfirmationEmail(booking);
    
    if (booking.hotelId?.partnerId) {
      const partner = await User.findById(booking.hotelId.partnerId);
      if (partner && partner.email) {
        console.log(`Sending partner email to ${partner.email}...`);
        await sendPartnerNotificationEmail(booking, partner.email);
      }
    }
  }
  
  console.log('Finished sending past emails!');
  process.exit(0);
}

sendRecentEmails().catch(console.error);
