import { db } from '@/lib/firebaseAdmin';
import TaxInvoiceDocument, { TaxInvoiceData } from '@/components/TaxInvoiceDocument';

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
  const basePrice = Number(inv.totalAmount || inv.amount || 0);
  const grandTotal = Number(inv.grandTotal || basePrice);
  const gstAmount = Number(inv.gstAmount || 0);
  
  // Tax split for Intra-state (Telangana) vs Inter-state
  const placeOfSupply = inv.placeOfSupply || 'Telangana';
  const isInterState = placeOfSupply && !placeOfSupply.toLowerCase().includes('telangana');
  const cgstAmount = isInterState ? 0 : (gstAmount / 2);
  const sgstAmount = isInterState ? 0 : (gstAmount / 2);
  const igstAmount = isInterState ? gstAmount : 0;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  const invoiceNum = inv.invoiceNo || `INV-${inv._id.substring(0, 8).toUpperCase()}`;
  const invoiceDateStr = inv.invoiceDate || inv.date || new Date().toISOString();
  const invoiceDate = new Date(invoiceDateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const noOfNights = parseInt(inv.noOfNights, 10) || 1;
  const noOfRooms = parseInt(inv.noOfRooms, 10) || 1;
  const noOfGuests = parseInt(inv.noOfGuests, 10) || 1;
  const tariffPerNight = Number(inv.tariffPerNight) || (basePrice / (noOfRooms * noOfNights));

  const data: TaxInvoiceData = {
    invoiceNum,
    invoiceDate,
    bookingId: inv.bookingId || 'N/A',
    placeOfSupply,
    guestName: inv.guestName || 'Valued Guest',
    companyName: inv.companyName || '',
    gstNumber: inv.gstNumber || '',
    address: inv.address || '',
    hotelName: inv.hotelName || 'StayBuddy Partner Hotel',
    hotelCity: inv.hotelCity || '',
    roomType: inv.roomType || 'Standard Room',
    checkInDate: formatDate(inv.checkInDate),
    checkOutDate: formatDate(inv.checkOutDate),
    noOfNights,
    noOfRooms,
    noOfGuests,
    tariffPerNight,
    basePrice,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    isInterState: Boolean(isInterState),
    grandTotal,
    paymentMethod: 'electronic mode',
    backUrl: '/admin',
    backLabel: '← Back to Admin Extranet',
  };

  return <TaxInvoiceDocument data={data} />;
}
