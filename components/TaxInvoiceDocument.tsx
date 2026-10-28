import React from 'react';
import PrintButton from '@/app/invoice/PrintButton';

export interface TaxInvoiceData {
  invoiceNum: string;
  invoiceDate: string;
  bookingId: string;
  placeOfSupply: string;
  staybuddyGstin?: string;
  sacCode?: string;
  serviceDescription?: string;
  guestName: string;
  companyName?: string;
  gstNumber?: string;
  address?: string;
  hotelName: string;
  hotelCity?: string;
  roomType?: string;
  checkInDate: string;
  checkOutDate: string;
  noOfNights: number;
  noOfRooms: number;
  noOfGuests: number;
  tariffPerNight: number;
  basePrice: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  isInterState: boolean;
  grandTotal: number;
  paymentMethod?: string;
  backUrl: string;
  backLabel: string;
}

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

const formatCurrency = (amount: number) => {
  return Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function TaxInvoiceDocument({ data }: { data: TaxInvoiceData }) {
  const staybuddyGstin = data.staybuddyGstin || '36FSKPM3408R1ZZ';
  const sacCode = data.sacCode || '998552';
  const serviceDescription = data.serviceDescription || 'Reservation service for accommodation';

  return (
    <div className="invoice-page-wrapper">
      
      {/* Top Action Bar */}
      <div className="no-print invoice-action-bar">
        <a href={data.backUrl} className="back-link">
          {data.backLabel}
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span className="a4-tag">💡 For PDF: select <strong>Save as PDF</strong> (A4 size)</span>
          <PrintButton invoiceNum={data.invoiceNum} targetId="tax-invoice-sheet" />
        </div>
      </div>

      {/* Invoice Document Card (A4 Frame) */}
      <div 
        id="tax-invoice-sheet"
        className="invoice-container"
      >
        {/* Subtle Brand Watermark in background */}
        <div className="invoice-watermark">
          StayBuddy
        </div>

        {/* Top & Middle Content Section */}
        <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
          
          {/* Header Row: Title & StayBuddy Brand */}
          <div className="invoice-header-row">
            <div>
              <h1 style={{ margin: '0', fontSize: '26px', color: '#0f172a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Tax Invoice
              </h1>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px', fontWeight: 500 }}>
                Original for Recipient &nbsp;|&nbsp; Electronic Tax Invoice
              </div>
            </div>
            <div className="invoice-header-right">
              <div style={{ margin: 0, fontSize: '34px', color: '#ea580c', fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1 }}>
                StayBuddy<span style={{ color: '#0f172a' }}>.</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '4px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                Hospitality Solutions
              </div>
            </div>
          </div>

          {/* Invoice Metadata Grid */}
          <div className="invoice-meta-grid">
            <div>
              <div className="meta-label">Invoice No.</div>
              <div className="meta-value">{data.invoiceNum}</div>
            </div>
            <div>
              <div className="meta-label">Invoice Date</div>
              <div className="meta-value">{data.invoiceDate}</div>
            </div>
            <div>
              <div className="meta-label">Booking ID</div>
              <div className="meta-value">{data.bookingId || 'N/A'}</div>
            </div>
            <div>
              <div className="meta-label">Place of Supply</div>
              <div className="meta-value">{data.placeOfSupply || 'Telangana'}</div>
            </div>

            <div>
              <div className="meta-label">StayBuddy GSTIN</div>
              <div className="meta-value" style={{ color: '#ea580c' }}>{staybuddyGstin}</div>
            </div>
            <div>
              <div className="meta-label">HSN / SAC Code</div>
              <div className="meta-value">{sacCode}</div>
            </div>
            <div className="meta-service-desc">
              <div className="meta-label">Service Description</div>
              <div className="meta-value" style={{ fontWeight: 700 }}>{serviceDescription}</div>
            </div>
          </div>

          {/* Two-Column Cards: Billed To & Stay Details */}
          <div className="invoice-two-col">
            
            {/* Billed To (Customer Details) */}
            <div className="detail-card">
              <div className="card-header">
                Billed To (Customer Details)
              </div>
              <div className="card-body">
                {data.companyName && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>Company: </span>
                    <strong style={{ color: '#0f172a', fontSize: '13.5px' }}>{data.companyName}</strong>
                  </div>
                )}
                {data.gstNumber && (
                  <div>
                    <span style={{ color: '#64748b', fontSize: '12px' }}>Customer GSTIN: </span>
                    <strong style={{ color: '#ea580c', fontSize: '13.5px' }}>{data.gstNumber.trim()}</strong>
                  </div>
                )}
                <div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>Guest Name: </span>
                  <strong style={{ color: '#0f172a', fontSize: '14px' }}>{data.guestName || 'Valued Guest'}</strong>
                </div>
                {data.address ? (
                  <div style={{ color: '#475569', fontSize: '12px', lineHeight: '1.45', marginTop: '2px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Address: </span>
                    {data.address}
                  </div>
                ) : (
                  <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>Address not specified</div>
                )}
              </div>
            </div>

            {/* Stay Details */}
            <div className="detail-card">
              <div className="card-header">
                Stay Details
              </div>
              <div className="card-body" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', backgroundColor: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>Check-In</div>
                    <strong style={{ color: '#ea580c', fontSize: '13px', display: 'block', marginTop: '2px' }}>
                      {data.checkInDate}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>12:00 PM</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>Check-Out</div>
                    <strong style={{ color: '#ea580c', fontSize: '13px', display: 'block', marginTop: '2px' }}>
                      {data.checkOutDate}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>11:00 AM</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px', color: '#334155', paddingTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
                  <span><strong>Duration:</strong> {data.noOfNights} Night(s)</span>
                  <span><strong>Rooms:</strong> {data.noOfRooms} ({data.noOfGuests} Guest{data.noOfGuests > 1 ? 's' : ''})</span>
                  <span><strong>Tariff/Night:</strong> <strong style={{ color: '#ea580c' }}>₹{formatCurrency(data.tariffPerNight)}</strong></span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Itemized Services: Desktop Table View */}
          <div className="invoice-table-desktop invoice-table-scroll">
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
                    <div style={{ color: '#64748b', fontSize: '11.5px', marginTop: '2px' }}>
                      {data.roomType || 'Standard Room'} - Room Only (Base Rate)
                    </div>
                    {data.hotelName && (
                      <div style={{ marginTop: '6px', fontSize: '12.5px' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>Hotel: </span>
                        <strong style={{ color: '#ea580c' }}>
                          {data.hotelName}
                          {data.hotelCity ? `, ${data.hotelCity}` : ''}
                        </strong>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
                    {data.noOfRooms} Room(s) &times; {data.noOfNights} Night(s)
                  </td>
                  <td style={{ padding: '14px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#ea580c', fontWeight: 700 }}>
                    {formatCurrency(data.tariffPerNight)}
                  </td>
                  <td style={{ padding: '14px 16px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 800 }}>
                    {formatCurrency(data.basePrice)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Itemized Services: Mobile Card View (Zero horizontal scroll!) */}
          <div className="invoice-card-mobile" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', backgroundColor: '#ffffff', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>Accommodation Charges</div>
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>
                  {data.roomType || 'Standard Room'} - Room Only (Base Rate)
                </div>
                {data.hotelName && (
                  <div style={{ marginTop: '4px', fontSize: '12.5px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Hotel: </span>
                    <strong style={{ color: '#ea580c' }}>
                      {data.hotelName}{data.hotelCity ? `, ${data.hotelCity}` : ''}
                    </strong>
                  </div>
                )}
              </div>
              <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: 4 }}>
                Sl. 1
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Quantity</span>
                <strong style={{ color: '#334155' }}>{data.noOfRooms} Room(s) &times; {data.noOfNights} Night(s)</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Tariff / Night</span>
                <strong style={{ color: '#ea580c' }}>₹{formatCurrency(data.tariffPerNight)}</strong>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '9px 12px', borderRadius: 6, marginTop: 4, border: '1px solid #e2e8f0' }}>
                <span style={{ color: '#475569', fontWeight: 700, fontSize: '12px' }}>Taxable Value:</span>
                <strong style={{ color: '#0f172a', fontSize: '15px', fontWeight: 800 }}>₹{formatCurrency(data.basePrice)}</strong>
              </div>
            </div>
          </div>

          {/* Tax Breakup, Terms & Grand Total Grid */}
          <div className="invoice-totals-grid">
            
            {/* Left Column: Words & Terms */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '12px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '4px' }}>
                  Total Invoice Amount in Words:
                </div>
                <div style={{ color: '#0f172a', fontStyle: 'italic', fontWeight: 700, fontSize: '13px' }}>
                  Indian Rupees {amountInWords(data.grandTotal)} Only.
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                  Terms & Conditions:
                </div>
                <ol style={{ paddingLeft: '18px', color: '#64748b', fontSize: '11px', margin: 0, lineHeight: '1.6' }}>
                  <li>Payment verified via {data.paymentMethod || 'electronic mode'}. This invoice is generated upon receipt of payment.</li>
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
                    <td style={{ padding: '10px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>₹{formatCurrency(data.basePrice)}</td>
                  </tr>
                  
                  {data.isInterState ? (
                    <tr>
                      <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>IGST @ 5.0%</td>
                      <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>₹{formatCurrency(data.igstAmount)}</td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>CGST @ 2.5%</td>
                        <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>₹{formatCurrency(data.cgstAmount)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>SGST @ 2.5%</td>
                        <td style={{ padding: '9px 14px', borderBottom: '1px solid #e2e8f0', textAlign: 'right', color: '#0f172a', fontWeight: 600 }}>₹{formatCurrency(data.sgstAmount)}</td>
                      </tr>
                    </>
                  )}
                  
                  <tr style={{ backgroundColor: '#fff7ed' }}>
                    <td style={{ padding: '12px 14px', color: '#ea580c', fontWeight: 800, fontSize: '15px' }}>Grand Total</td>
                    <td style={{ padding: '12px 14px', textAlign: 'right', color: '#ea580c', fontWeight: 900, fontSize: '17px' }}>₹{formatCurrency(data.grandTotal)}</td>
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
                  &bull; PAID IN FULL &bull;
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Footer: StayBuddy Registered Details & Signatory (Anchored to Bottom) */}
        <div className="invoice-footer-row">
          {/* Registered Company Info */}
          <div className="invoice-footer-left">
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
          <div className="invoice-footer-right">
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

      {/* Responsive Screen & A4 Print Styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .invoice-page-wrapper {
          background-color: #f1f5f9;
          min-height: 100vh;
          padding: 30px 16px;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box;
          width: 100%;
        }

        .invoice-action-bar {
          max-width: 860px;
          margin: 0 auto 20px;
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
          max-width: 860px;
          min-height: 1120px;
          margin: 0 auto;
          background-color: #ffffff;
          padding: 40px 48px;
          border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04);
          color: #0f172a;
          font-size: 13px;
          line-height: 1.5;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
          width: 100%;
        }

        .invoice-watermark {
          position: absolute;
          top: 50%;
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
          padding-bottom: 16px;
          margin-bottom: 20px;
          gap: 16px;
        }

        .invoice-header-right {
          text-align: right;
        }

        .invoice-meta-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px 16px;
          padding: 14px 18px;
          background-color: #f8fafc;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          margin-bottom: 22px;
          box-sizing: border-box;
        }

        .meta-label {
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }

        .meta-value {
          font-weight: 800;
          color: #0f172a;
          font-size: 13px;
          margin-top: 2px;
          word-break: break-word;
        }

        .meta-service-desc {
          grid-column: span 2;
        }

        .invoice-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
          margin-bottom: 22px;
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
          padding: 9px 14px;
          font-size: 11.5px;
          font-weight: 800;
          color: #334155;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 1px solid #cbd5e1;
        }

        .card-body {
          padding: 14px 16px;
          flex: 1;
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 13px;
          box-sizing: border-box;
        }

        .invoice-table-desktop {
          display: block;
        }
        .invoice-card-mobile {
          display: none;
        }

        .invoice-table-scroll {
          margin-bottom: 22px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          overflow: hidden;
          box-sizing: border-box;
        }

        .invoice-totals-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 24px;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .invoice-footer-row {
          margin-top: auto;
          padding-top: 20px;
          border-top: 2px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          position: relative;
          z-index: 1;
          width: 100%;
          gap: 16px;
        }

        .invoice-footer-left {
          font-size: 11px;
          color: #64748b;
          line-height: 1.6;
          max-width: 60%;
        }

        .invoice-footer-right {
          text-align: center;
          width: 210px;
        }

        /* MOBILE RESPONSIVE (Prevents elements going off-screen on phones) */
        @media screen and (max-width: 768px) {
          .invoice-page-wrapper {
            padding: 16px 8px !important;
          }

          .invoice-container {
            padding: 20px 14px !important;
            border-radius: 6px !important;
            min-height: auto !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow-x: hidden !important;
          }

          .invoice-header-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 14px !important;
          }

          .invoice-header-right {
            text-align: left !important;
            width: 100% !important;
          }

          .invoice-meta-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 10px 12px !important;
            padding: 12px 14px !important;
          }

          .meta-service-desc {
            grid-column: span 2 !important;
          }

          .invoice-two-col {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .invoice-table-desktop {
            display: none !important;
          }

          .invoice-card-mobile {
            display: block !important;
          }

          .invoice-totals-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }

          .invoice-footer-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 18px !important;
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

        /* PRINT MEDIA (Fits A4 Page Beautifully) */
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
            padding: 0 !important;
            margin: 0 auto !important;
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

          .meta-service-desc {
            grid-column: span 2 !important;
          }

          .invoice-two-col {
            grid-template-columns: 1fr 1fr !important;
          }

          .invoice-table-desktop {
            display: block !important;
          }

          .invoice-card-mobile {
            display: none !important;
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
            max-width: 60% !important;
          }

          .invoice-footer-right {
            width: 210px !important;
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
