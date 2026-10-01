import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../lib/firebaseAdmin';
import { sendBookingConfirmationEmail, sendPartnerNotificationEmail } from '../lib/email';

async function sendRecentEmails() {
  console.log('Connecting to databases...');
  
  // Get the most recent 3 bookings
  const snapshot = await db.collection('bookings').orderBy('createdAt', 'desc').limit(3).get();
  
  for (const doc of snapshot.docs) {
    const booking: Record<string, unknown> = { _id: doc.id, ...doc.data() };
    console.log(`Processing booking ${booking._id}...`);
    
    // Populate hotel
    if (booking.hotelId) {
      const hSnap = await db.collection('hotels').doc(booking.hotelId as string).get();
      if (hSnap.exists) {
        booking.hotelId = { _id: hSnap.id, ...hSnap.data() };
      }
    }
    
    // Populate customer
    if (booking.customerId) {
      const customerDoc = await db.collection('users').doc(booking.customerId as string).get();
      if (customerDoc.exists) {
        const customer = customerDoc.data() as Record<string, unknown>;
        booking.customerId = { _id: customerDoc.id, name: customer.name, email: customer.email };
      }
    }
    
    // Send emails
    const customerEmail = (booking.customerId as { email?: string })?.email;
    console.log(`Sending customer email to ${customerEmail}...`);
    await sendBookingConfirmationEmail(booking);
    
    const partnerId = (booking.hotelId as { partnerId?: string })?.partnerId;
    if (partnerId) {
      const partnerDoc = await db.collection('users').doc(partnerId).get();
      if (partnerDoc.exists && partnerDoc.data()?.email) {
        console.log(`Sending partner email to ${partnerDoc.data()!.email}...`);
        await sendPartnerNotificationEmail(booking, partnerDoc.data()!.email as string);
      }
    }
  }
  
  console.log('Finished sending past emails!');
  process.exit(0);
}

sendRecentEmails().catch(console.error);
