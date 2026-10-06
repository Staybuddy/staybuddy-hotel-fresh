import { db } from '@/lib/firebaseAdmin';
import PrintButton from '../../invoice/PrintButton';

export default async function TaxInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  
  const invDoc = await db.collection('taxInvoices').doc(resolvedParams.id).get();
  
  if (!invDoc.exists) {
    return <div>Tax Invoice not found for ID: {resolvedParams.id}</div>;
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
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      
      {/* Print Button */}
      <div className="no-print" style={{ maxWidth: '900px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/admin" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>← Back to Dashboard</a>
        <PrintButton />
      </div>

      {/* Invoice Document */}
      <div 
        className="invoice-container"
        style={{ 
          maxWidth: '900px', margin: '0 auto', backgroundColor: 'white', 
          padding: '50px 60px', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          color: '#1f2937', fontSize: '11px', lineHeight: '1.5', position: 'relative'
        }}
      >
        {/* Subtle Watermark */}
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-45deg)',
          fontSize: '120px', fontWeight: 900, color: '#ea580c', opacity: 0.03, pointerEvents: 'none', zIndex: 0,
          whiteSpace: 'nowrap'
        }}>
          StayBuddy
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          
          {/* Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ width: '33.33%' }}>
              <h2 style={{ margin: '0', fontSize: '24px', color: '#111827', fontWeight: 800, textTransform: 'uppercase' }}>Tax Invoice</h2>
            </div>
            <div style={{ width: '33.33%', textAlign: 'center' }}>
              <h1 style={{ margin: 0, fontSize: '36px', color: '#ea580c', fontWeight: 900, letterSpacing: '-1px' }}>StayBuddy.</h1>
            </div>
            <div style={{ width: '33.33%' }}></div>
          </div>

          {/* Invoice Details */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '30px', borderBottom: '1px solid #e5e7eb', paddingBottom: '20px' }}>
            <div style={{ width: '50%' }}>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#6b7280', fontSize: '9px' }}>Booking ID</div>
                <div style={{ fontWeight: 700, color: '#111827' }}>{inv.bookingId || 'N/A'}</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#6b7280', fontSize: '9px' }}>Invoice No.</div>
                <div style={{ fontWeight: 700, color: '#111827' }}>{invoiceNum}</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#6b7280', fontSize: '9px' }}>Date</div>
                <div style={{ fontWeight: 700, color: '#111827' }}>{invoiceDate}</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#6b7280', fontSize: '9px' }}>Place of Supply</div>
                <div style={{ fontWeight: 700, color: '#111827' }}>{inv.placeOfSupply || 'N/A'}</div>
              </div>
            </div>
            <div style={{ width: '50%' }}>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#6b7280', fontSize: '9px' }}>HSN/SAC</div>
                <div style={{ fontWeight: 700, color: '#111827' }}>998552</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#6b7280', fontSize: '9px' }}>GSTIN</div>
                <div style={{ fontWeight: 700, color: '#111827' }}>{inv.gstNumber || 'Not Available'}</div>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <div style={{ color: '#6b7280', fontSize: '9px' }}>Service Description</div>
                <div style={{ fontWeight: 700, color: '#111827' }}>Reservation service for accommodation</div>
              </div>
            </div>
          </div>

          {/* Billing Details Grid */}
          <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', alignItems: 'stretch' }}>
            
            {/* Billed To */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', borderBottom: 'none' }}>
                Billed To (Customer Details)
              </div>
              <div style={{ border: '1px solid #e5e7eb', padding: '12px', flex: 1, minHeight: '120px', fontSize: '10px', lineHeight: '1.5' }}>
                {inv.companyName && (
                  <div style={{ fontSize: '10px', marginBottom: '4px' }}>
                    <strong style={{ color: '#374151' }}>Company Name:</strong> <strong style={{ color: '#111827' }}>{inv.companyName}</strong>
                  </div>
                )}
                <div style={{ fontSize: '10px', marginBottom: '4px' }}>
                  <strong style={{ color: '#374151' }}>Guest Name:</strong> <strong style={{ color: '#ea580c' }}>{inv.guestName || inv.customerName}</strong>
                </div>
                {inv.address && (
                  <div style={{ color: '#4b5563', wordBreak: 'break-word', whiteSpace: 'pre-line' }}>
                    <strong style={{ color: '#374151' }}>Address:</strong> {inv.address}
                  </div>
                )}
              </div>
            </div>

            {/* Stay Details */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', borderBottom: 'none' }}>
                Stay Details
              </div>
              <div style={{ border: '1px solid #e5e7eb', padding: '12px', flex: 1, minHeight: '120px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', backgroundColor: '#f3f4f6', padding: '8px 10px', borderRadius: '4px' }}>
                  <div>
                    <span style={{ color: '#6b7280' }}>Check-In:</span><br/>
                    <strong style={{ color: '#ea580c' }}>{inv.checkInDate ? formatDate(inv.checkInDate) : 'N/A'} (12 PM)</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#6b7280' }}>Check-Out:</span><br/>
                    <strong style={{ color: '#ea580c' }}>{inv.checkOutDate ? formatDate(inv.checkOutDate) : 'N/A'} (11 AM)</strong>
                  </div>
                </div>
                <div style={{ marginTop: '10px', color: '#4b5563', fontSize: '10px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <span><strong>Duration:</strong> {inv.noOfNights || 1} Night(s)</span>
                  <span><strong>Rooms:</strong> {inv.noOfRooms || 1} ({inv.noOfGuests || 1} Guest{inv.noOfGuests > 1 ? 's' : ''})</span>
                  <span><strong>Tariff/Room/Night:</strong> <strong style={{ color: '#ea580c' }}>₹{formatCurrency(inv.tariffPerNight || basePrice)}</strong></span>
                </div>
              </div>
            </div>
            
          </div>

          {/* Itemized Table */}
          <div style={{ marginBottom: '30px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', color: '#374151', textTransform: 'uppercase', fontSize: '10px' }}>
                  <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', textAlign: 'center', width: '5%' }}>Sl.</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', textAlign: 'left', width: '47%' }}>Description of Service</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', textAlign: 'center', width: '15%' }}>Quantity</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', textAlign: 'right', width: '15%' }}>Per Day Tariff (₹)</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', textAlign: 'right', width: '18%' }}>Taxable Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#4b5563' }}>1</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#111827' }}>
                    <strong>Accommodation Charges</strong><br/>
                    <span style={{ color: '#6b7280', fontSize: '9px' }}>{inv.description || 'Room Only (Base Rate)'}</span>
                    {inv.hotelName && (
                      <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 600 }}>
                        <span style={{ color: '#6b7280' }}>Hotel: </span>
                        <strong style={{ color: '#ea580c' }}>{inv.hotelName}{inv.placeOfSupply ? `, ${inv.placeOfSupply}` : ''}</strong>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#4b5563' }}>{(inv.noOfRooms || 1)} Room(s) × {inv.noOfNights || 1} Night(s)</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#ea580c', fontWeight: 600 }}>{formatCurrency(inv.tariffPerNight || basePrice)}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#111827', fontWeight: 600 }}>{formatCurrency(basePrice)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tax Breakup & Grand Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
            
            {/* Amount in words and terms */}
            <div style={{ flex: 1, paddingRight: '40px' }}>
              <div style={{ marginBottom: '20px' }}>
                <strong style={{ fontSize: '10px', color: '#374151' }}>Total Invoice Amount in Words:</strong><br/>
                <span style={{ color: '#111827', fontStyle: 'italic' }}>Indian Rupees {grandTotal.toLocaleString()} Only.</span>
              </div>
              <div>
                <strong style={{ fontSize: '10px', color: '#374151' }}>Terms & Conditions:</strong>
                <ol style={{ paddingLeft: '15px', color: '#6b7280', fontSize: '9px', margin: '5px 0' }}>
                  <li style={{ marginBottom: '3px' }}>Payment verified via electronic mode. This invoice is generated upon receipt of payment.</li>
                  <li style={{ marginBottom: '3px' }}>Any discrepancy must be reported within 48 hours of invoice generation.</li>
                  <li style={{ marginBottom: '3px' }}>Input Tax Credit (ITC) eligibility is determined as per applicable GST laws.</li>
                  <li>This is a system generated document. No signature is required.</li>
                </ol>
              </div>
            </div>

            {/* Totals Table */}
            <div style={{ width: '320px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>Total Taxable Value</td>
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 600, color: '#111827' }}>₹{formatCurrency(basePrice)}</td>
                  </tr>
                  
                  {gstPercentage > 0 ? (
                    isInterState ? (
                      <tr>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>IGST @ {gstPercentage}%</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#111827' }}>₹{formatCurrency(igstAmount)}</td>
                      </tr>
                    ) : (
                      <>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>CGST @ {gstPercentage / 2}%</td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#111827' }}>₹{formatCurrency(cgstAmount)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>SGST @ {gstPercentage / 2}%</td>
                          <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#111827' }}>₹{formatCurrency(sgstAmount)}</td>
                        </tr>
                      </>
                    )
                  ) : (
                    <tr>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>GST @ 0%</td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#111827' }}>₹0.00</td>
                    </tr>
                  )}
                  
                  <tr style={{ backgroundColor: '#fff7ed' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#ea580c', fontWeight: 800, fontSize: '14px' }}>Grand Total</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#ea580c', fontWeight: 800, fontSize: '14px' }}>₹{formatCurrency(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <span style={{ display: 'inline-block', border: '2px solid #22c55e', color: '#22c55e', padding: '4px 12px', fontWeight: 800, borderRadius: '4px', transform: 'rotate(-5deg)', letterSpacing: '1px' }}>PAID IN FULL</span>
              </div>
            </div>

          </div>

          {/* Footer Signature & Company Info */}
          <div style={{ marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            
            {/* Company Info Moved to Bottom */}
            <div style={{ fontSize: '9px', color: '#6b7280', lineHeight: '1.6' }}>
              <strong style={{ color: '#4b5563', fontSize: '10px', textTransform: 'uppercase' }}>Stay Buddy (Proprietorship: Mulla Arif)</strong><br/>
              1st Floor, 11-3, Shamshabad Flyover, Near Appu Pan Shop,<br/>
              Shamshabad, Hyderabad, Rangareddy, Telangana 501218<br/>
              <strong>GSTIN:</strong> 36FSKPM3408R1ZZ &nbsp;|&nbsp; <strong>Email:</strong> staybuddyhotels@gmail.com
            </div>

            {/* Signature */}
            <div style={{ textAlign: 'center', width: '200px' }}>
              <div style={{ height: '50px', borderBottom: '1px solid #cbd5e1', marginBottom: '8px' }}>
                {/* SVG Signature Placeholder */}
                <svg width="100" height="40" viewBox="0 0 100 40" style={{ opacity: 0.5, display: 'block', margin: '0 auto' }}>
                  <path d="M 10 30 Q 30 10, 40 25 T 60 15 T 90 25" fill="transparent" stroke="#111827" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <strong style={{ fontSize: '10px', color: '#111827' }}>Authorized Signatory</strong>
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body { background-color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .invoice-container { box-shadow: none !important; padding: 0 !important; max-width: 100% !important; margin: 0 !important; border: none !important; }
        }
      `}} />
    </div>
  );
}
