# CRITICAL DIRECTIVE: ONLY STAYBUDDY.IN

> [!IMPORTANT]
> **Single Source of Truth**: All tasks, modifications, brand assets, API integrations, payment callbacks, SEO configs, manifests, and deployments must be executed exclusively for and on **staybuddy.in** (`https://www.staybuddy.in`).

## Mandatory Operating Rules:
1. **Target Domain**:
   - Primary domain is strictly `https://www.staybuddy.in`.
   - Never use localhost or placeholder URLs for production configurations, metadata, or canonical links.
2. **Branding & Assets**:
   - All branding, favicons, logos, and PWA icons belong strictly to StayBuddy (`https://www.staybuddy.in`).
3. **Deployments**:
   - Production deployments must always alias to `https://www.staybuddy.in` via `npx --yes vercel --prod --yes`.
4. **Partner & Extranet**:
   - Partner portal URL: `https://www.staybuddy.in/partner`
   - Customer booking flow: `https://www.staybuddy.in/hotels`
5. **Successful Booking Notification Rule (Strict 3-Email Guarantee)**:
   - **Every successful booking ALWAYS carries 3 emails**:
     1. **Client / Guest Email (`sendBookingConfirmationEmail`)**: Sent to `guestEmail` / `customerId.email` containing booking confirmation & tax invoice.
     2. **Partner / Hotel Email (`sendPartnerNotificationEmail`)**: Sent to `hotel.contactEmail` / `hotel.partnerEmail` / `hotel.email` containing new booking alert with guest name, phone, room, check-in, check-out, and Partner B2B Payout (STRICTLY pure B2B contract rate, NEVER B2C).
     3. **Admin Email (`sendPaymentAuditEmail`)**: Sent to StayBuddy Admin (`staybuddyhotels@gmail.com` / `ADMIN_AUDIT_EMAIL`) containing instant payment audit alert with Hotel ID, Booking ID, Amount Received, and Razorpay transaction details.
   - Any booking reconciliation or confirmation flow must guarantee all 3 emails are dispatched.
6. **Strict Partner Pricing Separation (Pure B2B Only - NEVER B2C)**:
   - When communicating with hotel partners (via Extranet `/partner`, alert emails `sendPartnerNotificationEmail`, WhatsApp vouchers, settlement reports, and dashboard payouts):
   - **STRICTLY AND EXCLUSIVELY SHOW PURE B2B CONTRACT RATES & PAYOUTS**.
   - **NEVER** expose guest B2C pricing, StayBuddy retail markups, client invoices, or client gross totals to hotel partners under any circumstances.
   - All partner notifications must only display `partnerPricePerNight` and `totalPartnerPrice` in StayBuddy's official brand theme.
