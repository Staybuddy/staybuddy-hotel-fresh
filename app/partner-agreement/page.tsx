import { db } from '@/lib/firebaseAdmin';
import AgreementPrintBtn from './AgreementPrintBtn';

export default async function PartnerAgreementPage({ searchParams }: { searchParams: Promise<{ hotelId?: string }> }) {
  const resolvedParams = await searchParams;
  let hotel = null;
  let partner = null;
  let singlePrice = 'N/A';
  let doublePrice = 'N/A';
  
  if (resolvedParams.hotelId) {
    const hotelDoc = await db.collection('hotels').doc(resolvedParams.hotelId).get();
    if (hotelDoc.exists) {
      hotel = { _id: hotelDoc.id, ...hotelDoc.data() } as any;
      
      const userDoc = await db.collection('users').doc(hotel.partnerId).get();
      if (userDoc.exists) {
        partner = userDoc.data() as any;
      }
      
      const roomsSnap = await db.collection('rooms').where('hotelId', '==', hotel._id).limit(1).get();
      if (!roomsSnap.empty) {
        const room = roomsSnap.docs[0].data();
        singlePrice = room.priceSingle ? `₹${room.priceSingle}` : 'N/A';
        doublePrice = room.priceDouble ? `₹${room.priceDouble}` : 'N/A';
      }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '2rem', color: '#0f172a', fontWeight: 800, marginBottom: '8px' }}>StayBuddy Partner Agreement</h1>
          <p style={{ color: '#64748b' }}>Terms & Policies for Hotel Partners</p>
        </div>

        {hotel && partner && (
          <div style={{ background: '#f1f5f9', padding: '24px', borderRadius: '12px', marginBottom: '32px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#0f172a', fontWeight: 700, margin: '0 0 16px 0', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px' }}>
              Property & Partner Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.95rem' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Property Name</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{hotel.name}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Partner Name</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{partner.name || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Email</div>
                <div style={{ fontWeight: 600, color: '#334155' }}>{partner.email || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Mobile Number</div>
                <div style={{ fontWeight: 600, color: '#334155' }}>{partner.phone || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Agreed B2B Price (Single)</div>
                <div style={{ fontWeight: 700, color: '#1d4ed8' }}>{singlePrice}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Agreed B2B Price (Double)</div>
                <div style={{ fontWeight: 700, color: '#1d4ed8' }}>{doublePrice}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ fontSize: '1rem', color: '#334155', lineHeight: '1.8' }}>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, marginBottom: '8px' }}>1. B2B Inventory Model</h3>
            <p>You can add inventory on a daily basis (available rooms). If missed, the system will automatically roll over and continue the inventory provided during onboarding.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, marginBottom: '8px' }}>2. Commission Charge</h3>
            <p>StayBuddy will not charge any commission from the owner currently. Properties can be listed completely free of cost.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, marginBottom: '8px' }}>3. B2B Price</h3>
            <p>When defining B2B prices, partners must provide the best available market price for Business-to-Business.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, marginBottom: '8px' }}>4. Cancellation Policy</h3>
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              <li><strong>Before 48 hours:</strong> No cancellation fee.</li>
              <li><strong>Before 24 hours:</strong> StayBuddy will charge 50% of the booking price.</li>
              <li><strong>Same Day:</strong> No refund will be given.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, marginBottom: '8px' }}>5. Pay Out Policy</h3>
            <p>For bookings made a week in advance, payout will be done at the time of check-in or earlier. Same-day bookings will be cleared 48 hours after the booking is made.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, marginBottom: '8px' }}>6. Room Confirmation</h3>
            <p>When a room is confirmed via StayBuddy, the hotel must block the room immediately.</p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700, marginBottom: '8px' }}>7. Room Blocking</h3>
            <p>A room blocking option is provided in the dashboard to avoid overflow and double bookings.</p>
          </div>

        </div>

        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '16px' }}>
            By continuing to use the StayBuddy Partner Platform, you agree to these terms.
          </p>
          <AgreementPrintBtn />
        </div>

      </div>
    </div>
  );
}
