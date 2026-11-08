import { db } from '@/lib/firebaseAdmin';
import { sendBookingConfirmationEmail, sendPartnerNotificationEmail, sendPaymentAuditEmail } from '@/lib/email';

export interface PaymentReconcileOptions {
  paymentId?: string;
  orderId?: string;
  signature?: string;
  paymentMethod?: string;
  source: 'client_verify' | 'razorpay_webhook' | 'background_recheck' | 'manual_admin';
  rawDetails?: any;
}

/**
 * Reconciles and confirms a booking once payment has been captured/verified by Razorpay.
 * Can be safely called from:
 * 1. Client-side payment verification (/api/payments/verify)
 * 2. Razorpay Server Webhooks (/api/payments/webhook)
 * 3. Background/My-Bookings Auto-Recheck (/api/payments/recheck)
 */
export async function reconcileBookingPayment(bookingId: string, options: PaymentReconcileOptions) {
  if (!bookingId) {
    throw new Error('Booking ID is required for reconciliation');
  }

  // Find booking document by doc ID or _id
  let bookingRef = db.collection('bookings').doc(bookingId);
  let bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    const snap = await db.collection('bookings').where('_id', '==', bookingId).limit(1).get();
    if (snap.empty) {
      throw new Error(`Booking ${bookingId} not found in database`);
    }
    bookingRef = snap.docs[0].ref;
    bookingSnap = snap.docs[0];
  }

  const existingBooking = bookingSnap.data() as any;

  // If already confirmed and paid, don't re-trigger notification emails
  if (existingBooking.paymentStatus === 'paid' && existingBooking.status === 'confirmed') {
    return {
      alreadyPaid: true,
      booking: { _id: bookingSnap.id, ...existingBooking }
    };
  }

  const now = new Date().toISOString();
  const updateData: any = {
    paymentStatus: 'paid',
    status: 'confirmed',
    updatedAt: now,
    paidAt: existingBooking.paidAt || now,
    paymentVerifiedVia: options.source,
  };

  if (options.paymentId) updateData.razorpayPaymentId = options.paymentId;
  if (options.orderId) updateData.razorpayOrderId = options.orderId;
  if (options.paymentMethod) updateData.paymentMethod = options.paymentMethod;

  await bookingRef.update(updateData);

  const updatedSnap = await bookingRef.get();
  const updatedBookingData = updatedSnap.data() as any;

  // Prepare populated booking for confirmation emails
  const populatedBooking = { _id: updatedSnap.id, ...updatedBookingData };

  // Fetch hotel details
  let hotel: any = null;
  if (updatedBookingData.hotelId) {
    try {
      const hSnap = await db.collection('hotels').doc(updatedBookingData.hotelId).get();
      if (hSnap.exists) {
        hotel = { _id: hSnap.id, ...hSnap.data() };
        populatedBooking.hotelId = hotel;
      } else {
        const hQuery = await db.collection('hotels').where('_id', '==', updatedBookingData.hotelId).limit(1).get();
        if (!hQuery.empty) {
          hotel = { _id: hQuery.docs[0].id, ...hQuery.docs[0].data() };
          populatedBooking.hotelId = hotel;
        }
      }
    } catch (e) {
      console.warn('Error fetching hotel for payment reconciliation:', e);
    }
  }

  // Fetch customer details
  let customer: any = null;
  if (updatedBookingData.customerId) {
    try {
      const cSnap = await db.collection('users').doc(updatedBookingData.customerId).get();
      if (cSnap.exists) {
        customer = cSnap.data();
        populatedBooking.customerId = { name: customer.name, email: customer.email, _id: cSnap.id };
      }
    } catch (e) {
      console.warn('Error fetching customer for payment reconciliation:', e);
    }
  }

  // Send confirmation emails
  try {
    sendBookingConfirmationEmail(populatedBooking).catch(err => {
      console.error('Failed to send booking confirmation email:', err);
    });

    // Send internal audit email to StayBuddy accounts team
    sendPaymentAuditEmail(populatedBooking, {
      paymentId: options.paymentId,
      orderId: options.orderId,
      paymentMethod: options.paymentMethod,
      source: options.source
    }).catch(err => {
      console.error('Failed to send payment audit email:', err);
    });

    if (hotel) {
      const notificationEmails = new Set<string>();
      
      // Strict Partner Email Notification:
      // When an admin adds a property and enters a specific hotel email in Partner Extranet,
      // the partner booking alert must ONLY be sent to that designated hotel email (contactEmail / partnerEmail).
      // StayBuddy admin emails must NEVER receive the hotel partner notification (Admin already receives sendPaymentAuditEmail).
      if (hotel.contactEmail && typeof hotel.contactEmail === 'string' && hotel.contactEmail.includes('@')) {
        notificationEmails.add(hotel.contactEmail.trim().toLowerCase());
      }
      if (hotel.partnerEmail && typeof hotel.partnerEmail === 'string' && hotel.partnerEmail.includes('@')) {
        notificationEmails.add(hotel.partnerEmail.trim().toLowerCase());
      }

      // Fallback: If no dedicated hotel email was configured, look up partner user account,
      // but ensure we NEVER dispatch partner emails to an admin's personal or StayBuddy account.
      if (notificationEmails.size === 0) {
        const partnerUserRef = hotel.partnerId || hotel.ownerId || hotel.userId;
        if (partnerUserRef) {
          if (typeof partnerUserRef === 'string') {
            try {
              const pSnap = await db.collection('users').doc(partnerUserRef).get();
              if (pSnap.exists) {
                const uData = pSnap.data();
                const uEmail = uData?.email?.trim().toLowerCase();
                const isAdmin = uData?.role === 'admin' || (uEmail && uEmail.includes('staybuddy'));
                if (!isAdmin && uEmail) {
                  notificationEmails.add(uEmail);
                }
              }
            } catch (_) {}
          } else if (typeof partnerUserRef === 'object' && partnerUserRef.email) {
            const uEmail = partnerUserRef.email.trim().toLowerCase();
            const isAdmin = partnerUserRef.role === 'admin' || uEmail.includes('staybuddy');
            if (!isAdmin && uEmail) {
              notificationEmails.add(uEmail);
            }
          }
        }
      }

      console.log(`[Reconcile] Dispatching hotel partner notification to ${notificationEmails.size} email(s):`, Array.from(notificationEmails));

      notificationEmails.forEach(email => {
        sendPartnerNotificationEmail(populatedBooking, email).catch(err => {
          console.error(`Failed to send partner notification email to ${email}:`, err);
        });
      });
    }
  } catch (emailErr) {
    console.error('Email dispatch error in payment reconciliation:', emailErr);
  }

  // Handle referral reward if applicable
  try {
    if (customer && customer.referredBy && !customer.referralRewardClaimed) {
      const referrerRef = db.collection('users').doc(customer.referredBy);
      const referrerSnap = await referrerRef.get();
      if (referrerSnap.exists) {
        const referrer = referrerSnap.data() as any;
        if ((referrer.referralCount || 0) < 5) {
          await referrerRef.update({
            walletBalance: (referrer.walletBalance || 0) + 20,
            referralCount: (referrer.referralCount || 0) + 1
          });

          await db.collection('users').doc(updatedBookingData.customerId).update({ referralRewardClaimed: true });

          const txRef = db.collection('wallet_transactions').doc();
          await txRef.set({
            _id: txRef.id,
            userId: referrerSnap.id,
            amount: 20,
            type: 'referral_reward',
            description: `Referral reward for ${customer.name || 'friend'}'s first booking`,
            createdAt: now
          });
        }
      }
    }
  } catch (refErr) {
    console.error('Referral reward processing error:', refErr);
  }

  return {
    alreadyPaid: false,
    booking: populatedBooking
  };
}
