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
