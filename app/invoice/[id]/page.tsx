import { db } from '@/lib/firebaseAdmin';
import TaxInvoiceDocument, { TaxInvoiceData } from '@/components/TaxInvoiceDocument';

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

  const invoiceNum = `INV-${(booking.bookingId || booking._id).substring(0, 8).toUpperCase()}`;
  const bookingDate = new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const roomsCount = parseInt(booking.rooms, 10) || 1;
  const nightsCount = parseInt(booking.nights, 10) || 1;
  const guestsCount = parseInt(booking.guests, 10) || 1;
  const tariffPerNight = (basePrice / (roomsCount * nightsCount));

  const data: TaxInvoiceData = {
    invoiceNum,
    invoiceDate: bookingDate,
    bookingId: booking.bookingId || 'N/A',
    placeOfSupply,
    guestName: booking.guestName || 'Valued Guest',
    companyName: booking.gstCompanyName || '',
    gstNumber: booking.gstRegistrationNo || '',
    address: booking.gstCompanyAddress || '',
    hotelName: booking.hotelId?.name || 'StayBuddy Partner Hotel',
    hotelCity: booking.hotelId?.city || '',
    roomType: booking.roomId?.type || 'Standard Room',
    checkInDate: formatDate(booking.checkIn),
    checkOutDate: formatDate(booking.checkOut),
    noOfNights: nightsCount,
    noOfRooms: roomsCount,
    noOfGuests: guestsCount,
    tariffPerNight,
    basePrice,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    isInterState: Boolean(isInterState),
    grandTotal,
    paymentMethod: booking.paymentMethod || 'electronic mode',
    backUrl: '/my-bookings',
    backLabel: '← Back to My Bookings',
  };

  return <TaxInvoiceDocument data={data} />;
}
