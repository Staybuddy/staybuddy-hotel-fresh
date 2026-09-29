'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Logo from '@/components/Logo';

const NAV_ITEMS = [
  { id: 'hotels', label: 'My Properties', icon: '🏨' },
  { id: 'availability', label: 'Availability', icon: '📅' },
  { id: 'bookings', label: 'Bookings', icon: '📋' },
  { id: 'add-hotel', label: 'Add Property', icon: '➕' },
];

const PROPERTY_AMENITY_LIST = ['Free WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Parking', 'Bar', 'Pet Friendly', 'Laundry', '24-hour Front Desk', 'Elevator', 'Business Center'];
const ROOM_AMENITY_LIST = ['AC', 'Free WiFi', 'Room Service', 'Mini Bar', 'TV', 'Balcony', 'Bathtub', 'Coffee Maker', 'Safe'];

export default function PartnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('hotels');
  const [hotels, setHotels] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalHotels: 0, totalBookings: 0, totalRevenue: 0, pendingHotels: 0 });
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [addRoomModal, setAddRoomModal] = useState<string | null>(null);
  const [inventoryModal, setInventoryModal] = useState<any>(null);
  const [hotelRooms, setHotelRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [roomForm, setRoomForm] = useState({ type: 'Standard', description: '', priceSingle: '', priceDouble: '', priceTriple: '', b2bPrice: '', ratePlan: 'EP', maxGuests: '2', bedType: 'Double', size: '', totalRooms: '1', staybuddyAllocation: '1', images: '' });
  const [formStep, setFormStep] = useState(1);
  const [bookingFilter, setBookingFilter] = useState('All');
  const [bookingSearch, setBookingSearch] = useState('');

  const [hotelForm, setHotelForm] = useState({
    name: '', description: '', location: '', city: '', area: '', country: 'India', address: '', lat: '', lng: '', propertyType: 'Hotel',
    category: 'standard', starRating: '3', checkInTime: '14:00', checkOutTime: '11:00',
    totalPropertyRooms: '', totalFloors: '', providedRating: '4.5',
    contactName: '', contactDesignation: '', contactPhone: '', contactEmail: '',
    amenities: [] as string[], roomAmenities: [] as string[], extraAmenities: '', policies: '', images: [] as string[],
    rooms: [
      { id: Date.now().toString(), type: 'Standard Room', priceSingle: '', priceDouble: '', priceTriple: '', b2bPrice: '', amenities: [] as string[], images: [] as string[], size: '', bedType: 'Double', maxGuests: 2, totalRooms: 1, staybuddyAllocation: 1, ratePlan: 'EP', description: '' }
    ]
  });

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      const role = (session.user as any)?.role;
      if (role !== 'partner' && role !== 'admin') { router.push('/'); return; }
      fetchData();
    }
  }, [status, session]);

  async function fetchData() {
    setLoading(true);
    const partnerId = (session?.user as any)?.id;
    try {
      const [hotelRes, bookingRes] = await Promise.all([
        fetch(`/api/hotels?partnerId=${partnerId}&status=all&limit=50`),
        fetch(`/api/bookings?partnerId=${partnerId}&limit=50`),
        new Promise(resolve => setTimeout(resolve, 1500)) // Guarantee the beautiful load screen is visible
      ]);
      const [hotelData, bookingData] = await Promise.all([hotelRes.json(), bookingRes.json()]);

      const h = hotelData.hotels || [];
      const b = bookingData.bookings || [];
      setHotels(h);
      setBookings(b);

      const revenue = b.filter((bk: any) => bk.paymentStatus === 'paid').reduce((sum: number, bk: any) => sum + bk.totalPrice, 0);
      setStats({
        totalHotels: h.length,
        totalBookings: b.length,
        totalRevenue: revenue,
        pendingHotels: h.filter((h: any) => h.status === 'pending').length,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddHotel(e: React.FormEvent) {
    e.preventDefault();
    setAddError(''); setAddSuccess('');
    setAddLoading(true);
    const partnerId = (session?.user as any)?.id;
    const finalLocation = hotelForm.location || [hotelForm.area, hotelForm.city].filter(Boolean).join(', ');

    const res = await fetch('/api/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...hotelForm, 
        location: finalLocation, 
        partnerId, 
        starRating: parseInt(hotelForm.starRating)
      }),
    });
    const data = await res.json();
    setAddLoading(false);

    if (!res.ok) { setAddError(data.error || 'Failed to add property'); return; }
    setAddSuccess('Property submitted for approval! Our team will review it within 24 hours.');
    setHotelForm({ name: '', description: '', location: '', city: '', area: '', country: 'India', address: '', lat: '', lng: '', propertyType: 'Hotel', category: 'standard', starRating: '3', checkInTime: '14:00', checkOutTime: '11:00', totalPropertyRooms: '', totalFloors: '', providedRating: '4.5', contactName: '', contactDesignation: '', contactPhone: '', contactEmail: '', amenities: [], roomAmenities: [], extraAmenities: '', policies: '', images: [], rooms: [] });
    setFormStep(1);
    fetchData();
    setTimeout(() => setActiveTab('hotels'), 2000);
  }

  async function handleAddRoom(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...roomForm, 
        hotelId: addRoomModal, 
        priceSingle: parseInt(roomForm.priceSingle) || 0, 
        priceDouble: parseInt(roomForm.priceDouble) || 0, 
        priceTriple: parseInt(roomForm.priceTriple) || 0, 
        b2bPrice: parseInt(roomForm.b2bPrice) || 0, 
        maxGuests: parseInt(roomForm.maxGuests), 
        totalRooms: parseInt(roomForm.totalRooms), 
        staybuddyAllocation: parseInt(roomForm.staybuddyAllocation),
        size: roomForm.size ? parseInt(roomForm.size) : undefined,
        images: roomForm.images.split('\n').filter(i => i.trim() !== '')
      }),
    });
    if (res.ok) { setAddRoomModal(null); setRoomForm({ type: 'Standard', description: '', priceSingle: '', priceDouble: '', priceTriple: '', b2bPrice: '', ratePlan: 'EP', maxGuests: '2', bedType: 'Double', size: '', totalRooms: '1', staybuddyAllocation: '1', images: '' }); }
  }

  async function openInventory(hotel: any) {
    setInventoryModal(hotel);
    setLoadingRooms(true);
    try {
      const res = await fetch(`/api/rooms?hotelId=${hotel._id}`);
      const data = await res.json();
      setHotelRooms(data.rooms || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRooms(false);
    }
  }

  async function saveRoomInventory(roomIndex: number, field: string, value: any) {
    const room = hotelRooms[roomIndex];
    const newRooms = [...hotelRooms];
    newRooms[roomIndex] = { ...room, [field]: value };
    setHotelRooms(newRooms);
    
    try {
      await fetch('/api/rooms', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId: room._id, [field]: value })
      });
    } catch (e) {
      console.error(e);
    }
  }

  const toggleAmenity = (a: string) => setHotelForm(p => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a] }));

  if (status === 'authenticated' && (session.user as any)?.role === 'partner' && (session.user as any)?.partnerStatus !== 'approved') {
    return (
      <div style={{ 
        minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #fff7ed, white)', position: 'fixed', inset: 0, zIndex: 9999
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px', maxWidth: '500px' }}>
          <div style={{ transform: 'scale(1.2)', marginBottom: 'var(--space-6)' }}>
            <Logo size="lg" />
          </div>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ color: 'var(--brand-600)', margin: '0 0 16px 0', fontSize: '1.8rem', fontWeight: 800 }}>Account Pending Approval</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Your partner account is currently under review by our admin team. You will be granted access to the extranet dashboard once your account is verified.
          </p>
          <Link href="/" className="btn btn-secondary" style={{ marginTop: '32px' }}>Return to Homepage</Link>
        </div>
      </div>
    );
  }

  if (status === 'loading' || loading) return (
    <div style={{ 
      minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #fff7ed, white)', position: 'fixed', inset: 0, zIndex: 9999
    }}>
      <div style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ transform: 'scale(1.2)', marginBottom: 'var(--space-4)' }}>
          <Logo size="lg" />
        </div>
        <h2 style={{ color: 'var(--brand-600)', margin: '0 0 12px 0', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Welcome to StayBuddy Extranet</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="spinner" style={{ width: 20, height: 20, borderColor: 'var(--brand-200)', borderTopColor: 'var(--brand-500)' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Loading your dashboard...</span>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-secondary)' }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0 }}>
        <div style={{ padding: 'var(--space-6)' }}>
          <div style={{ marginBottom: 24 }}>
            <Logo size="md" />
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Management</div>
          {NAV_ITEMS.map(item => (
            <button key={item.id} className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`} style={{ width: '100%', background: 'none', border: 'none' }}
              onClick={() => setActiveTab(item.id)}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
          <div className="sidebar-section-label" style={{ marginTop: 'var(--space-4)' }}>Account</div>
          <Link href="/profile" className="sidebar-link">👤 Profile</Link>
          <Link href="/" className="sidebar-link">🌐 View Site</Link>
        </nav>
        <div style={{ padding: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>Signed in as</div>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.user?.name}</div>
          <span className="badge badge-primary" style={{ marginTop: 4 }}>Partner</span>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ padding: 'var(--space-8)' }}>



          {/* ===== MY HOTELS ===== */}
          {activeTab === 'hotels' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h1>My Hotels</h1>
                <button className="btn btn-primary" onClick={() => setActiveTab('add-hotel')}>+ Add New Hotel</button>
              </div>

              {hotels.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '80px 40px' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>🏨</div>
                  <h3>No Hotels Yet</h3>
                  <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>Add your first hotel to start accepting bookings.</p>
                  <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setActiveTab('add-hotel')}>Add Your Hotel</button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 'var(--space-6)' }}>
                  {hotels.map(hotel => (
                    <div key={hotel._id} className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: 'var(--shadow-md)' }}>
                      <div style={{ position: 'relative' }}>
                        {hotel.images?.[0] ? (
                          <img src={hotel.images[0]} alt={hotel.name} style={{ width: '100%', height: 200, objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: 200, background: 'linear-gradient(135deg, var(--brand-100), var(--brand-200))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏨</div>
                        )}
                        <div style={{ position: 'absolute', top: 12, right: 12 }}>
                          <span className={`badge ${hotel.status === 'approved' ? 'badge-success' : hotel.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`} style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>{hotel.status}</span>
                        </div>
                      </div>
                      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: 16 }}>
                          <h3 style={{ fontSize: '1.1rem', margin: '0 0 4px 0' }}>{hotel.name}</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>📍 {hotel.city}, {hotel.country}</p>
                          <div style={{ fontSize: '0.8rem', color: 'var(--brand-600)', fontWeight: 600, marginTop: 4 }}>ID: {hotel.hotelId || hotel._id?.slice(-8)}</div>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, padding: '12px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Starting From</div>
                            <div style={{ fontWeight: 700, color: 'var(--brand-600)' }}>{hotel.startingPrice ? `₹${hotel.startingPrice}` : 'N/A'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory</div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Manage Rooms</div>
                          </div>
                        </div>

                        {hotel.status === 'rejected' && hotel.rejectionReason && (
                          <div className="alert alert-error" style={{ fontSize: '0.8rem', marginBottom: 12 }}>⚠️ {hotel.rejectionReason}</div>
                        )}
                        {hotel.status === 'pending' && (
                          <div className="alert alert-warning" style={{ fontSize: '0.8rem', marginBottom: 12 }}>⏳ Under review by admin</div>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                          <button className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '10px 0', fontSize: '0.85rem', background: 'white', border: '1px solid var(--border)' }} onClick={() => setAddRoomModal(hotel._id)}>+ Add Room</button>
                          <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px 0', fontSize: '0.85rem' }} onClick={() => openInventory(hotel)}>Manage Inventory</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== AVAILABILITY CALENDAR ===== */}
          {activeTab === 'availability' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h1>Manage Availability</h1>
              </div>
              <div className="card" style={{ padding: 'var(--space-6)' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-6)' }}>
                  Block out specific dates to prevent StayBuddy users from booking them. Useful for maintenance, private events, or offline bookings.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr auto', gap: 'var(--space-4)', alignItems: 'end', marginBottom: 'var(--space-8)' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Select Property</label>
                    <select className="form-input form-select" style={{ height: 44 }}>
                      <option value="">-- Choose Hotel --</option>
                      {hotels.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>Start Date</label>
                    <input type="date" className="form-input" style={{ height: 44 }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 600 }}>End Date</label>
                    <input type="date" className="form-input" style={{ height: 44 }} />
                  </div>
                  <button className="btn btn-primary" style={{ height: 44, padding: '0 24px' }}>Block Dates</button>
                </div>
                
                <h3 style={{ fontSize: '1rem', marginBottom: 'var(--space-4)' }}>Calendar Overview</h3>
                <div style={{ padding: 'var(--space-8)', background: 'var(--bg-secondary)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: 12, opacity: 0.5 }}>📅</div>
                  <h4 style={{ margin: '0 0 8px 0' }}>Interactive Calendar Coming Soon</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>Soon you'll be able to drag, drop, and manage rates directly on a visual calendar.</p>
                </div>
              </div>
            </div>
          )}

          {/* ===== BOOKINGS ===== */}
          {activeTab === 'bookings' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
                <h1 style={{ margin: 0 }}>All Bookings</h1>
                <div style={{ display: 'flex', gap: 12 }}>
                  <input 
                    type="text" 
                    placeholder="Search by Guest Name or ID..." 
                    className="form-input"
                    style={{ width: 250 }}
                    value={bookingSearch}
                    onChange={e => setBookingSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 'var(--space-6)' }}>
                {['All', 'Upcoming', 'Confirmed', 'Completed', 'Cancelled'].map(filter => (
                  <button 
                    key={filter} 
                    className={`btn ${bookingFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ background: bookingFilter !== filter ? 'white' : undefined }}
                    onClick={() => setBookingFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {bookings.length === 0 ? (
                <div className="card" style={{ textAlign: 'center', padding: '80px 40px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
                  <h3>No bookings yet</h3>
                  <p style={{ marginTop: 8 }}>Bookings will appear here once guests start booking your hotels.</p>
                </div>
              ) : (
                <div className="card" style={{ border: 'none', boxShadow: 'var(--shadow-md)' }}>
                  <div className="table-wrapper" style={{ background: 'white' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          <th style={{ padding: '16px 24px', fontWeight: 600 }}>Booking ID</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600 }}>Guest Info</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600 }}>Hotel & Room</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600 }}>Stay Dates</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600, textAlign: 'center' }}>Nights</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600 }}>Payout (B2B)</th>
                          <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.filter(b => {
                          if (bookingFilter === 'Upcoming') {
                            if (b.status !== 'confirmed') return false;
                            const isFuture = new Date(b.checkIn).getTime() > Date.now();
                            if (!isFuture) return false;
                          } else if (bookingFilter !== 'All' && b.status.toLowerCase() !== bookingFilter.toLowerCase()) {
                            return false;
                          }
                          if (bookingSearch) {
                            const searchLower = bookingSearch.toLowerCase();
                            if (!b.guestName?.toLowerCase().includes(searchLower) && !b._id.toLowerCase().includes(searchLower)) return false;
                          }
                          return true;
                        }).map(b => (
                          <tr key={b._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background var(--transition-fast)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td style={{ padding: '16px 24px', fontSize: '0.75rem', color: 'var(--brand-600)', fontWeight: 600, fontFamily: 'monospace' }}>{b.bookingId || b._id.slice(-8)}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.guestName}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.guestEmail}</div>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{b.hotelId?.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.roomId?.type}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--brand-500)', fontWeight: 600, marginTop: 4 }}>ID: {b.hotelId?.hotelId || b.hotelId?._id?.slice(-8)}</div>
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '0.85rem' }}>
                              {new Date(b.checkIn).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} <br/>
                              <span style={{ color: 'var(--text-muted)' }}>to</span> {new Date(b.checkOut).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'center', fontSize: '0.875rem' }}>{b.nights}</td>
                            <td style={{ padding: '16px 24px', fontWeight: 700, color: '#059669' }}>₹{(b.totalPartnerPrice || b.totalPrice || 0).toLocaleString()}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                <span className={`badge ${b.status === 'confirmed' ? 'badge-success' : b.status === 'cancelled' ? 'badge-danger' : b.status === 'completed' ? 'badge-info' : 'badge-warning'}`} style={{ padding: '4px 8px', fontSize: '0.7rem' }}>{b.status}</span>
                                <span className={`badge ${b.paymentStatus === 'paid' ? 'badge-success' : b.paymentStatus === 'refunded' ? 'badge-info' : 'badge-warning'}`} style={{ padding: '4px 8px', fontSize: '0.7rem' }}>{b.paymentStatus}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== ADD PROPERTY WIZARD ===== */}
          {activeTab === 'add-hotel' && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ background: 'var(--brand-500)', color: 'white', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 12px', borderRadius: 'var(--radius-lg)', display: 'flex', fontSize: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>🏨</div>
                  <div>
                    <h2 style={{ margin: '0 0 4px 0', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.01em' }}>Add New Property — Extranet Onboarding</h2>
                    <div style={{ fontSize: '0.85rem', opacity: 0.9, fontWeight: 500 }}>Step {formStep} of 6 — {
                      ['Property Info', 'Location & Map', 'Room Types & Inventory', 'Photos & Gallery', 'Pricing & Rates', 'SEO & Publish'][formStep - 1] || 'Details'
                    }</div>
                  </div>
                </div>
                <button onClick={() => setActiveTab('overview')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                </button>
              </div>

              {/* Progress Bar Segmented */}
              <div style={{ display: 'flex', background: 'white', borderBottom: '1px solid var(--border)', padding: '0 16px' }}>
                {[
                  { step: 1, label: 'Property' },
                  { step: 2, label: 'Location' },
                  { step: 3, label: 'Amenities' },
                  { step: 4, label: 'Rooms' },
                  { step: 5, label: 'Photos' },
                  { step: 6, label: 'Confirm' }
                ].map(s => (
                  <div key={s.step} style={{ flex: 1, padding: '16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ height: 4, borderRadius: 2, background: formStep >= s.step ? 'var(--brand-500)' : 'var(--border)', transition: 'background 0.3s ease' }} />
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: formStep >= s.step ? 'var(--brand-600)' : 'var(--text-muted)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Form Content Area */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--space-8)' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', paddingBottom: 100 }}>
                  {addError && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}><span>⚠️</span> {addError}</div>}
                  {addSuccess && <div className="alert alert-success" style={{ marginBottom: 'var(--space-5)' }}><span>✅</span> {addSuccess}</div>}

              <form onSubmit={e => {
                e.preventDefault();
                if (formStep < 6) setFormStep(formStep + 1);
                else handleAddHotel(e);
              }} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                
                {/* STEP 1: Basic Info */}
                {formStep === 1 && (
                  <>
                  <div className="card fade-in">
                    <div className="card-header"><h3 style={{ fontSize: '1rem' }}>📝 Basic Information</h3></div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                      <div className="form-group">
                        <label className="form-label">Property Type <span className="required">*</span></label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-3)' }}>
                          {[
                            { type: 'Hotel', icon: '🏨' },
                            { type: 'Resort', icon: '🏖️' },
                            { type: 'Villa', icon: '🏡' },
                            { type: 'Homestay', icon: '🏠' },
                            { type: 'Serviced Apartment', icon: '🏢' },
                            { type: 'Hostel / Backpacker', icon: '🛏️' }
                          ].map(t => (
                            <div key={t.type} onClick={() => setHotelForm(p => ({ ...p, propertyType: t.type }))} 
                              style={{ border: `2px solid ${hotelForm.propertyType === t.type ? 'var(--brand-500)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: hotelForm.propertyType === t.type ? 'var(--brand-50)' : 'transparent', transition: 'all var(--transition-fast)' }}>
                              <span style={{ fontSize: '1.25rem' }}>{t.icon}</span>
                              <span style={{ fontSize: '0.875rem', fontWeight: hotelForm.propertyType === t.type ? 600 : 500 }}>{t.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Hotel / Property Name <span className="required">*</span></label>
                        <input className="form-input" type="text" placeholder={`e.g. Taj Falaknuma Palace`} value={hotelForm.name} onChange={e => setHotelForm(p => ({ ...p, name: e.target.value }))} required />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Star Category</label>
                          <select className="form-input form-select" value={hotelForm.starRating} onChange={e => {
                            const star = parseInt(e.target.value);
                            let category = 'budget';
                            if (star === 3) category = 'standard';
                            if (star === 4) category = 'premium';
                            if (star === 5) category = 'luxury';
                            setHotelForm(p => ({ ...p, starRating: e.target.value, category }));
                          }}>
                            <option value="1">⭐ 1-Star Budget</option>
                            <option value="2">⭐⭐ 2-Star Economy</option>
                            <option value="3">⭐⭐⭐ 3-Star Standard</option>
                            <option value="4">⭐⭐⭐⭐ 4-Star Premium</option>
                            <option value="5">⭐⭐⭐⭐⭐ 5-Star Luxury</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Rating (1.0 - 5.0)</label>
                          <input className="form-input" type="number" step="0.1" min="1" max="5" placeholder="4.5" value={hotelForm.providedRating} onChange={e => setHotelForm(p => ({ ...p, providedRating: e.target.value }))} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Rooms</label>
                          <input className="form-input" type="number" min="1" placeholder="120" value={hotelForm.totalPropertyRooms} onChange={e => setHotelForm(p => ({ ...p, totalPropertyRooms: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Total Floors</label>
                          <input className="form-input" type="number" min="1" placeholder="8" value={hotelForm.totalFloors} onChange={e => setHotelForm(p => ({ ...p, totalFloors: e.target.value }))} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Description <span className="required">*</span></label>
                        <textarea className="form-input form-textarea" placeholder="Describe your property, its unique features, and what guests can expect..." value={hotelForm.description} onChange={e => setHotelForm(p => ({ ...p, description: e.target.value }))} required />
                      </div>
                    </div>
                  </div>
                  <div className="card fade-in" style={{ marginTop: 'var(--space-4)' }}>
                    <div className="card-header"><h3 style={{ fontSize: '1rem' }}>📞 Contact Person</h3></div>
                    <div className="card-body">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Name</label>
                          <input className="form-input" type="text" placeholder="Mr. Rahul Sharma" value={hotelForm.contactName} onChange={e => setHotelForm(p => ({ ...p, contactName: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Designation</label>
                          <input className="form-input" type="text" placeholder="General Manager" value={hotelForm.contactDesignation} onChange={e => setHotelForm(p => ({ ...p, contactDesignation: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Phone</label>
                          <input className="form-input" type="tel" placeholder="+91 98765 43210" value={hotelForm.contactPhone} onChange={e => setHotelForm(p => ({ ...p, contactPhone: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Email</label>
                          <input className="form-input" type="email" placeholder="gm@hotel.com" value={hotelForm.contactEmail} onChange={e => setHotelForm(p => ({ ...p, contactEmail: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  </div>
                  </>
                )}

                {/* STEP 2: Location */}
                {formStep === 2 && (
                  <div className="card fade-in">
                    <div className="card-header"><h3 style={{ fontSize: '1rem' }}>📍 Location</h3></div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                      <div className="form-group">
                        <label className="form-label">Full Address <span className="required">*</span></label>
                        <input className="form-input" type="text" placeholder="123 Main Street, Area" value={hotelForm.address} onChange={e => setHotelForm(p => ({ ...p, address: e.target.value }))} required />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                          <label className="form-label">City <span className="required">*</span></label>
                          <input className="form-input" type="text" placeholder="e.g., Mumbai" value={hotelForm.city} onChange={e => setHotelForm(p => ({ ...p, city: e.target.value }))} required />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Area / Locality</label>
                          <input className="form-input" type="text" placeholder="e.g., Ameerpet" value={hotelForm.area} onChange={e => setHotelForm(p => ({ ...p, area: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Country</label>
                          <input className="form-input" type="text" value={hotelForm.country} onChange={e => setHotelForm(p => ({ ...p, country: e.target.value }))} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div className="form-group">
                          <label className="form-label">Latitude</label>
                          <input className="form-input" type="number" step="any" placeholder="19.0760" value={hotelForm.lat} onChange={e => setHotelForm(p => ({ ...p, lat: e.target.value }))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Longitude</label>
                          <input className="form-input" type="number" step="any" placeholder="72.8777" value={hotelForm.lng} onChange={e => setHotelForm(p => ({ ...p, lng: e.target.value }))} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Location / Area Description</label>
                        <input className="form-input" type="text" placeholder="e.g., Near Bandra-Kurla Complex, 2km from airport" value={hotelForm.location} onChange={e => setHotelForm(p => ({ ...p, location: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: Amenities & Policies */}
                {formStep === 3 && (
                  <>
                    <div className="card fade-in">
                      <div className="card-header"><h3 style={{ fontSize: '1rem' }}>🛎️ Amenities</h3></div>
                      <div className="card-body">
                        <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-3)', color: 'var(--text-secondary)' }}>Hotel / Property Amenities</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 'var(--space-5)' }}>
                          {PROPERTY_AMENITY_LIST.map(a => (
                            <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: `2px solid ${hotelForm.amenities.includes(a) ? 'var(--brand-500)' : 'var(--border)'}`, background: hotelForm.amenities.includes(a) ? 'var(--brand-50)' : 'transparent', transition: 'all var(--transition-fast)', fontSize: '0.875rem' }}>
                              <input type="checkbox" checked={hotelForm.amenities.includes(a)} onChange={() => toggleAmenity(a)} style={{ accentColor: 'var(--brand-500)' }} />
                              {a}
                            </label>
                          ))}
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Extra Amenities (Optional)</label>
                          <textarea className="form-input form-textarea" placeholder="Describe any unique or extra amenities not listed above..." value={hotelForm.extraAmenities} onChange={e => setHotelForm(p => ({ ...p, extraAmenities: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                    <div className="card fade-in" style={{ marginTop: 'var(--space-4)' }}>
                      <div className="card-header"><h3 style={{ fontSize: '1rem' }}>⏰ Check-in / Check-out & Policies</h3></div>
                      <div className="card-body">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                          <div className="form-group">
                            <label className="form-label">Check-in Time</label>
                            <input className="form-input" type="time" value={hotelForm.checkInTime} onChange={e => setHotelForm(p => ({ ...p, checkInTime: e.target.value }))} />
                          </div>
                          <div className="form-group">
                            <label className="form-label">Check-out Time</label>
                            <input className="form-input" type="time" value={hotelForm.checkOutTime} onChange={e => setHotelForm(p => ({ ...p, checkOutTime: e.target.value }))} />
                          </div>
                        </div>
                        <div className="form-group" style={{ marginTop: 'var(--space-4)' }}>
                          <label className="form-label">Property Policies</label>
                          <textarea className="form-input form-textarea" placeholder="No smoking, No pets, ID required at check-in..." value={hotelForm.policies} onChange={e => setHotelForm(p => ({ ...p, policies: e.target.value }))} />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* STEP 4: Rooms */}
                {formStep === 4 && (
                  <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                    
                    {hotelForm.rooms.map((room, index) => (
                      <div key={room.id} className="card" style={{ border: '1px solid var(--brand-200)', boxShadow: 'var(--shadow-md)' }}>
                        <div className="card-header" style={{ background: 'var(--brand-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--brand-700)' }}>🛏️ Room Type {index + 1}</h3>
                          {hotelForm.rooms.length > 1 && (
                            <button type="button" className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }} onClick={() => setHotelForm(p => ({ ...p, rooms: p.rooms.filter(r => r.id !== room.id) }))}>Remove Room</button>
                          )}
                        </div>
                        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-4)' }}>
                            <div className="form-group">
                              <label className="form-label">Room Category <span className="required">*</span></label>
                              <input className="form-input" type="text" placeholder="e.g. Standard Room, Deluxe Sea View" value={room.type} onChange={e => {
                                const newRooms = [...hotelForm.rooms];
                                newRooms[index].type = e.target.value;
                                setHotelForm({ ...hotelForm, rooms: newRooms });
                              }} required />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Total Rooms <span className="required">*</span></label>
                              <input className="form-input" type="number" min="1" value={room.totalRooms} onChange={e => {
                                const newRooms = [...hotelForm.rooms];
                                newRooms[index].totalRooms = parseInt(e.target.value) || 1;
                                setHotelForm({ ...hotelForm, rooms: newRooms });
                              }} required />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Max Guests <span className="required">*</span></label>
                              <select className="form-input form-select" value={room.maxGuests} onChange={e => {
                                const newRooms = [...hotelForm.rooms];
                                newRooms[index].maxGuests = parseInt(e.target.value) || 2;
                                setHotelForm({ ...hotelForm, rooms: newRooms });
                              }}>
                                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} Guests</option>)}
                              </select>
                            </div>
                          </div>

                          <div>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-3)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pricing Configuration</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-4)' }}>
                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Single Price (₹) <span className="required">*</span></label>
                                <input className="form-input" type="number" min="0" value={room.priceSingle} onChange={e => {
                                  const newRooms = [...hotelForm.rooms];
                                  newRooms[index].priceSingle = e.target.value;
                                  setHotelForm({ ...hotelForm, rooms: newRooms });
                                }} required />
                              </div>
                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Double Price (₹) <span className="required">*</span></label>
                                <input className="form-input" type="number" min="0" value={room.priceDouble} onChange={e => {
                                  const newRooms = [...hotelForm.rooms];
                                  newRooms[index].priceDouble = e.target.value;
                                  setHotelForm({ ...hotelForm, rooms: newRooms });
                                }} required />
                              </div>
                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Triple Price (₹)</label>
                                <input className="form-input" type="number" min="0" value={room.priceTriple} onChange={e => {
                                  const newRooms = [...hotelForm.rooms];
                                  newRooms[index].priceTriple = e.target.value;
                                  setHotelForm({ ...hotelForm, rooms: newRooms });
                                }} />
                              </div>
                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>B2B Price (₹)</label>
                                <input className="form-input" type="number" min="0" value={room.b2bPrice} onChange={e => {
                                  const newRooms = [...hotelForm.rooms];
                                  newRooms[index].b2bPrice = e.target.value;
                                  setHotelForm({ ...hotelForm, rooms: newRooms });
                                }} />
                              </div>
                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '0.75rem' }}>Rate Plan</label>
                                <select className="form-input form-select" value={room.ratePlan} onChange={e => {
                                  const newRooms = [...hotelForm.rooms];
                                  newRooms[index].ratePlan = e.target.value;
                                  setHotelForm({ ...hotelForm, rooms: newRooms });
                                }}>
                                  <option value="EP">EP (Room Only)</option>
                                  <option value="CP">CP (Breakfast)</option>
                                  <option value="MAP">MAP (Half Board)</option>
                                  <option value="AP">AP (Full Board)</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 style={{ fontSize: '0.9rem', marginBottom: 'var(--space-3)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Room Amenities</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
                              {ROOM_AMENITY_LIST.map(a => {
                                const hasAmenity = (room.amenities || []).includes(a);
                                return (
                                <label key={a} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '6px 10px', borderRadius: 'var(--radius-md)', border: `1px solid ${hasAmenity ? 'var(--brand-500)' : 'var(--border)'}`, background: hasAmenity ? 'var(--brand-50)' : 'transparent', transition: 'all var(--transition-fast)', fontSize: '0.8rem' }}>
                                  <input type="checkbox" checked={hasAmenity} onChange={() => {
                                    const newRooms = [...hotelForm.rooms];
                                    const currentAmenities = newRooms[index].amenities || [];
                                    if (currentAmenities.includes(a)) {
                                      newRooms[index].amenities = currentAmenities.filter((item: string) => item !== a);
                                    } else {
                                      newRooms[index].amenities = [...currentAmenities, a];
                                    }
                                    setHotelForm({ ...hotelForm, rooms: newRooms });
                                  }} style={{ accentColor: 'var(--brand-500)' }} />
                                  {a}
                                </label>
                              )})}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
                            <div className="form-group">
                              <label className="form-label">Room Description</label>
                              <textarea className="form-input form-textarea" style={{ height: 100 }} placeholder="Spacious room with a king bed and ocean views..." value={room.description} onChange={e => {
                                const newRooms = [...hotelForm.rooms];
                                newRooms[index].description = e.target.value;
                                setHotelForm({ ...hotelForm, rooms: newRooms });
                              }} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Room-Specific Images (URLs)</label>
                              <textarea className="form-input form-textarea" style={{ height: 100 }} placeholder="https://example.com/room1.jpg&#10;https://example.com/room2.jpg" value={Array.isArray(room.images) ? room.images.join('\n') : ''} onChange={e => {
                                const newRooms = [...hotelForm.rooms];
                                newRooms[index].images = e.target.value.split('\n').filter(u => u.trim());
                                setHotelForm({ ...hotelForm, rooms: newRooms });
                              }} />
                            </div>
                          </div>

                        </div>
                      </div>
                    ))}

                    <button type="button" className="btn btn-secondary" style={{ alignSelf: 'center', padding: '12px 24px', borderStyle: 'dashed', borderWidth: 2 }} onClick={() => {
                      setHotelForm(p => ({
                        ...p,
                        rooms: [...p.rooms, { id: Date.now().toString(), type: '', priceSingle: '', priceDouble: '', priceTriple: '', b2bPrice: '', amenities: [], images: [], size: '', bedType: 'Double', maxGuests: 2, totalRooms: 1, staybuddyAllocation: 1, ratePlan: 'EP', description: '' }]
                      }))
                    }}>
                      + Add Another Room Type
                    </button>
                  </div>
                )}

                {/* STEP 5: Photos & Submit */}
                {formStep === 5 && (
                  <div className="card fade-in">
                    <div className="card-header"><h3 style={{ fontSize: '1rem' }}>📸 Property Images</h3></div>
                    <div className="card-body">
                      <div className="form-group">
                        <label className="form-label">Image URLs (one per line)</label>
                        <textarea className="form-input form-textarea" style={{ minHeight: 180 }}
                          placeholder="https://example.com/front.jpg&#10;https://example.com/lobby.jpg&#10;https://example.com/pool.jpg"
                          value={hotelForm.images.join('\n')}
                          onChange={e => setHotelForm(p => ({ ...p, images: e.target.value.split('\n').filter(u => u.trim()) }))} />
                        <span className="form-hint">Enter one image URL per line. High-quality images significantly increase bookings!</span>
                      </div>
                    </div>
                  </div>
                )}

                </form>
                </div>
              </div>

              {/* Sticky Footer */}
              <div style={{ background: 'white', padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 -4px 12px rgba(0,0,0,0.02)' }}>
                {formStep > 1 ? (
                  <button type="button" className="btn btn-secondary" style={{ padding: '10px 24px', borderRadius: 'var(--radius-lg)', background: 'white', border: '1px solid var(--border)', fontWeight: 600 }} onClick={() => setFormStep(formStep - 1)}>← Previous</button>
                ) : <div style={{ width: 120 }}></div>}
                
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Step {formStep} / 6
                </div>

                <button type="submit" className="btn btn-primary" style={{ padding: '10px 32px', borderRadius: 'var(--radius-lg)', fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)' }} disabled={addLoading} onClick={e => {
                  const form = e.currentTarget.closest('form');
                  if (form && !form.checkValidity()) {
                    return; // Let browser show native validation tooltip
                  }
                  e.preventDefault();
                  if (formStep < 6) setFormStep(formStep + 1);
                  else handleAddHotel(e as any);
                }}>
                  {addLoading ? <><div className="spinner" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> Submitting...</> : formStep < 6 ? 'Next Step →' : '🚀 Submit for Approval'}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Add Room Modal */}
      {addRoomModal && (
        <div className="modal-overlay" onClick={() => setAddRoomModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Room</h3>
              <button onClick={() => setAddRoomModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <form onSubmit={handleAddRoom}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label">Room Type <span className="required">*</span></label>
                  <input className="form-input" placeholder="e.g., Deluxe Double, Suite, Standard Single" value={roomForm.type} onChange={e => setRoomForm(p => ({ ...p, type: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-input form-textarea" style={{ minHeight: 80 }} placeholder="Room features and highlights..." value={roomForm.description} onChange={e => setRoomForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Single Price (₹) <span className="required">*</span></label>
                    <input className="form-input" type="number" min="0" value={roomForm.priceSingle} onChange={e => setRoomForm(p => ({ ...p, priceSingle: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Double Price (₹) <span className="required">*</span></label>
                    <input className="form-input" type="number" min="0" value={roomForm.priceDouble} onChange={e => setRoomForm(p => ({ ...p, priceDouble: e.target.value }))} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Triple Price (₹)</label>
                    <input className="form-input" type="number" min="0" value={roomForm.priceTriple} onChange={e => setRoomForm(p => ({ ...p, priceTriple: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>B2B Price (₹)</label>
                    <input className="form-input" type="number" min="0" value={roomForm.b2bPrice} onChange={e => setRoomForm(p => ({ ...p, b2bPrice: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', alignItems: 'center' }}>
                  <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, margin: 0 }}>
                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 'var(--space-2)' }}>
                      <label htmlFor="ratePlan" style={{ margin: 0, fontWeight: 600, cursor: 'pointer' }}>Rate Plan</label>
                      <select id="ratePlan" className="form-input form-select" value={roomForm.ratePlan} onChange={e => setRoomForm(p => ({ ...p, ratePlan: e.target.value }))}>
                        <option value="EP">EP (Room Only)</option>
                        <option value="CP">CP (Breakfast)</option>
                        <option value="MAP">MAP (Half Board)</option>
                        <option value="AP">AP (Full Board)</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max Guests <span className="required">*</span></label>
                    <select className="form-input form-select" value={roomForm.maxGuests} onChange={e => setRoomForm(p => ({ ...p, maxGuests: e.target.value }))}>
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Bed Type</label>
                    <select className="form-input form-select" value={roomForm.bedType} onChange={e => setRoomForm(p => ({ ...p, bedType: e.target.value }))}>
                      {['Single', 'Double', 'Queen', 'King', 'Twin', 'Bunk'].map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Size (m²)</label>
                    <input className="form-input" type="number" min="0" placeholder="25" value={roomForm.size} onChange={e => setRoomForm(p => ({ ...p, size: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Total Rooms in Property</label>
                    <input className="form-input" type="number" min="1" value={roomForm.totalRooms} onChange={e => setRoomForm(p => ({ ...p, totalRooms: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">StayBuddy Allocation</label>
                    <input className="form-input" type="number" min="1" value={roomForm.staybuddyAllocation} onChange={e => setRoomForm(p => ({ ...p, staybuddyAllocation: e.target.value }))} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rooms available on StayBuddy</span>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Room Images (URLs, one per line)</label>
                  <textarea className="form-input form-textarea" style={{ minHeight: 60 }} placeholder="https://example.com/room1.jpg&#10;https://example.com/room2.jpg" value={roomForm.images} onChange={e => setRoomForm(p => ({ ...p, images: e.target.value }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAddRoomModal(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Room</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inventory Panel Modal */}
      {inventoryModal && (
        <div className="modal-overlay" onClick={() => setInventoryModal(null)}>
          <div className="modal" style={{ maxWidth: '900px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Inventory & Pricing - {inventoryModal.name}</h3>
              <button onClick={() => setInventoryModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
            </div>
            <div className="modal-body">
              {loadingRooms ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                  <div className="spinner" style={{ width: 40, height: 40 }} />
                </div>
              ) : hotelRooms.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No rooms added for this hotel yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '12px 8px' }}>Room Type</th>
                        <th style={{ padding: '12px 8px' }}>Sgl (₹)</th>
                        <th style={{ padding: '12px 8px' }}>Dbl (₹)</th>
                        <th style={{ padding: '12px 8px' }}>Trp (₹)</th>
                        <th style={{ padding: '12px 8px' }}>B2B (₹)</th>
                        <th style={{ padding: '12px 8px' }}>Total</th>
                        <th style={{ padding: '12px 8px' }}>Alloc</th>
                        <th style={{ padding: '12px 8px' }}>BF</th>
                        <th style={{ padding: '12px 8px' }}>Images (comma sep)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hotelRooms.map((room, i) => (
                        <tr key={room._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 600 }}>{room.type}</td>
                          <td style={{ padding: '12px 8px' }}><input type="number" style={{ width: 60, padding: 4 }} value={room.priceSingle || ''} onChange={e => saveRoomInventory(i, 'priceSingle', e.target.value)} /></td>
                          <td style={{ padding: '12px 8px' }}><input type="number" style={{ width: 60, padding: 4 }} value={room.priceDouble || ''} onChange={e => saveRoomInventory(i, 'priceDouble', e.target.value)} /></td>
                          <td style={{ padding: '12px 8px' }}><input type="number" style={{ width: 60, padding: 4 }} value={room.priceTriple || ''} onChange={e => saveRoomInventory(i, 'priceTriple', e.target.value)} /></td>
                          <td style={{ padding: '12px 8px' }}><input type="number" style={{ width: 60, padding: 4 }} value={room.b2bPrice || ''} onChange={e => saveRoomInventory(i, 'b2bPrice', e.target.value)} /></td>
                          <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{room.totalRooms}</td>
                          <td style={{ padding: '12px 8px' }}><input type="number" style={{ width: 50, padding: 4 }} value={room.staybuddyAllocation || ''} onChange={e => saveRoomInventory(i, 'staybuddyAllocation', e.target.value)} /></td>
                          <td style={{ padding: '12px 8px' }}>
                            <select className="form-input form-select" value={room.ratePlan || 'EP'} onChange={e => saveRoomInventory(i, 'ratePlan', e.target.value)} style={{ padding: '4px 8px', fontSize: '0.8rem', height: 32 }}>
                              <option value="EP">EP</option>
                              <option value="CP">CP</option>
                              <option value="MAP">MAP</option>
                              <option value="AP">AP</option>
                            </select>
                          </td>
                          <td style={{ padding: '12px 8px' }}>
                            <input 
                              type="text" 
                              style={{ width: 120, padding: 4 }} 
                              placeholder="url1,url2" 
                              value={(room.images || []).join(',')} 
                              onChange={e => saveRoomInventory(i, 'images', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} 
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>* Changes are saved automatically.</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setInventoryModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
