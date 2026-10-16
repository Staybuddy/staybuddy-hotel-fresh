import { db } from '@/lib/firebaseAdmin';
import PrintButton from '../PrintButton';

function amountInWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.round(num)).slice(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[Number(n[1][0])] + ' ' + a[Number(n[1][1])]) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[Number(n[2][0])] + ' ' + a[Number(n[2][1])]) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[Number(n[3][0])] + ' ' + a[Number(n[3][1])]) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[Number(n[4][0])] + ' ' + a[Number(n[4][1])]) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[Number(n[5][0])] + ' ' + a[Number(n[5][1])]) : '';
  return str.trim();
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const bookingDoc = await db.collection('bookings').doc(resolvedParams.id).get();
  
  if (!bookingDoc.exists) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Booking not found for ID: {resolvedParams.id}</h2>
        <a href="/my-bookings" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>← Back to Dashboard</a>
      </div>
    );
  }
  
  const bookingData = bookingDoc.data() as any;
  let booking = { _id: bookingDoc.id, ...bookingData } as any;

  if (booking.hotelId && typeof booking.hotelId === 'string') {
    const hotelDoc = await db.collection('hotels').doc(booking.hotelId).get();
    if (hotelDoc.exists) booking.hotelId = { _id: hotelDoc.id, ...hotelDoc.data() };
  }

  if (booking.roomId && typeof booking.roomId === 'string') {
    const roomDoc = await db.collection('rooms').doc(booking.roomId).get();
    if (roomDoc.exists) booking.roomId = { _id: roomDoc.id, ...roomDoc.data() };
  }

  // Invoice calculations
  const grandTotal = Number(booking.totalPrice || 0);
  const basePrice = Math.round(grandTotal / 1.05); // 5% GST assumed
  const gstAmount = grandTotal - basePrice;
  const placeOfSupply = booking.hotelId?.state || 'Telangana';
  const isLocalTelangana = !placeOfSupply || placeOfSupply.toLowerCase().includes('telangana');
  const cgstAmount = isLocalTelangana ? (gstAmount / 2) : 0;
  const sgstAmount = isLocalTelangana ? (gstAmount / 2) : 0;
  const igstAmount = isLocalTelangana ? 0 : gstAmount;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return Number(amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const invoiceNum = `INV-${(booking.bookingId || booking._id).substring(0, 8).toUpperCase()}`;
  const bookingDate = new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const roomsCount = parseInt(booking.rooms, 10) || 1;
  const nightsCount = parseInt(booking.nights, 10) || 1;
  const guestsCount = parseInt(booking.guests, 10) || 1;
  const tariffPerNight = (basePrice / (roomsCount * nightsCount));

  return (
    <div className="invoice-page-wrapper">
      
      {/* Top Action Bar */}
      <div className="no-print invoice-action-bar">
        <a href="/my-bookings" className="back-link">
          ← Back to My Bookings
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span className="a4-tag">💡 A4 Paper Optimized</span>
          <PrintButton invoiceNum={invoiceNum} targetId="tax-invoice-sheet" />
        </div>
      </div>

      {/* Invoice Document Sheet Container */}
      <div 
        id="tax-invoice-sheet"
        className="invoice-container"
      >
        {/* Subtle Brand Watermark in background */}
        <div className="invoice-watermark">
          StayBuddy
        </div>

        {/* Main Content Section */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          
          {/* Header Row */}
          <div className="invoice-header-row">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ margin: '0', fontSize: '24px', color: '#0f172a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Tax Invoice
                </h1>
                <span style={{ backgroundColor: '#ffedd5', color: '#c2410c', fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Original for Recipient
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
                Electronic Tax Invoice issued under Rule 46 of CGST Rules, 2017 &bull; SAC 998552
              </div>
            </div>
            <div className="invoice-header-right">
              <div style={{ margin: 0, fontSize: '30px', color: '#ea580c', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
                StayBuddy<span style={{ color: '#0f172a' }}>.</span>
              </div>
              <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, marginTop: '3px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Hospitality Solutions &bull; OTA Platform
              </div>
              <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '1px' }}>
                support@staybuddy.in &bull; www.staybuddy.in
              </div>
            </div>
          </div>

          {/* Invoice Metadata Matrix */}
          <div className="invoice-meta-grid">
            <div>
              <div className="meta-label">Invoice No.</div>
              <div className="meta-value">{invoiceNum}</div>
            </div>
            <div>
              <div className="meta-label">Invoice Date</div>
              <div className="meta-value">{bookingDate}</div>
            </div>
            <div>
              <div className="meta-label">Booking ID</div>
              <div className="meta-value">{booking.bookingId || 'N/A'}</div>
            </div>
            <div>
              <div className="meta-label">Place of Supply</div>
              <div className="meta-value">{placeOfSupply} (Code: 36)</div>
            </div>

            <div>
              <div className="meta-label">StayBuddy GSTIN</div>
              <div className="meta-value" style={{ color: '#ea580c' }}>36FSKPM3408R1ZZ</div>
            </div>
            <div>
              <div className="meta-label">HSN / SAC Code</div>
              <div className="meta-value">998552</div>
            </div>
            <div>
              <div className="meta-label">Reverse Charge</div>
              <div className="meta-value">No (Regular GST)</div>
            </div>
            <div>
              <div className="meta-label">Service Type</div>
              <div className="meta-value">Accommodation Service</div>
            </div>
          </div>

          {/* Billed To vs Property Details */}
          <div className="invoice-two-col">
            
            {/* Billed To (Customer Details) */}
            <div className="detail-card">
              <div className="card-header">
                Billed To (Customer Details)
              </div>
              <div className="card-body">
                <div>
                  <span style={{ color: '#64748b' }}>Guest Name: </span>
                  <strong style={{ color: '#0f172a', fontSize: '13px' }}>{booking.guestName || 'Valued Guest'}</strong>
                </div>
                {booking.gstCompanyName && (
                  <div>
                    <span style={{ color: '#64748b' }}>Company: </span>
                    <strong style={{ color: '#0f172a' }}>{booking.gstCompanyName}</strong>
                  </div>
                )}
                {booking.gstRegistrationNo && (
                  <div>
                    <span style={{ color: '#64748b' }}>Customer GSTIN: </span>
                    <strong style={{ color: '#ea580c' }}>{booking.gstRegistrationNo.trim()}</strong>
                  </div>
                )}
                {booking.gstCompanyAddress ? (
                  <div style={{ color: '#475569', lineHeight: '1.4', marginTop: '2px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Billing Address: </span>
                    {booking.gstCompanyAddress}
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>Billing address not specified</div>
                )}
              </div>
            </div>

            {/* Property & Stay Details */}
            <div className="detail-card">
              <div className="card-header">
                Property & Reservation Details
              </div>
              <div className="card-body" style={{ justifyContent: 'space-between' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '10.5px' }}>Hotel Name & Location</div>
                  <strong style={{ color: '#ea580c', fontSize: '13px' }}>
                    {booking.hotelId?.name || 'StayBuddy Partner Hotel'}
                    {booking.hotelId?.city ? `, ${booking.hotelId.city}` : ''}
                    {booking.hotelId?.state ? `, ${booking.hotelId.state}` : ''}
                  </strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', backgroundColor: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>Check-In</div>
                    <strong style={{ color: '#0f172a', fontSize: '12px', display: 'block' }}>
                      {booking.checkIn ? formatDate(booking.checkIn) : 'N/A'}
                    </strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>12:00 PM</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontSize: '10px', fontWeight: 600 }}>Check-Out</div>
                    <strong style={{ color: '#0f172a', fontSize: '12px', display: 'block' }}>
                      {booking.checkOut ? formatDate(booking.checkOut) : 'N/A'}
                    </strong>
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>11:00 AM</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#334155', flexWrap: 'wrap', gap: '4px' }}>
                  <span><strong>Duration:</strong> {nightsCount} Night(s)</span>
                  <span><strong>Rooms:</strong> {roomsCount} ({guestsCount} Guest{guestsCount > 1 ? 's' : ''})</span>
                  <span><strong>Tariff/Night:</strong> <strong style={{ color: '#ea580c' }}>₹{formatCurrency(tariffPerNight)}</strong></span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Itemized Services Table (Horizontally scrollable on narrow mobile screens) */}
          <div className="invoice-table-scroll">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.4px' }}>
                  <th style={{ padding: '9px 8px', borderBottom: '1px solid #cbd5e1', textAlign: 'center', width: '38px' }}>Sl.</th>
                  <th style={{ padding: '9px 12px', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>Description of Service & SAC</th>
                  <th style={{ padding: '9px 10px', borderBottom: '1px solid #cbd5e1', textAlign: 'center', width: '110px' }}>Stay Details</th>
                  <th style={{ padding: '9px 10px', borderBottom: '1px solid #cbd5e1', textAlign: 'center', width: '90px' }}>Quantity</th>
                  <th style={{ padding: '9px 10px', borderBottom: '1px solid #cbd5e1', textAlign: 'right', width: '95px' }}>Tariff/Night (₹)</th>
                  <th style={{ padding: '9px 12px', borderBottom: '1px solid #cbd5e1', textAlign: 'right', width: '105px' }}>Taxable Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>1</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>
                    <div style={{ fontWeight: 800, fontSize: '12.5px' }}>Accommodation Charges</div>
                    <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>
                      {booking.roomId?.type || 'Standard Room'} - Room Only (Base Tariff) &bull; SAC: 998552
                    </div>
                    {booking.hotelId?.name && (
                      <div style={{ marginTop: '4px', fontSize: '11.5px' }}>
                        <span style={{ color: '#64748b' }}>Hotel: </span>
                        <strong style={{ color: '#ea580c' }}>
                          {booking.hotelId.name}
                          {booking.hotelId.city ? `, ${booking.hotelId.city}` : ''}
                        </strong>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#334155', fontSize: '11px', lineHeight: '1.4' }}>
                    <div>{booking.checkIn ? formatDate(booking.checkIn) : 'N/A'}</div>
                    <div style={{ color: '#64748b' }}>to {booking.checkOut ? formatDate(booking.checkOut) : 'N/A'}</div>
                  </td>
                  <td style={{ padding: '12px 8px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                    {roomsCount} Room(s) &times; {nightsCount} Night(s)
                  </td>
                  <td style={{ padding: '12px 10px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#ea580c', fontWeight: 700 }}>
                    {formatCurrency(tariffPerNight)}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 800 }}>
                    {formatCurrency(basePrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Detailed GST Breakdown Summary Table */}
          <div className="invoice-table-scroll" style={{ marginBottom: '18px' }}>
            <div style={{ backgroundColor: '#f1f5f9', padding: '6px 12px', fontSize: '10.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #cbd5e1' }}>
              GST Tax Computation & HSN/SAC Breakdown
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#475569', fontSize: '10.5px', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '7px 12px', textAlign: 'left' }}>HSN / SAC</th>
                  <th style={{ padding: '7px 12px', textAlign: 'right' }}>Taxable Value (₹)</th>
                  <th style={{ padding: '7px 12px', textAlign: 'right' }}>CGST (Rate / Amt)</th>
                  <th style={{ padding: '7px 12px', textAlign: 'right' }}>{isLocalTelangana ? 'SGST (Rate / Amt)' : 'IGST (Rate / Amt)'}</th>
                  <th style={{ padding: '7px 12px', textAlign: 'right' }}>Total Tax Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, color: '#0f172a' }}>998552</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 600 }}>₹{formatCurrency(basePrice)}</td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                    {isLocalTelangana ? `2.5% / ₹${formatCurrency(cgstAmount)}` : '0.0% / ₹0.00'}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>
                    {isLocalTelangana ? `2.5% / ₹${formatCurrency(sgstAmount)}` : `5.0% / ₹${formatCurrency(igstAmount)}`}
                  </td>
                  <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                    ₹{formatCurrency(gstAmount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakup, Terms & Grand Total Grid */}
          <div className="invoice-totals-grid">
            
            {/* Left Column: Words & Payment Verification */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
                  Total Invoice Amount in Words:
                </div>
                <div style={{ color: '#0f172a', fontStyle: 'italic', fontWeight: 800, fontSize: '12px', lineHeight: '1.4' }}>
                  Indian Rupees {amountInWords(grandTotal)} Only.
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px', color: '#475569', lineHeight: '1.5' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '3px' }}>
                  Payment & Settlement Details:
                </div>
                <div>&bull; <strong>Payment Mode:</strong> {booking.paymentMethod || 'Electronic Transfer (Razorpay / UPI / NetBanking)'}</div>
                <div>&bull; <strong>Payment Status:</strong> Verified &bull; Invoice generated on receipt of payment</div>
                <div>&bull; <strong>Transaction Ref:</strong> {booking.bookingId || invoiceNum}</div>
              </div>
            </div>

            {/* Right Column: Totals Table & Paid Stamp */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Total Taxable Value</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{formatCurrency(basePrice)}</td>
                  </tr>
                  
                  {isLocalTelangana ? (
                    <>
                      <tr>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>CGST @ 2.5%</td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>₹{formatCurrency(cgstAmount)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>SGST @ 2.5%</td>
                        <td style={{ padding: '7px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>₹{formatCurrency(sgstAmount)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>IGST @ 5.0%</td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>₹{formatCurrency(igstAmount)}</td>
                    </tr>
                  )}
                  
                  <tr style={{ backgroundColor: '#fff7ed' }}>
                    <td style={{ padding: '10px 12px', color: '#ea580c', fontWeight: 800, fontSize: '13.5px' }}>Grand Total</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#ea580c', fontWeight: 900, fontSize: '15.5px' }}>₹{formatCurrency(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ textAlign: 'center', padding: '9px 0', backgroundColor: '#f8fafc', borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ 
                  display: 'inline-block', 
                  border: '2px solid #16a34a', 
                  color: '#16a34a', 
                  backgroundColor: '#f0fdf4',
                  padding: '4px 14px', 
                  fontWeight: 900, 
                  borderRadius: '5px', 
                  fontSize: '11.5px',
                  letterSpacing: '1.5px',
                  transform: 'rotate(-2deg)'
                }}>
                  &bull; PAID IN FULL &bull;
                </span>
              </div>
            </div>

          </div>

          {/* Terms & Declarations */}
          <div style={{ padding: '10px 12px', backgroundColor: '#fafaf9', borderRadius: '6px', border: '1px solid #e7e5e4', marginBottom: '20px', fontSize: '9.5px', color: '#78716c', lineHeight: '1.45' }}>
            <strong style={{ color: '#44403c', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block', marginBottom: '2px' }}>
              Terms & Conditions / Statutory Declarations:
            </strong>
            <div>1. Certified that the particulars given above are true and correct and the amount indicated represents the price actually charged for accommodation services.</div>
            <div>2. Input Tax Credit (ITC) eligibility is determined as per the provisions of Section 16 of the CGST Act, 2017.</div>
            <div>3. This is an electronically generated and digitally authenticated Tax Invoice under Rule 46 of the CGST Rules, 2017. No physical signature is required.</div>
            <div>4. Any discrepancy must be reported to StayBuddy Support within 48 hours of invoice generation at support@staybuddy.in.</div>
          </div>

        </div>

        {/* Footer: StayBuddy Registered Details & Signatory */}
        <div className="invoice-footer-row">
          {/* Registered Company Info */}
          <div className="invoice-footer-left">
            <div style={{ color: '#0f172a', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
              STAYBUDDY HOSPITALITY PRIVATE LIMITED
            </div>
            <div>1st Floor, 11-3, Shamshabad Flyover, Near Appu Pan Shop,</div>
            <div>Shamshabad, Hyderabad, Rangareddy, Telangana 501218, India</div>
            <div style={{ marginTop: '2px' }}>
              <strong>GSTIN:</strong> 36FSKPM3408R1ZZ &nbsp;|&nbsp; <strong>Email:</strong> staybuddyhotels@gmail.com
            </div>
          </div>

          {/* Authorized Signature */}
          <div className="invoice-footer-right">
            <div style={{ height: '40px', borderBottom: '1.5px solid #94a3b8', marginBottom: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="110" height="32" viewBox="0 0 100 35" style={{ opacity: 0.75 }}>
                <path d="M 5 25 Q 25 5, 40 20 T 65 10 T 95 20" fill="transparent" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>Authorized Signatory</div>
            <div style={{ fontSize: '9.5px', color: '#64748b' }}>StayBuddy Hospitality Pvt Ltd</div>
          </div>
        </div>

      </div>

      {/* Responsive Screen & A4 Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .invoice-page-wrapper {
          background-color: #f1f5f9;
          min-height: 100vh;
          padding: 24px 16px;
          box-sizing: border-box;
          width: 100%;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .invoice-action-bar {
          max-width: 850px;
          margin: 0 auto 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .back-link {
          color: #ea580c;
          text-decoration: none;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
        }

        .a4-tag {
          font-size: 13px;
          color: #64748b;
        }

        .invoice-container {
          width: 100%;
          max-width: 850px;
          min-height: 1120px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 36px 42px;
          border-radius: 8px;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
          color: #0f172a;
          font-size: 12.5px;
          line-height: 1.45;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
        }

        .invoice-watermark {
          position: absolute;
          top: 48%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-35deg);
          font-size: 110px;
          font-weight: 900;
          color: #ea580c;
          opacity: 0.03;
          pointer-events: none;
          z-index: 0;
          white-space: nowrap;
          user-select: none;
        }

        .invoice-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #ea580c;
          padding-bottom: 14px;
          margin-bottom: 18px;
          gap: 16px;
        }

        .invoice-header-right {
          text-align: right;
        }

        .invoice-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px 14px;
          padding: 12px 16px;
          background-color: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          margin-bottom: 18px;
          box-sizing: border-box;
        }

        .meta-label {
          color: #64748b;
          fontSize: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .meta-value {
          font-weight: 800;
          color: #0f172a;
          font-size: 12.5px;
          margin-top: 2px;
          word-break: break-word;
        }

        .invoice-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 18px;
          align-items: stretch;
        }

        .detail-card {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        }

        .card-header {
          background-color: #f1f5f9;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 1px solid #cbd5e1;
        }

        .card-body {
          padding: 12px 14px;
          flex: 1;
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 5px;
          font-size: 12px;
          box-sizing: border-box;
        }

        .invoice-table-scroll {
          margin-bottom: 18px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          overflow: hidden;
          box-sizing: border-box;
        }

        .invoice-totals-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 20px;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .invoice-footer-row {
          margin-top: auto;
          padding-top: 16px;
          border-top: 2px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          position: relative;
          z-index: 1;
          width: 100%;
          gap: 16px;
        }

        .invoice-footer-left {
          font-size: 10px;
          color: #64748b;
          line-height: 1.55;
          max-width: 62%;
        }

        .invoice-footer-right {
          text-align: center;
          width: 200px;
        }

        /* MOBILE OPTIMIZATIONS (Fix right-edge cutoff on mobile screens) */
        @media screen and (max-width: 768px) {
          .invoice-page-wrapper {
            padding: 12px 8px !important;
          }

          .invoice-container {
            padding: 18px 14px !important;
            border-radius: 6px !important;
            min-height: auto !important;
            box-sizing: border-box !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow-x: hidden !important;
          }

          .invoice-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }

          .invoice-header-right {
            text-align: left !important;
            width: 100% !important;
          }

          .invoice-meta-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px 10px !important;
            padding: 10px 12px !important;
          }

          .invoice-two-col {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }

          .invoice-table-scroll {
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            border-radius: 6px !important;
          }

          .invoice-table-scroll table {
            min-width: 520px !important;
          }

          .invoice-totals-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .invoice-footer-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }

          .invoice-footer-left {
            max-width: 100% !important;
          }

          .invoice-footer-right {
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
        }

        /* PRINT MEDIA (Perfect A4 Fit) */
        @page {
          size: A4 portrait;
          margin: 8mm 10mm;
        }

        @media print {
          html, body {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          .invoice-page-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            min-height: auto !important;
            width: 100% !important;
          }

          .invoice-container {
            box-shadow: none !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 4px !important;
            padding: 24px 28px !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 275mm !important;
            box-sizing: border-box !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .invoice-header-row {
            flex-direction: row !important;
            justify-content: space-between !important;
          }

          .invoice-header-right {
            text-align: right !important;
          }

          .invoice-meta-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }

          .invoice-two-col {
            grid-template-columns: 1fr 1fr !important;
          }

          .invoice-table-scroll {
            overflow: visible !important;
          }

          .invoice-table-scroll table {
            min-width: 100% !important;
            width: 100% !important;
          }

          .invoice-totals-grid {
            grid-template-columns: 1.25fr 1fr !important;
          }

          .invoice-footer-row {
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: flex-end !important;
          }

          .invoice-footer-left {
            max-width: 62% !important;
          }

          .invoice-footer-right {
            width: 200px !important;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
