import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from '../lib/firebaseAdmin';
import { sendBookingConfirmationEmail, sendPartnerNotificationEmail, sendPaymentAuditEmail } from '../lib/email';

async function resendEmailsForGvpBooking() {
  console.log("Fetching booking SB-033 / Hotel GVP...");
  
  const bSnap = await db.collection('bookings').doc('y8uYX35hbghIzLh4HtCJ').get();
  if (!bSnap.exists) {
    throw new Error("Booking y8uYX35hbghIzLh4HtCJ not found");
  }

  const bData = bSnap.data() as any;
  const populatedBooking = { _id: bSnap.id, ...bData };

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

  console.log("Booking Loaded:", {
    bookingId: populatedBooking.bookingId,
    hotelName: populatedBooking.hotelId?.name,
    hotelCity: populatedBooking.hotelId?.city,
    partnerEmail: populatedBooking.hotelId?.contactEmail || populatedBooking.hotelId?.partnerEmail,
    guestName: populatedBooking.guestName,
    guestEmail: populatedBooking.guestEmail,
    totalPrice: populatedBooking.totalPrice,
    totalPartnerPrice: populatedBooking.totalPartnerPrice,
  });

  console.log("\n==========================================");
  console.log("1. Dispatching Client / Guest Confirmation Email...");
  console.log(`Recipient: ${populatedBooking.guestEmail}`);
  await sendBookingConfirmationEmail(populatedBooking);
  console.log("✓ Guest confirmation email dispatched successfully.");

  console.log("\n==========================================");
  console.log("2. Dispatching Hotel Partner Notification Email...");
  const partnerEmail = (populatedBooking.hotelId?.contactEmail || populatedBooking.hotelId?.partnerEmail || 'chinmainaidukotta@gmail.com').trim();
  console.log(`Recipient: ${partnerEmail}`);
  await sendPartnerNotificationEmail(populatedBooking, partnerEmail);
  console.log("✓ Partner notification email dispatched successfully.");

  console.log("\n==========================================");
  console.log("3. Dispatching Admin Payment Audit Alert...");
  const adminEmail = process.env.ADMIN_AUDIT_EMAIL || 'staybuddyhotels@gmail.com';
  console.log(`Recipient: ${adminEmail}`);
  await sendPaymentAuditEmail(populatedBooking, {
    paymentId: bData.razorpayPaymentId || 'pay_U2TMWunpZ3GQFU',
    orderId: bData.razorpayOrderId || 'order_U2TMHbRpz8zWRV',
    paymentMethod: bData.paymentMethod || 'razorpay',
    source: 'resend_audit'
  });
  console.log("✓ Admin payment audit email dispatched successfully.");

  console.log("\n==========================================");
  console.log("All 3 emails have been successfully sent via Gmail SMTP!");
}

resendEmailsForGvpBooking().then(() => process.exit(0)).catch(err => {
  console.error("Error resending emails:", err);
  process.exit(1);
});
