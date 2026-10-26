import { db } from '@/lib/firebaseAdmin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import AgreementPrintBtn from './AgreementPrintBtn';
import Logo from '@/components/Logo';

export const dynamic = 'force-dynamic';

export default async function PartnerAgreementPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ hotelId?: string }> 
}) {
  const resolvedParams = await searchParams;
  let hotel: any = null;
  let partner: any = null;
  let rooms: any[] = [];

  // 1. Resolve hotel from searchParams if provided
  if (resolvedParams?.hotelId) {
    try {
      const hotelDoc = await db.collection('hotels').doc(resolvedParams.hotelId).get();
      if (hotelDoc.exists) {
        hotel = { _id: hotelDoc.id, ...hotelDoc.data() };
      }
    } catch (e) {
      console.error('Error fetching hotel by hotelId:', e);
    }
  }

  // 2. If no hotel resolved, attempt lookup via logged-in session
  if (!hotel) {
    try {
      const session = await getServerSession(authOptions);
      if (session?.user) {
        const partnerId = (session.user as any).id || (session.user as any)._id;
        if (partnerId) {
          const hotelSnap = await db.collection('hotels').where('partnerId', '==', partnerId).limit(1).get();
          if (!hotelSnap.empty) {
            hotel = { _id: hotelSnap.docs[0].id, ...hotelSnap.docs[0].data() };
          }
        }
      }
    } catch (e) {
      console.error('Error resolving hotel from session:', e);
    }
  }

  // 3. Fallback: retrieve the first active hotel for generic/sample view
  if (!hotel) {
    try {
      const fallbackSnap = await db.collection('hotels').limit(1).get();
      if (!fallbackSnap.empty) {
        hotel = { _id: fallbackSnap.docs[0].id, ...fallbackSnap.docs[0].data() };
      }
    } catch (e) {
      console.error('Error fetching fallback hotel:', e);
    }
  }

  // Resolve partner details
  if (hotel?.partnerId) {
    try {
      const userDoc = await db.collection('users').doc(hotel.partnerId).get();
      if (userDoc.exists) {
        partner = userDoc.data();
      }
    } catch (e) {
      console.error('Error fetching partner:', e);
    }
  }

  // Resolve ALL rooms for this hotel (No limit(1) - show all room categories)
  if (hotel?._id) {
    try {
      const roomsSnap = await db.collection('rooms').where('hotelId', '==', hotel._id).get();
      rooms = roomsSnap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
      rooms.sort((a, b) => (a.type || '').localeCompare(b.type || ''));
    } catch (e) {
      console.error('Error fetching rooms:', e);
    }
  }

  // Format currency helper
  const formatPrice = (val: any) => {
    const num = Number(val);
    if (!num || isNaN(num) || num <= 0) return null;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const agreementDate = hotel?.createdAt 
    ? new Date(hotel.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const totalInventory = rooms.reduce((sum, r) => sum + (Number(r.totalRooms) || 0), 0);
  const totalStayBuddyAlloc = rooms.reduce((sum, r) => sum + (Number(r.staybuddyAllocation ?? r.totalRooms) || 0), 0);

  return (
    <div className="agreement-container" style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div className="agreement-inner-card" style={{ maxWidth: '920px', margin: '0 auto', background: 'white', padding: '48px', borderRadius: '16px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.06), 0 8px 10px -6px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
        
        {/* Header with Official Logo & Agreement Meta */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', borderBottom: '2px solid #f1f5f9', paddingBottom: '24px', marginBottom: '32px' }}>
          <div>
            <div style={{ marginBottom: '8px' }}>
              <Logo size="md" />
            </div>
            <h1 style={{ fontSize: '1.65rem', color: '#0f172a', fontWeight: 800, margin: '4px 0 2px 0', letterSpacing: '-0.02em' }}>
              StayBuddy Hotel Partnership Agreement
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
              Master Services & Contracted Room Tariff Schedule
            </p>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              ✓ Contract Active
            </span>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
              Agreement Ref: <strong style={{ color: '#0f172a' }}>SB-AGR-{hotel?._id ? hotel._id.slice(-6).toUpperCase() : '2026'}</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Effective Date: <strong style={{ color: '#0f172a' }}>{agreementDate}</strong>
            </div>
          </div>
        </div>

        {/* Property & Partner Identification Box */}
        {hotel && (
          <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', marginBottom: '32px', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏨</span> Property & Registered Partner Particulars
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Property Name</div>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem', marginTop: '2px' }}>{hotel.name}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Location / City</div>
                <div style={{ fontWeight: 600, color: '#334155', marginTop: '2px' }}>{hotel.city || 'India'} {hotel.address ? `• ${hotel.address}` : ''}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Registered Partner</div>
                <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>{partner?.name || hotel.contactName || 'Property Owner'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Partner Email</div>
                <div style={{ fontWeight: 600, color: '#334155', marginTop: '2px' }}>{partner?.email || hotel.contactEmail || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contact Phone</div>
                <div style={{ fontWeight: 600, color: '#334155', marginTop: '2px' }}>{partner?.phone || hotel.phone || 'N/A'}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Rooms Enrolled</div>
                <div style={{ fontWeight: 700, color: '#ea580c', marginTop: '2px' }}>
                  {totalInventory > 0 ? `${totalInventory} Rooms (${totalStayBuddyAlloc} Smart Alloc)` : `${rooms.length} Room Types`}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCHEDULE A: Room Categories & Contracted Tariffs (Core Requirement) */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, margin: '0 0 4px 0', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                Schedule A: Agreed Room Categories & Tariff Matrix
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>
                All room categories enrolled for this property with verified single, double, and triple occupancy price tiers.
              </p>
            </div>
            <div style={{ fontSize: '0.8rem', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: '12px', fontWeight: 600 }}>
              {rooms.length} {rooms.length === 1 ? 'Category' : 'Categories'} Listed
            </div>
          </div>

          {rooms.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', background: '#fff7ed', border: '1px dashed #f97316', borderRadius: '12px', color: '#9a3412' }}>
              <strong>No Room Categories Configured Yet</strong>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem' }}>
                Once you add room categories in the Partner Extranet, their complete single, double, and triple tariff schedule will be reflected here.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP VIEW: High-definition tabular contract schedule */}
              <div className="agreement-desktop-table agreement-tariff-table-wrap">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', textAlign: 'left', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: '#0f172a', color: 'white' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 700, borderBottom: '1px solid #334155' }}>Room Category</th>
                      <th style={{ padding: '12px 12px', fontWeight: 700, borderBottom: '1px solid #334155' }}>Plan</th>
                      <th style={{ padding: '12px 12px', fontWeight: 700, borderBottom: '1px solid #334155' }}>Single (1 Guest)</th>
                      <th style={{ padding: '12px 12px', fontWeight: 700, borderBottom: '1px solid #334155' }}>Double (2 Guests)</th>
                      <th style={{ padding: '12px 12px', fontWeight: 700, borderBottom: '1px solid #334155' }}>Triple (3 Guests)</th>
                      <th style={{ padding: '12px 12px', fontWeight: 700, borderBottom: '1px solid #334155' }}>Agreed B2B Net</th>
                      <th style={{ padding: '12px 14px', fontWeight: 700, borderBottom: '1px solid #334155', textAlign: 'center' }}>Total Rooms</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map((room, idx) => {
                      const hasTriple = Boolean(room.priceTriple && Number(room.priceTriple) > 0);
                      const singleFormatted = formatPrice(room.priceSingle) || 'N/A';
                      const doubleFormatted = formatPrice(room.priceDouble) || singleFormatted;
                      const tripleFormatted = hasTriple ? formatPrice(room.priceTriple) : null;
                      const b2bFormatted = formatPrice(room.b2bPrice) || 'Contract Net';
                      const isEven = idx % 2 === 0;

                      return (
                        <tr key={room._id || idx} style={{ background: isEven ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '14px', fontWeight: 700, color: '#0f172a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>🛏️</span>
                              <span>{room.type}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500, marginTop: '2px' }}>
                              {room.bedType || 'Double Bed'} {room.size ? `• ${room.size} sq.ft` : ''}
                            </div>
                          </td>
                          <td style={{ padding: '14px 12px', fontWeight: 600, color: '#475569' }}>
                            <span style={{ background: '#f1f5f9', color: '#1e293b', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {room.ratePlan || 'EP'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 12px', fontWeight: 700, color: '#0f172a' }}>
                            {singleFormatted}
                          </td>
                          <td style={{ padding: '14px 12px', fontWeight: 700, color: '#0f172a' }}>
                            {doubleFormatted}
                          </td>
                          <td style={{ padding: '14px 12px' }}>
                            {hasTriple ? (
                              <div>
                                <span style={{ fontWeight: 800, color: '#059669' }}>{tripleFormatted}</span>
                                <div style={{ fontSize: '0.7rem', color: '#047857', fontWeight: 600 }}>✓ 3 Guests Allowed</div>
                              </div>
                            ) : (
                              <div style={{ color: '#94a3b8', fontSize: '0.78rem', fontStyle: 'italic' }}>
                                ✕ Not Offered (Max 2)
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '14px 12px', fontWeight: 700, color: '#1d4ed8' }}>
                            {b2bFormatted}
                          </td>
                          <td style={{ padding: '14px', textAlign: 'center', fontWeight: 600, color: '#334155' }}>
                            <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>
                              {room.totalRooms !== undefined ? `${room.totalRooms} Rooms` : '—'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE VIEW: Ultra-clean responsive cards (no squashing, crystal-clear labels) */}
              <div className="agreement-mobile-cards">
                {rooms.map((room, idx) => {
                  const hasTriple = Boolean(room.priceTriple && Number(room.priceTriple) > 0);
                  const singleFormatted = formatPrice(room.priceSingle) || 'N/A';
                  const doubleFormatted = formatPrice(room.priceDouble) || singleFormatted;
                  const tripleFormatted = hasTriple ? formatPrice(room.priceTriple) : null;
                  const b2bFormatted = formatPrice(room.b2bPrice) || 'Contract Net';

                  return (
                    <div 
                      key={room._id || idx} 
                      style={{ 
                        background: '#ffffff', 
                        border: '1px solid #cbd5e1', 
                        borderRadius: '12px', 
                        padding: '16px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.03)'
                      }}
                    >
                      {/* Room Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                        <div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                            🛏️ {room.type}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {room.bedType || 'Double Bed'} {room.size ? `• ${room.size} sq.ft` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span style={{ background: '#f1f5f9', color: '#0f172a', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {room.ratePlan || 'EP'}
                          </span>
                          <span style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>
                            {room.totalRooms !== undefined ? `${room.totalRooms} Rooms` : '—'}
                          </span>
                        </div>
                      </div>

                      {/* 2x2 Pricing Grid on Mobile */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>1 Guest (Single)</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{singleFormatted}</div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>2 Guests (Double)</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{doubleFormatted}</div>
                        </div>

                        <div style={{ background: hasTriple ? '#ecfdf5' : '#f8fafc', padding: '10px', borderRadius: '8px', border: hasTriple ? '1px solid #a7f3d0' : '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.72rem', color: hasTriple ? '#047857' : '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>3 Guests (Triple)</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: hasTriple ? '#059669' : '#94a3b8', marginTop: '2px' }}>
                            {hasTriple ? tripleFormatted : '✕ Not Offered'}
                          </div>
                        </div>

                        <div style={{ background: '#eff6ff', padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                          <div style={{ fontSize: '0.72rem', color: '#1d4ed8', fontWeight: 700, textTransform: 'uppercase' }}>Agreed B2B Net</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#1d4ed8', marginTop: '2px' }}>{b2bFormatted}</div>
                        </div>
                      </div>

                      {/* Occupancy Policy Footnote */}
                      <div style={{ fontSize: '0.75rem', color: hasTriple ? '#059669' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>{hasTriple ? '✓' : 'ℹ️'}</span>
                        <span>
                          {hasTriple 
                            ? 'Triple occupancy configured. Can accommodate 1, 2, or 3 adults.' 
                            : 'Accommodates up to 2 guests only. System prevents 3-adult booking.'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Contractual Terms & Operational Protocols */}
        <div style={{ fontSize: '0.92rem', color: '#334155', lineHeight: '1.75', borderTop: '2px solid #f1f5f9', paddingTop: '28px' }}>
          
          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, margin: '0 0 6px 0' }}>
              1. B2B Inventory & Rolling Allocation Model
            </h4>
            <p style={{ margin: 0 }}>
              The Hotel agrees to allocate and manage daily room inventory via the StayBuddy Partner Extranet. In the event of non-update for any operational date, the system automatically rolls over and honors the contracted baseline inventory specified during property onboarding.
            </p>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, margin: '0 0 6px 0' }}>
              2. Commission & Listing Fee Terms
            </h4>
            <p style={{ margin: 0 }}>
              StayBuddy does not levy any commission or onboarding fee upon the Hotel Partner. Properties are enrolled and listed free of commission charges, transacting strictly upon contracted B2B net tariffs.
            </p>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, margin: '0 0 6px 0' }}>
              3. Contracted Multi-Occupancy Pricing Protocol
            </h4>
            <p style={{ margin: 0 }}>
              The Hotel agrees to provide room rates corresponding to agreed occupancies: Single (1 adult), Double (2 adults), and Triple (3 adults). Triple-occupancy bookings are strictly permitted ONLY for room categories where a verified Triple Price is defined in Schedule A. If a room category has no Triple Price configured, the StayBuddy booking engine enforces a strict cap of maximum 2 guests to prevent unauthorized over-capacity.
            </p>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, margin: '0 0 6px 0' }}>
              4. Cancellation & Refund Policy
            </h4>
            <ul style={{ paddingLeft: '20px', margin: '4px 0 0 0' }}>
              <li><strong>Prior to 48 Hours:</strong> 100% full refund to customer; zero cancellation penalty to either party.</li>
              <li><strong>24 to 48 Hours:</strong> StayBuddy retains/charges 50% of the contracted tariff.</li>
              <li><strong>Within 24 Hours / Same-Day / No-Show:</strong> 100% non-refundable; full payout processed according to standard settlement rules.</li>
            </ul>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, margin: '0 0 6px 0' }}>
              5. Settlement & Partner Payout Policy
            </h4>
            <p style={{ margin: 0 }}>
              For standard advance reservations confirmed 7+ days prior, payouts are initiated at guest check-in or earlier. Same-day / instant check-in bookings are cleared within 48 hours following successful guest arrival.
            </p>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, margin: '0 0 6px 0' }}>
              6. Instant Confirmation & Room Hold Guarantee
            </h4>
            <p style={{ margin: 0 }}>
              Upon issuance of a confirmed StayBuddy Booking Voucher, the Hotel is contractually obligated to immediately hold and provide the designated category without walk-outs or unwarranted rate modifications.
            </p>
          </div>

          <div style={{ marginBottom: '22px' }}>
            <h4 style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 700, margin: '0 0 6px 0' }}>
              7. Smart Allocation & Date Blocking
            </h4>
            <p style={{ margin: 0 }}>
              Partners are provided dedicated Availability Calendar controls to block rooms for private events or offline walk-ins, protecting both parties against double-booking and overflow.
            </p>
          </div>

        </div>

        {/* Digital Signature & Execution Block */}
        <div style={{ marginTop: '36px', paddingTop: '24px', borderTop: '2px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '24px' }}>
            
            {/* StayBuddy Corporate Execution */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                For & On Behalf of StayBuddy Technologies
              </div>
              <div style={{ margin: '14px 0 6px 0', fontSize: '1.2rem', fontFamily: 'cursive', color: '#ea580c', fontWeight: 700 }}>
                StayBuddy Authorized
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>Director of Partner Relations</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Digital Contract Execution System</div>
            </div>

            {/* Hotel Partner Electronic Acceptance */}
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                Hotel Partner Electronic Acceptance
              </div>
              <div style={{ margin: '14px 0 6px 0', fontSize: '1.1rem', fontWeight: 800, color: '#047857' }}>
                ✓ Digitally Acknowledged & Signed
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
                {partner?.name || hotel?.contactName || 'Authorized Hotel Partner'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Authenticated via Partner Extranet • {agreementDate}
              </div>
            </div>

          </div>

          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '0.82rem' }}>
            This document constitutes a legally binding partner tariff agreement executed under the Information Technology Act.
          </div>

          {/* Action buttons (Print / PDF / Return) */}
          <AgreementPrintBtn />
        </div>

      </div>
    </div>
  );
}
