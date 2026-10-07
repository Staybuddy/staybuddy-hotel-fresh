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

export async function sendBookingConfirmationEmail(booking: any) {
  const { customerId, hotelId, checkIn, checkOut, totalPrice, _id, guestEmail, guestName } = booking;
  
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
    subject: `Booking Confirmed & Tax Invoice: ${hotelId.name}`,
    html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        
        {/* Header */}
        <div style="background-color: #ea580c; padding: 30px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 28px; letter-spacing: -0.5px; font-weight: 800;">StayBuddy</h1>
          <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">Tax Invoice & Booking Confirmation</p>
        </div>

        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #374151; margin-top: 0;">Dear <strong>${recipientName}</strong>,</p>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">Thank you for choosing StayBuddy. Your reservation at <strong>${hotelId.name}</strong> is confirmed. Below is your official tax invoice for this booking.</p>
          
          {/* Invoice Summary Cards */}
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

          {/* Details Table */}
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; font-size: 14px;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; width: 40%;">Hotel Name</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-weight: 600; text-align: right;">${hotelId.name}, ${hotelId.city}</td>
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
          </table>
          
          {/* Billing Section */}
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
            <p style="margin: 4px 0;">STAY BUDDY (PROPRIETORSHIP: MULLA ARIF) | Email: staybuddyhotels@gmail.com</p>
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
  const { hotelId, checkIn, checkOut, _id, guestName, totalPartnerPrice, nights } = booking;
  
  if (!partnerEmail) {
    console.log('Skipping partner email - no partner email provided');
    return;
  }

  const checkInStr = new Date(checkIn).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const checkOutStr = new Date(checkOut).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'StayBuddy <noreply@staybuddy.com>',
    to: partnerEmail,
    subject: `New Booking Alert: ${hotelId.name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #10b981; padding: 24px; text-align: center; color: white;">
          <h1 style="margin: 0; font-size: 24px;">New Booking Alert</h1>
        </div>
        <div style="padding: 24px;">
          <p>Hi Partner,</p>
          <p>You have a new confirmed booking at <strong>${hotelId.name}</strong>!</p>
          
          <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0; border: 1px solid #e5e7eb;">
            <h3 style="margin-top: 0; color: #1f2937;">Booking Summary</h3>
            <p style="margin: 8px 0;"><strong>Booking ID:</strong> ${booking.bookingId || _id}</p>
            <p style="margin: 8px 0;"><strong>Guest Name:</strong> ${guestName || 'Guest'}</p>
            <p style="margin: 8px 0;"><strong>Check-in:</strong> ${checkInStr}</p>
            <p style="margin: 8px 0;"><strong>Check-out:</strong> ${checkOutStr}</p>
            <p style="margin: 8px 0;"><strong>Duration:</strong> ${nights} Night(s)</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
            <p style="margin: 8px 0; font-size: 1.1em; color: #059669;"><strong>Your Payout (B2B Price):</strong> ₹${(totalPartnerPrice || 0).toLocaleString()}</p>
          </div>
          
          <p>Please log in to your StayBuddy Partner Dashboard to view more details and prepare for the guest's arrival.</p>
          <p>Thanks,</p>
          <p>The StayBuddy Team</p>
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
