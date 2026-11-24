import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_app_password') {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Free testing email provided by Nodemailer (Ethereal)
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("=========================================");
    console.log("Using Free Ethereal Email for Testing");
    console.log("=========================================");
  }
  return transporter;
}

export function getRoomCategoryDisplay(booking: any): string {
  if (booking.roomSummary) {
    return booking.roomSummary;
  }
  if (Array.isArray(booking.selectedRooms) && booking.selectedRooms.length > 0) {
    return booking.selectedRooms
      .map((sr: any) => `${sr.quantity > 1 ? `${sr.quantity} × ` : ''}${sr.roomType || 'Standard Room'}`)
      .join(', ');
  }
  if (typeof booking.roomId === 'object' && booking.roomId?.type) {
    return `${booking.rooms ? `${booking.rooms} × ` : ''}${booking.roomId.type}`;
  }
  if (booking.roomType) {
    return `${booking.rooms ? `${booking.rooms} × ` : ''}${booking.roomType}`;
  }
  return 'Standard Room';
}

export function getMealPlanDisplay(planCode: string = 'CP'): { code: string; label: string; badgeHtml: string } {
  const code = (planCode || 'CP').toUpperCase().trim();
  if (code === 'CP') {
    return {
      code: 'CP',
      label: 'Room with Free Breakfast Included (CP)',
      badgeHtml: '<span style="background: #ecfdf5; color: #047857; border: 1.5px solid #a7f3d0; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.9em; display: inline-block;">🍳 Room with Free Breakfast (CP)</span>'
    };
  }
  if (code === 'MAP') {
    return {
      code: 'MAP',
      label: 'Room with Breakfast & Dinner Included (MAP)',
      badgeHtml: '<span style="background: #fef3c7; color: #b45309; border: 1.5px solid #fde68a; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.9em; display: inline-block;">🍽️ Room + Breakfast & Dinner (MAP)</span>'
    };
  }
  if (code === 'AP') {
    return {
      code: 'AP',
      label: 'Room with All Meals Included (AP)',
      badgeHtml: '<span style="background: #eff6ff; color: #1d4ed8; border: 1.5px solid #bfdbfe; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.9em; display: inline-block;">🍱 Room with All Meals (AP)</span>'
    };
  }
  return {
    code: 'EP',
    label: 'Room Only (EP)',
    badgeHtml: '<span style="background: #f3f4f6; color: #4b5563; border: 1.5px solid #e5e7eb; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.9em; display: inline-block;">🛏️ Room Only (EP)</span>'
  };
}

export function getDirectionsUrl(hotel: any, hotelName: string, hotelCity: string): string {
  if (hotel && typeof hotel === 'object') {
    if (hotel.coordinates?.lat && hotel.coordinates?.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${hotel.coordinates.lat},${hotel.coordinates.lng}`;
    }
    if (hotel.address) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${hotel.name || hotelName}, ${hotel.address}`)}`;
    }
  }
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${hotelName} ${hotelCity}`)}`;
}

export async function sendBookingConfirmationEmail(booking: any) {
  const { customerId, hotelId, checkIn, checkOut, totalPrice, _id, guestEmail, guestName } = booking;
  
  const hotelName = (typeof hotelId === 'object' && hotelId?.name) ? hotelId.name : (booking.hotelName || 'StayBuddy Hotel');
  const hotelCity = (typeof hotelId === 'object' && hotelId?.city) ? hotelId.city : (booking.hotelCity || '');
  const roomCategory = getRoomCategoryDisplay(booking);
  const rawMealPlan = booking.ratePlan || (typeof booking.roomId === 'object' ? booking.roomId?.ratePlan : null) || 'CP';
  const mealPlanInfo = getMealPlanDisplay(rawMealPlan);
  const directionsUrl = getDirectionsUrl(hotelId, hotelName, hotelCity);

  const checkInStr = new Date(checkIn).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const checkOutStr = new Date(checkOut).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const recipientEmail = guestEmail || customerId?.email;
  const recipientName = guestName || customerId?.name || 'Guest';

  if (!recipientEmail) {
    console.log('Skipping email - no recipient email found');
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'StayBuddy <noreply@staybuddy.com>',
    to: recipientEmail,
    subject: `Booking Confirmed & Tax Invoice: ${hotelName}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        <div style="background-color: #ea580c; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.5px; font-weight: 800;">StayBuddy</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Tax Invoice & Booking Confirmation</p>
        </div>

        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #374151; margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">Thank you for choosing StayBuddy. Your reservation at <strong>${hotelName}</strong> is confirmed. Below is your official tax invoice for this booking.</p>
          
          <div style="display: flex; gap: 16px; margin: 24px 0;">
            <div style="flex: 1; background: #fff7ed; padding: 16px; border-radius: 8px; border: 1px solid #ffedd5;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #c2410c; font-weight: 700;">Booking ID</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #1f2937;">${booking.bookingId || _id}</p>
            </div>
            <div style="flex: 1; background: #fff7ed; padding: 16px; border-radius: 8px; border: 1px solid #ffedd5;">
              <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #c2410c; font-weight: 700;">Status</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 600; color: #15803d;">Confirmed & Paid</p>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 38%;">Hotel Name</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600; text-align: right;">${hotelName}${hotelCity ? `, ${hotelCity}` : ''}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Hotel Directions</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                <a href="${directionsUrl}" target="_blank" style="display: inline-block; background-color: #fff7ed; color: #ea580c; border: 1.5px solid #fdba74; padding: 5px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; text-decoration: none;">
                  🗺️ Get Directions →
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Room Category</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 700; text-align: right;">
                <span style="background: #f1f5f9; color: #0f172a; padding: 4px 10px; border-radius: 6px; font-size: 13px;">${roomCategory}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Meal Plan</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">
                ${mealPlanInfo.badgeHtml}
              </td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Check-in Date</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600; text-align: right;">${checkInStr}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Check-out Date</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600; text-align: right;">${checkOutStr}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Duration & Guests</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600; text-align: right;">${booking.nights || 1} Night(s), ${booking.guests || 1} Guest(s)</td>
            </tr>
            ${booking.occupancySummary ? `
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Occupancy Breakdown</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600; text-align: right;">${booking.occupancySummary}</td>
            </tr>
            ` : ''}
          </table>
          
          <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #111827; border-bottom: 2px solid #ea580c; padding-bottom: 8px; display: inline-block;">Billing Details</h3>
          
          <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px; overflow: hidden; font-size: 15px;">
            <tr>
              <td style="padding: 16px; color: #4b5563;">Room Charges (${booking.nights || 1} Night)</td>
              <td style="padding: 16px; color: #1f2937; text-align: right; font-weight: 500;">₹${(booking.pricePerNight * booking.nights || totalPrice).toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 16px; color: #4b5563; border-bottom: 1px solid #e5e7eb;">Taxes & Fees (5% GST)</td>
              <td style="padding: 16px; color: #1f2937; text-align: right; font-weight: 500; border-bottom: 1px solid #e5e7eb;">₹${(totalPrice - (booking.pricePerNight * booking.nights)).toLocaleString()}</td>
            </tr>
            <tr style="background-color: #fff7ed;">
              <td style="padding: 16px; color: #c2410c; font-weight: 800; font-size: 18px;">Total Amount Paid</td>
              <td style="padding: 16px; color: #c2410c; font-weight: 800; font-size: 18px; text-align: right;">₹${totalPrice.toLocaleString()}</td>
            </tr>
          </table>

          <div style="margin-top: 40px; padding-top: 24px; border-top: 1px dashed #d1d5db; text-align: center; color: #6b7280; font-size: 13px;">
            <p style="margin: 4px 0;">This is a computer-generated tax invoice and does not require a signature.</p>
            <p style="margin: 4px 0;">STAY BUDDY | Email: staybuddyhotels@gmail.com</p>
          </div>
        </div>
      </div>
    `,
  };

  try {
    const mailClient = await getTransporter();
    const info = await mailClient.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${recipientEmail}`);
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      console.log("Preview your email here: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending confirmation email:', error);
  }
}

export async function sendPartnerNotificationEmail(booking: any, partnerEmail: string) {
  const { hotelId, checkIn, checkOut, _id, guestName, guestPhone, totalPartnerPrice, nights, occupancySummary } = booking;
  
  if (!partnerEmail) {
    console.log('Skipping partner email - no partner email provided');
    return;
  }

  const hotelName = (typeof hotelId === 'object' && hotelId?.name) ? hotelId.name : (booking.hotelName || 'StayBuddy Hotel');
  const hotelCity = (typeof hotelId === 'object' && hotelId?.city) ? hotelId.city : (booking.hotelCity || '');
  const roomCategory = getRoomCategoryDisplay(booking);

  const checkInStr = new Date(checkIn).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const checkOutStr = new Date(checkOut).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  // Format occupancy breakdown for partner with their pure B2B rate instead of client tariff
  const partnerOccDisplay = booking.partnerOccupancySummary 
    || (occupancySummary && Number(booking.partnerPricePerNight) > 0 
        ? occupancySummary.replace(/@\s*₹[\d,]+/g, `@ ₹${Number(booking.partnerPricePerNight).toLocaleString()}`) 
        : (occupancySummary || ''));

  const rawMealPlan = booking.ratePlan || (typeof booking.roomId === 'object' ? booking.roomId?.ratePlan : null) || 'CP';
  const mealPlanInfo = getMealPlanDisplay(rawMealPlan);

  const safeNights = Number(nights) || 1;
  const partnerPayout = Number(totalPartnerPrice) > 0 
    ? Number(totalPartnerPrice) 
    : (Number(booking.partnerPricePerNight) > 0 ? Number(booking.partnerPricePerNight) * safeNights : 0);
  const nightlyPayout = Number(booking.partnerPricePerNight) > 0 
    ? Number(booking.partnerPricePerNight) 
    : (safeNights > 0 && partnerPayout > 0 ? Math.round(partnerPayout / safeNights) : 0);

  const bookingIdDisplay = booking.bookingId || (typeof _id === 'string' ? _id.slice(-8).toUpperCase() : 'N/A');

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'StayBuddy <noreply@staybuddy.com>',
    to: partnerEmail,
    subject: `New Booking Alert: ${hotelName} - ${roomCategory} (Payout: ₹${partnerPayout.toLocaleString()})`,
    html: `
      <div style="font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.06);">
        <!-- StayBuddy Header in Official Brand Orange Theme -->
        <div style="background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); padding: 28px 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">StayBuddy</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.95; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">Partner Extranet • Confirmed Reservation Alert</p>
        </div>

        <div style="padding: 28px 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 15px; color: #374151;">Dear <strong>${hotelName} Team</strong>,</p>
            <span style="background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700;">
              ✓ Confirmed & Guaranteed
            </span>
          </div>

          <p style="font-size: 14px; color: #4b5563; line-height: 1.5; margin-top: 0;">
            You have received a new confirmed reservation through StayBuddy. Please find the reservation breakdown and your <strong>guaranteed Net B2B Payout</strong> below:
          </p>
          
          <!-- Booking ID & Status Overview Card -->
          <div style="display: flex; gap: 12px; margin: 18px 0;">
            <div style="flex: 1; background: #fff7ed; padding: 14px; border-radius: 10px; border: 1px solid #ffedd5;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #c2410c; font-weight: 800; letter-spacing: 0.05em;">Booking ID</p>
              <p style="margin: 4px 0 0 0; font-size: 16px; font-weight: 700; color: #1f2937; font-family: monospace;">${bookingIdDisplay}</p>
            </div>
            <div style="flex: 1; background: #f8fafc; padding: 14px; border-radius: 10px; border: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 800; letter-spacing: 0.05em;">Property</p>
              <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 700; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${hotelName}</p>
            </div>
          </div>

          <!-- Reservation Details Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 22px; font-size: 13.5px;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 40%;">Guest Name</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 700; text-align: right;">${guestName || 'Guest'}</td>
            </tr>
            ${guestPhone ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Guest Contact</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right;">${guestPhone}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Room Category</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                <span style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 12px;">${roomCategory}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Meal Plan</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">${mealPlanInfo.badgeHtml}</td>
            </tr>
            ${partnerOccDisplay ? `
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Occupancy Rate</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #047857; font-weight: 700; text-align: right;">${partnerOccDisplay}</td>
            </tr>
            ` : ''}
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Check-In</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right;">${checkInStr}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Check-Out</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600; text-align: right;">${checkOutStr}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;">Duration</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 700; text-align: right;">${safeNights} Night(s)</td>
            </tr>
          </table>

          <!-- Guaranteed B2B Partner Payout Card in Theme -->
          <div style="background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 2px solid #f59e0b; border-radius: 12px; padding: 18px 20px; margin: 24px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #92400e; letter-spacing: 0.05em;">
                🏨 Net Hotel Payout (Pure B2B Contract Rate)
              </span>
              <span style="background: #fde68a; color: #78350f; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">
                B2B NET
              </span>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 4px;">
              <div>
                <div style="font-size: 24px; font-weight: 900; color: #065f46;">₹${partnerPayout.toLocaleString()}</div>
                ${nightlyPayout > 0 ? `
                <div style="font-size: 12px; color: #78350f; font-weight: 600; margin-top: 2px;">
                  Rate: ₹${nightlyPayout.toLocaleString()} / night × ${safeNights} night(s)
                </div>
                ` : ''}
              </div>
              <div style="text-align: right;">
                <span style="background: #ecfdf5; border: 1.5px solid #10b981; color: #047857; padding: 4px 10px; border-radius: 8px; font-weight: 800; font-size: 12px;">
                  100% Guaranteed
                </span>
              </div>
            </div>

            <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed #fcd34d; font-size: 11.5px; color: #92400e; line-height: 1.45;">
              ℹ️ <strong>Settlement Policy:</strong> For bookings made a week in advance, payout will be initiated at the time of check-in or earlier. Same-day bookings will be settled within 48 hours following successful guest arrival.
            </div>
          </div>

          <!-- CTA Button -->
          <div style="text-align: center; margin: 26px 0 16px 0;">
            <a href="https://www.staybuddy.in/partner" target="_blank" style="display: inline-block; background: #ea580c; color: white; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; font-size: 14px; box-shadow: 0 4px 10px rgba(234,88,12,0.25);">
              Manage in Partner Extranet →
            </a>
          </div>

          <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            Need assistance? Reach StayBuddy Partner Support at <strong>staybuddyhotels@gmail.com</strong> or call <strong>+91 9989099436</strong>.<br />
            © ${new Date().getFullYear()} StayBuddy Hospitality Network • www.staybuddy.in
          </p>
        </div>
      </div>
    `,
  };

  try {
    const mailClient = await getTransporter();
    const info = await mailClient.sendMail(mailOptions);
    console.log(`Partner notification email sent to ${partnerEmail}`);
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      console.log("Preview partner email here: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending partner email:', error);
  }
}

export async function sendPaymentAuditEmail(
  booking: any,
  paymentDetails?: {
    paymentId?: string;
    orderId?: string;
    paymentMethod?: string;
    source?: string;
  }
) {
  const adminEmail = process.env.ADMIN_AUDIT_EMAIL || 'staybuddyhotels@gmail.com';
  const { customerId, hotelId, checkIn, checkOut, totalPrice, _id, guestEmail, guestName, guestPhone, bookingId } = booking;
  
  const hotelDoc = hotelId && typeof hotelId === 'object' ? hotelId : null;
  const hotelIdDisplay = hotelDoc?.hotelId || hotelDoc?._id || booking.hotelIdDisplay || booking.hotelId || 'N/A';
  const hotelName = hotelDoc?.name || booking.hotelName || 'StayBuddy Hotel';
  const hotelCity = hotelDoc?.city || '';
  const roomCategory = getRoomCategoryDisplay(booking);
  const bookingDisplayId = bookingId || booking.bookingCode || _id;
  const formattedAmount = `₹${Number(totalPrice || 0).toLocaleString('en-IN')}`;
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'medium' });

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'StayBuddy Audit <noreply@staybuddy.com>',
    to: adminEmail,
    subject: `💰 [PAYMENT AUDIT] ${formattedAmount} Received | Hotel ID: ${hotelIdDisplay} | Booking: ${bookingDisplayId}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; border: 2px solid #2563eb; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 12px rgba(37,99,235,0.1);">
        
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 24px; text-align: center; color: white;">
          <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 1.5px; opacity: 0.85; font-weight: 700; margin-bottom: 6px;">StayBuddy Payment Audit Alert</div>
          <h1 style="margin: 0; font-size: 26px; font-weight: 800;">${formattedAmount} Payment Received</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Transaction verified & confirmed via Razorpay</p>
        </div>

        <div style="padding: 24px;">
          
          <div style="background-color: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 10px; padding: 18px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #93c5fd; padding-bottom: 12px; margin-bottom: 12px;">
              <span style="font-size: 13px; font-weight: 700; color: #1e40af; text-transform: uppercase;">Audit Reference</span>
              <span style="font-size: 12px; background: #2563eb; color: white; padding: 3px 8px; border-radius: 4px; font-weight: 600;">CONFIRMED & PAID</span>
            </div>
            
            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
              <tr>
                <td style="padding: 6px 0; color: #4b5563; font-weight: 600; width: 35%;">Hotel ID:</td>
                <td style="padding: 6px 0; color: #1e3a8a; font-weight: 800; font-size: 16px;">${hotelIdDisplay}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Booking ID:</td>
                <td style="padding: 6px 0; color: #047857; font-weight: 800; font-size: 16px;">${bookingDisplayId}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Room Category:</td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 800; font-size: 15px;">${roomCategory}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Amount Received:</td>
                <td style="padding: 6px 0; color: #b91c1c; font-weight: 800; font-size: 18px;">${formattedAmount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #4b5563; font-weight: 600;">Hotel Name:</td>
                <td style="padding: 6px 0; color: #1f2937; font-weight: 700;">${hotelName}${hotelCity ? ` (${hotelCity})` : ''}</td>
              </tr>
            </table>
          </div>

          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Razorpay Gateway Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; background: #f9fafb; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%;">Razorpay Payment ID</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: monospace; font-weight: 600;">${paymentDetails?.paymentId || booking.razorpayPaymentId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Razorpay Order ID</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #111827; font-family: monospace; font-weight: 600;">${paymentDetails?.orderId || booking.razorpayOrderId || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Payment Method</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600; text-transform: uppercase;">${paymentDetails?.paymentMethod || booking.paymentMethod || 'Razorpay Online'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; color: #6b7280;">Audit Recorded At</td>
              <td style="padding: 10px 14px; color: #111827; font-weight: 500;">${timestamp}</td>
            </tr>
          </table>

          <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #374151; text-transform: uppercase; letter-spacing: 0.5px;">Customer & Stay Info</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; background: #f9fafb; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%;">Guest Name</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600;">${guestName || customerId?.name || 'Guest'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Guest Contact</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500;">${guestPhone || 'N/A'} | ${guestEmail || customerId?.email || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Room Category</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 700;">${roomCategory}</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #6b7280;">Stay Duration</td>
              <td style="padding: 10px 14px; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 500;">${booking.nights || 1} Night(s) (${checkIn ? new Date(checkIn).toLocaleDateString('en-IN') : ''} to ${checkOut ? new Date(checkOut).toLocaleDateString('en-IN') : ''})</td>
            </tr>
            <tr>
              <td style="padding: 10px 14px; color: #6b7280;">Rooms & Guests</td>
              <td style="padding: 10px 14px; color: #111827; font-weight: 500;">${booking.rooms || 1} Room(s), ${booking.guests || 1} Guest(s)</td>
            </tr>
          </table>

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0 0 12px 0; font-size: 13px; color: #6b7280;">Use these references for Razorpay settlement audits:</p>
            <a href="https://dashboard.razorpay.com/app/payments" target="_blank" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; margin-right: 8px;">View in Razorpay Dashboard</a>
            <a href="https://staybuddy.in/invoice/${_id}" target="_blank" style="display: inline-block; background-color: #f3f4f6; color: #1f2937; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600; border: 1px solid #d1d5db;">View Tax Invoice</a>
          </div>

        </div>

        <div style="background-color: #f3f4f6; padding: 14px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb;">
          StayBuddy Internal Audit Bot &bull; Auto-generated upon verified Razorpay payment capture
        </div>
      </div>
    `
  };

  try {
    const mailClient = await getTransporter();
    const info = await mailClient.sendMail(mailOptions);
    console.log(`Payment audit email sent to ${adminEmail}`);
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      console.log("Preview audit email here: %s", nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending payment audit email:', error);
  }
}
