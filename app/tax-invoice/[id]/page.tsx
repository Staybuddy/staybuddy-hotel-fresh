import { db } from '@/lib/firebaseAdmin';
import PrintButton from '../../invoice/PrintButton';

export default async function TaxInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const invDoc = await db.collection('taxInvoices').doc(resolvedParams.id).get();
  
  if (!invDoc.exists) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h2>Tax Invoice not found for ID: {resolvedParams.id}</h2>
        <a href="/admin" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>← Back to Dashboard</a>
      </div>
    );
  }
  
  const inv = { _id: invDoc.id, ...invDoc.data() } as any;

  // Invoice calculations based on saved data
  const basePrice = inv.totalAmount || inv.amount || 0;
  const grandTotal = inv.grandTotal || basePrice;
  const gstAmount = inv.gstAmount || 0;
  const gstPercentage = inv.gstPercentage || 0;
  
  // Assuming equal split for CGST and SGST for local state (Telangana)
  const isInterState = inv.placeOfSupply && !inv.placeOfSupply.toLowerCase().includes('telangana');
  const cgstAmount = isInterState ? 0 : gstAmount / 2;
  const sgstAmount = isInterState ? 0 : gstAmount / 2;
  const igstAmount = isInterState ? gstAmount : 0;
  
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

  const invoiceNum = inv.invoiceNo || `INV-${inv._id.substring(0, 8).toUpperCase()}`;
  const invoiceDateStr = inv.invoiceDate || inv.date || new Date().toISOString();
  const invoiceDate = new Date(invoiceDateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="invoice-page-wrapper" style={{ backgroundColor: '#f1f5f9', minHeight: '100vh', padding: '30px 16px', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
      
      {/* Top Action Bar */}
      <div className="no-print" style={{ maxWidth: '860px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <a href="/admin" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
          ← Back to Admin Extranet
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '13px', color: '#64748b' }}>💡 For PDF: select <strong>Save as PDF</strong> (A4 size)</span>
          <PrintButton />
        </div>
      </div>

      {/* Invoice Document Card */}
      <div 
        className="invoice-container"
        style={{ 
          maxWidth: '860px', 
          minHeight: '1120px',
          margin: '0 auto', 
          backgroundColor: '#ffffff', 
          padding: '40px 48px', 
          borderRadius: '8px', 
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
          color: '#0f172a', 
          fontSize: '13px', 
          lineHeight: '1.5', 
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxSizing: 'border-box'
        }}
      >
        {/* Subtle Brand Watermark in background */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)',
          fontSize: '110px', fontWeight: 900, color: '#ea580c', opacity: 0.03, pointerEvents: 'none', zIndex: 0,
          whiteSpace: 'nowrap', userSelect: 'none'
        }}>
          StayBuddy
        </div>

        {/* Top & Middle Content Wrapper */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          
          {/* Header Row: Title & Logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid #ea580c', paddingBottom: '16px', marginBottom: '20px' }}>
            <div>
              <h1 style={{ margin: '0', fontSize: '26px', color: '#0f172a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tax Invoice
              </h1>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontWeight: 500 }}>
                Original for Recipient &nbsp;|&nbsp; Electronic Tax Invoice
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ margin: 0, fontSize: '34px', color: '#ea580c', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
                StayBuddy<span style={{ color: '#0f172a' }}>.</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Hospitality Solutions
              </div>
            </div>
          </div>

          {/* Invoice Metadata Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '12px 16px', 
            padding: '14px 18px', 
            backgroundColor: '#f8fafc', 
            borderRadius: '6px', 
            border: '1px solid #e2e8f0', 
            marginBottom: '22px' 
          }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Invoice No.</div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', marginTop: '2px' }}>{invoiceNum}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Invoice Date</div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', marginTop: '2px' }}>{invoiceDate}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Booking ID</div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', marginTop: '2px' }}>{inv.bookingId || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Place of Supply</div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', marginTop: '2px' }}>{inv.placeOfSupply || 'Telangana'}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>StayBuddy GSTIN</div>
              <div style={{ fontWeight: 800, color: '#ea580c', fontSize: '13px', marginTop: '2px' }}>36FSKPM3408R1ZZ</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>HSN / SAC Code</div>
              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px', marginTop: '2px' }}>998552</div>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Service Description</div>
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px', marginTop: '2px' }}>Reservation service for accommodation</div>
            </div>
          </div>

          {/* Two-Column Cards: Billed To & Stay Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '22px', alignItems: 'stretch' }}>
            
            {/* Billed To (Customer Details) */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '9px 14px', fontSize: '11.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #cbd5e1' }}>
                Billed To (Customer Details)
              </div>
              <div style={{ padding: '14px 16px', flex: 1, backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                {inv.companyName && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>Company: </span>
                    <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{inv.companyName}</strong>
                  </div>
                )}
                {inv.gstNumber && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>Customer GSTIN: </span>
                    <strong style={{ color: '#ea580c', fontSize: '13.5px' }}>{inv.gstNumber}</strong>
                  </div>
                )}
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Guest Name: </span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{inv.guestName || inv.customerName || 'Guest'}</strong>
                </div>
                {inv.address && (
                  <div style={{ color: '#475569', fontSize: '12px', lineHeight: '1.45', marginTop: '2px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Address: </span>
                    {inv.address}
                  </div>
                )}
              </div>
            </div>

            {/* Stay Details */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#f1f5f9', padding: '9px 14px', fontSize: '11.5px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px', borderBottom: '1px solid #cbd5e1' }}>
                Stay Details
              </div>
              <div style={{ padding: '14px 16px', flex: 1, backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>Check-In</div>
                    <strong style={{ color: '#ea580c', fontSize: '13px', display: 'block', marginTop: '2px' }}>
                      {inv.checkInDate ? formatDate(inv.checkInDate) : 'N/A'}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>12:00 PM</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>Check-Out</div>
                    <strong style={{ color: '#ea580c', fontSize: '13px', display: 'block', marginTop: '2px' }}>
                      {inv.checkOutDate ? formatDate(inv.checkOutDate) : 'N/A'}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>11:00 AM</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#334155', paddingTop: '4px' }}>
                  <span><strong>Duration:</strong> {inv.noOfNights || 1} Night(s)</span>
                  <span><strong>Rooms:</strong> {inv.noOfRooms || 1} ({inv.noOfGuests || 1} Guest{inv.noOfGuests > 1 ? 's' : ''})</span>
                  <span><strong>Tariff/Night:</strong> <strong style={{ color: '#ea580c' }}>₹{formatCurrency(inv.tariffPerNight || basePrice)}</strong></span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Itemized Services Table */}
          <div style={{ marginBottom: '22px', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f1f5f9', color: '#334155', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.4px' }}>
                  <th style={{ padding: '11px 12px', borderBottom: '1px solid #cbd5e1', textAlign: 'center', width: '5%' }}>Sl.</th>
                  <th style={{ padding: '11px 16px', borderBottom: '1px solid #cbd5e1', textAlign: 'left', width: '45%' }}>Description of Service</th>
                  <th style={{ padding: '11px 14px', borderBottom: '1px solid #cbd5e1', textAlign: 'center', width: '18%' }}>Quantity</th>
                  <th style={{ padding: '11px 14px', borderBottom: '1px solid #cbd5e1', textAlign: 'right', width: '16%' }}>Tariff / Night (₹)</th>
                  <th style={{ padding: '11px 16px', borderBottom: '1px solid #cbd5e1', textAlign: 'right', width: '16%' }}>Taxable Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ backgroundColor: '#ffffff' }}>
                  <td style={{ padding: '14px 12px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>1</td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', color: '#0f172a' }}>
                    <div style={{ fontWeight: 800, fontSize: '13.5px' }}>Accommodation Charges</div>
                    <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px' }}>{inv.description || 'Room Only (Base Rate)'}</div>
                    {inv.hotelName && (
                      <div style={{ marginTop: '6px', fontSize: '12.5px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Hotel: </span>
                        <strong style={{ color: '#ea580c' }}>
                          {inv.hotelName}
                          {inv.hotelCity ? `, ${inv.hotelCity}` : ''}
                        </strong>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                    {(inv.noOfRooms || 1)} Room(s) × {inv.noOfNights || 1} Night(s)
                  </td>
                  <td style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#ea580c', fontWeight: 700 }}>
                    {formatCurrency(inv.tariffPerNight || basePrice)}
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 800 }}>
                    {formatCurrency(basePrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakup, Terms & Grand Total Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: '24px', alignItems: 'flex-start', marginBottom: '24px' }}>
            
            {/* Left Column: Words & Terms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  Total Invoice Amount in Words:
                </div>
                <div style={{ color: '#0f172a', fontStyle: 'italic', fontWeight: 700, fontSize: '13px' }}>
                  Indian Rupees {grandTotal.toLocaleString('en-IN')} Only.
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                  Terms & Conditions:
                </div>
                <ol style={{ paddingLeft: '18px', color: '#64748b', fontSize: '11px', margin: 0, lineHeight: '1.6' }}>
                  <li>Payment verified via electronic mode. This invoice is generated upon receipt of payment.</li>
                  <li>Any discrepancy must be reported within 48 hours of invoice generation.</li>
                  <li>Input Tax Credit (ITC) eligibility is determined as per applicable GST laws.</li>
                  <li>This is a computer generated document. No physical signature is required.</li>
                </ol>
              </div>
            </div>

            {/* Right Column: Totals Table & Paid Stamp */}
            <div style={{ border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>Total Taxable Value</td>
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{formatCurrency(basePrice)}</td>
                  </tr>
                  
                  {gstPercentage > 0 ? (
                    isInterState ? (
                      <tr>
                        <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>IGST @ {gstPercentage}%</td>
                        <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>₹{formatCurrency(igstAmount)}</td>
                      </tr>
                    ) : (
                      <>
                        <tr>
                          <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>CGST @ {gstPercentage / 2}%</td>
                          <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>₹{formatCurrency(cgstAmount)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>SGST @ {gstPercentage / 2}%</td>
                          <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>₹{formatCurrency(sgstAmount)}</td>
                        </tr>
                      </>
                    )
                  ) : (
                    <tr>
                      <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>GST @ 0%</td>
                      <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a' }}>₹0.00</td>
                    </tr>
                  )}
                  
                  <tr style={{ backgroundColor: '#fff7ed' }}>
                    <td style={{ padding: '12px 14px', color: '#ea580c', fontWeight: 800, fontSize: '15px' }}>Grand Total</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ea580c', fontWeight: 900, fontSize: '17px' }}>₹{formatCurrency(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ textAlign: 'center', padding: '12px 0 14px', backgroundColor: '#f8fafc', borderTop: '1px dashed #cbd5e1' }}>
                <span style={{ 
                  display: 'inline-block', 
                  border: '2.5px solid #16a34a', 
                  color: '#16a34a', 
                  backgroundColor: '#f0fdf4',
                  padding: '5px 16px', 
                  fontWeight: 900, 
                  borderRadius: '6px', 
                  fontSize: '13px',
                  letterSpacing: '2px',
                  transform: 'rotate(-3deg)'
                }}>
                  ✓ PAID IN FULL
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer: StayBuddy Registered Details & Signatory (Pushed to bottom of A4) */}
        <div style={{ 
          marginTop: 'auto', 
          paddingTop: '20px', 
          borderTop: '2px solid #e2e8f0', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-end',
          position: 'relative',
          zIndex: 1,
          width: '100%'
        }}>
          {/* Registered Company Info */}
          <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.6', maxWidth: '60%' }}>
            <div style={{ color: '#0f172a', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
              STAYBUDDY HOSPITALITY PRIVATE LIMITED
            </div>
            <div>1st Floor, 11-3, Shamshabad Flyover, Near Appu Pan Shop,</div>
            <div>Shamshabad, Hyderabad, Rangareddy, Telangana 501218, India</div>
            <div style={{ marginTop: '2px' }}>
              <strong>GSTIN:</strong> 36FSKPM3408R1ZZ &nbsp;|&nbsp; <strong>Email:</strong> staybuddyhotels@gmail.com
            </div>
          </div>

          {/* Authorized Signature */}
          <div style={{ textAlign: 'center', width: '210px' }}>
            <div style={{ height: '46px', borderBottom: '1.5px solid #94a3b8', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="120" height="36" viewBox="0 0 100 35" style={{ opacity: 0.65 }}>
                <path d="M 5 25 Q 25 5, 40 20 T 65 10 T 95 20" fill="transparent" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a' }}>Authorized Signatory</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>StayBuddy Hospitality</div>
          </div>
        </div>

      </div>

      {/* Print Styles for Perfect Edge-to-Edge A4 PDF */}
      <style dangerouslySetInnerHTML={{__html: `
        @page {
          size: A4 portrait;
          margin: 8mm 10mm 8mm 10mm;
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
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: 275mm !important;
            height: 275mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          /* Ensure all colored cards and borders are rendered in high fidelity */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
