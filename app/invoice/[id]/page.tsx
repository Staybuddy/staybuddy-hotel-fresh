import connectDB from '@/lib/mongodb';
import Booking from '@/models/Booking';
import PrintButton from '../PrintButton';
import { notFound } from 'next/navigation';

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const resolvedParams = await params;
  const booking = await Booking.findById(resolvedParams.id)
    .populate('hotelId')
    .populate('roomId')
    .lean() as any;

  if (!booking) {
    return <div>Booking not found for ID: {resolvedParams.id}</div>;
  }

  // Invoice calculations
  const grandTotal = booking.totalPrice;
  const basePrice = Math.round(grandTotal / 1.05); // 5% GST assumed
  const gstAmount = grandTotal - basePrice;
  const cgstAmount = gstAmount / 2;
  const sgstAmount = gstAmount / 2;
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const invoiceNum = `INV-${booking.bookingId.substring(0, 8).toUpperCase()}`;
  const bookingDate = new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Inter", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      
      {/* Print Button */}
      <div className="no-print" style={{ maxWidth: '900px', margin: '0 auto 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <a href="/my-bookings" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>← Back to Dashboard</a>
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
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #ea580c', paddingBottom: '20px', marginBottom: '25px', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '36px', color: '#ea580c', fontWeight: 900, letterSpacing: '-1px' }}>StayBuddy.</h1>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ margin: '0 0 8px 0', fontSize: '22px', color: '#111827', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Tax Invoice</h2>
              <table style={{ width: '100%', fontSize: '10px', textAlign: 'right' }}>
                <tbody>
                  <tr>
                    <td style={{ color: '#6b7280', paddingRight: '15px' }}>Invoice No:</td>
                    <td style={{ fontWeight: 700, color: '#111827' }}>{invoiceNum}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#6b7280', paddingRight: '15px' }}>Booking ID:</td>
                    <td style={{ fontWeight: 700, color: '#111827' }}>{booking.bookingId}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#6b7280', paddingRight: '15px' }}>Invoice Date:</td>
                    <td style={{ fontWeight: 700, color: '#111827' }}>{bookingDate}</td>
                  </tr>
                  <tr>
                    <td style={{ color: '#6b7280', paddingRight: '15px' }}>Place of Supply:</td>
                    <td style={{ fontWeight: 700, color: '#111827' }}>{booking.hotelId?.state || 'Maharashtra'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Billing & Hotel Details Grid */}
          <div style={{ display: 'flex', gap: '30px', marginBottom: '30px' }}>
            
            {/* Billed To */}
            <div style={{ flex: 1 }}>
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', borderBottom: 'none' }}>
                Billed To (Customer Details)
              </div>
              <div style={{ border: '1px solid #e5e7eb', padding: '12px', height: '110px' }}>
                <strong style={{ fontSize: '12px', color: '#111827', display: 'block', marginBottom: '4px' }}>{booking.gstCompanyName || booking.guestName}</strong>
                <div style={{ color: '#4b5563' }}>
                  {booking.guestName}<br/>
                  {booking.guestPhone}<br/>
                  {booking.guestEmail}
                </div>
                {booking.gstRegistrationNo && (
                  <div style={{ marginTop: '8px', color: '#111827' }}>
                    <strong>GSTIN:</strong> {booking.gstRegistrationNo}<br/>
                    <strong>Address:</strong> {booking.gstCompanyAddress}
                  </div>
                )}
              </div>
            </div>

            {/* Hotel Details */}
            <div style={{ flex: 1 }}>
              <div style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', padding: '6px 12px', fontSize: '10px', fontWeight: 700, color: '#374151', textTransform: 'uppercase', borderBottom: 'none' }}>
                Property Details
              </div>
              <div style={{ border: '1px solid #e5e7eb', padding: '12px', height: '110px' }}>
                <strong style={{ fontSize: '12px', color: '#111827', display: 'block', marginBottom: '4px' }}>{booking.hotelId?.name}</strong>
                <div style={{ color: '#4b5563' }}>
                  {booking.hotelId?.address}<br/>
                  {booking.hotelId?.city}, {booking.hotelId?.state} - {booking.hotelId?.zipCode}
                </div>
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '10px', backgroundColor: '#f3f4f6', padding: '6px', borderRadius: '4px' }}>
                  <div>
                    <span style={{ color: '#6b7280' }}>Check-In:</span><br/>
                    <strong style={{ color: '#111827' }}>{formatDate(booking.checkIn)} (12 PM)</strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ color: '#6b7280' }}>Check-Out:</span><br/>
                    <strong style={{ color: '#111827' }}>{formatDate(booking.checkOut)} (11 AM)</strong>
                  </div>
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
                  <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', textAlign: 'left', width: '35%' }}>Description of Service</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', textAlign: 'center', width: '12%' }}>HSN / SAC</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', textAlign: 'center', width: '12%' }}>Room(s) x Night(s)</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', textAlign: 'right', width: '18%' }}>Rate (₹)</th>
                  <th style={{ padding: '10px 12px', border: '1px solid #e5e7eb', textAlign: 'right', width: '18%' }}>Taxable Value (₹)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#4b5563' }}>1</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', color: '#111827' }}>
                    <strong>Accommodation Charges</strong><br/>
                    <span style={{ color: '#6b7280', fontSize: '9px' }}>{booking.roomId?.type || 'Standard Room'} - Room Only (Base Rate)</span>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#4b5563' }}>998552</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'center', color: '#4b5563' }}>{booking.rooms || 1} x {booking.nights}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#4b5563' }}>{Math.round(basePrice / booking.nights).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  <td style={{ padding: '12px', border: '1px solid #e5e7eb', textAlign: 'right', color: '#111827', fontWeight: 600 }}>{basePrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
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
                  <li style={{ marginBottom: '3px' }}>Payment verified via {booking.paymentMethod || 'electronic mode'}. This invoice is generated upon receipt of payment.</li>
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
                    <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 600, color: '#111827' }}>₹{basePrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                  </tr>
                  {booking.hotelId?.state === 'Maharashtra' ? (
                    <>
                      <tr>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>CGST @ 2.5%</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#111827' }}>₹{cgstAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>SGST @ 2.5%</td>
                        <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#111827' }}>₹{sgstAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', color: '#4b5563' }}>IGST @ 5.0%</td>
                      <td style={{ padding: '8px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#111827' }}>₹{gstAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                    </tr>
                  )}
                  <tr style={{ backgroundColor: '#fff7ed' }}>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#ea580c', fontWeight: 800, fontSize: '14px' }}>Grand Total</td>
                    <td style={{ padding: '12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', color: '#ea580c', fontWeight: 800, fontSize: '14px' }}>₹{grandTotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
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
              <strong style={{ color: '#4b5563', fontSize: '10px', textTransform: 'uppercase' }}>Staybuddy (India) Private Limited</strong><br/>
              12th Floor, Tower B, Tech Park, Andheri East, Mumbai, Maharashtra, 400053<br/>
              <strong>GSTIN:</strong> 27AABCS1429B1Z5 &nbsp;|&nbsp; <strong>PAN:</strong> AABCS1429B &nbsp;|&nbsp; <strong>Email:</strong> support@staybuddy.com
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
