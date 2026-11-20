import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../lib/firebaseAdmin';
import { sendBookingConfirmationEmail, sendPartnerNotificationEmail, sendPaymentAuditEmail } from '../lib/email';

async function sendForBooking(bookingIdOrDocId: string) {
  let docSnap = await db.collection('bookings').doc(bookingIdOrDocId).get();
  if (!docSnap.exists) {
    const qSnap = await db.collection('bookings').where('bookingId', '==', bookingIdOrDocId).limit(1).get();
    if (!qSnap.empty) {
      docSnap = qSnap.docs[0];
    } else {
      console.error(`Booking ${bookingIdOrDocId} not found.`);
      return;
    }
  }

  const bData = docSnap.data() as any;
  const populatedBooking = { _id: docSnap.id, ...bData };

  // Fetch hotel details
  if (bData.hotelId) {
    const hSnap = await db.collection('hotels').doc(bData.hotelId).get();
    if (hSnap.exists) {
      populatedBooking.hotelId = { _id: hSnap.id, ...hSnap.data() };
    }
  }

  // Fetch customer details
  if (bData.customerId) {
    const cSnap = await db.collection('users').doc(bData.customerId).get();
    if (cSnap.exists) {
      const cData = cSnap.data() as any;
      populatedBooking.customerId = { _id: cSnap.id, name: cData.name, email: cData.email };
    }
  }

  console.log(`\n============================================================`);
  console.log(`Processing Booking ${populatedBooking.bookingId || populatedBooking._id}`);
  console.log(`Hotel: ${populatedBooking.hotelId?.name} (${populatedBooking.hotelId?.city})`);
  console.log(`Guest: ${populatedBooking.guestName} (${populatedBooking.guestEmail})`);
  console.log(`Room Summary: ${populatedBooking.roomSummary}`);

  const partnerEmail = (populatedBooking.hotelId?.contactEmail || populatedBooking.hotelId?.partnerEmail || 'chinmainaidukotta@gmail.com').trim();
  const adminEmail = process.env.ADMIN_AUDIT_EMAIL || 'staybuddyhotels@gmail.com';

  console.log(`\n1. Sending Client Confirmation Email to: ${populatedBooking.guestEmail}...`);
  await sendBookingConfirmationEmail(populatedBooking);

  console.log(`2. Sending Hotel Partner Alert Email to: ${partnerEmail}...`);
  await sendPartnerNotificationEmail(populatedBooking, partnerEmail);

  console.log(`3. Sending Admin Audit Alert Email to: ${adminEmail}...`);
  await sendPaymentAuditEmail(populatedBooking, {
    paymentId: bData.razorpayPaymentId || 'pay_U2TMWunpZ3GQFU',
    orderId: bData.razorpayOrderId || 'order_U2TMHbRpz8zWRV',
    paymentMethod: bData.paymentMethod || 'razorpay',
    source: 'resend_audit'
  });

  console.log(`✓ Completed all 3 emails for ${populatedBooking.bookingId}`);
}

async function main() {
  // Send for SB-033 (the earlier booking made on Hotel GVP)
  await sendForBooking('SB-033');
  // Also send for SB-034
  await sendForBooking('SB-034');
}

main().then(() => {
  console.log('\nAll bookings processed and sent successfully via Gmail SMTP!');
  process.exit(0);
}).catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
