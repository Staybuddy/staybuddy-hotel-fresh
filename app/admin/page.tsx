'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const NAV = [
  { id: 'overview', label: 'Dashboard', icon: '📊' },
  { id: 'bookings', label: 'Live Bookings', icon: '🛎️' },
  { id: 'partner_approvals', label: 'Partner Approvals', icon: '🧑‍💼' },
  { id: 'requests', label: 'Property Requests', icon: '📝' },
  { id: 'hotels', label: 'Properties & Margins', icon: '🏨' },
  { id: 'performance', label: 'Performance & Invoices', icon: '📈' },
  { id: 'users', label: 'User Analytics', icon: '👥' },
  { id: 'tax_invoices', label: 'Tax Invoices', icon: '🧾' },
];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('overview');
  const [hotels, setHotels] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [extranetModal, setExtranetModal] = useState<any>(null); // Hotel data for extranet edit
  const [taxInvoices, setTaxInvoices] = useState<any[]>([]);
  const getLocalDateString = () => {
    const today = new Date();
    return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  };

  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({ 
    guestName: '', companyName: '', gstNumber: '', address: '', bookingId: `NH${Math.floor(10000000000000 + Math.random() * 90000000000000)}`, placeOfSupply: 'Telangana',
    checkInDate: '', checkOutDate: '', noOfNights: '', noOfRooms: '1', noOfGuests: '1', totalAmount: '', 
    invoiceNo: `INV-${Math.floor(100000 + Math.random() * 900000)}`, 
    invoiceDate: getLocalDateString() 
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalHotels: 0, pendingHotels: 0, pendingPartners: 0, totalBookings: 0, totalRevenue: 0, totalProfit: 0, totalUsers: 0 });
  const [approveLoading, setApproveLoading] = useState<string | null>(null);
  const [hasNewBookings, setHasNewBookings] = useState(false);
  const [selectedInvoiceHotel, setSelectedInvoiceHotel] = useState<any>(null);
  const [editingHotel, setEditingHotel] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (activeTab === 'bookings') {
      setTimeout(() => { if (mounted) setHasNewBookings(false); }, 0);
    }
    return () => { mounted = false; };
  }, [activeTab]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status === 'authenticated') {
      const role = (session?.user as any)?.role;
      if (role !== 'admin') { router.push('/'); return; }
      fetchAll();

      const interval = setInterval(() => {
        fetch('/api/admin/bookings').then(r => r.json()).then(data => {
          setBookings(prev => {
            if (data.bookings && data.bookings.length > prev.length && prev.length > 0) {
              if (activeTab !== 'bookings') setHasNewBookings(true);
            }
            return data.bookings || prev;
          });
        }).catch(e => console.error(e));
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [status]);

  async function fetchAll() {
    setLoading(true);
    try {
      const [hotelRes, bookingRes, userRes, partnerRes, invoiceRes] = await Promise.all([
        fetch('/api/admin/hotels'),
        fetch('/api/admin/bookings'),
        fetch('/api/admin/users'),
        fetch('/api/admin/partners'),
        fetch('/api/admin/tax-invoices'),
      ]);
      const [hData, bData, uData, pData, iData] = await Promise.all([hotelRes.json(), bookingRes.json(), userRes.json(), partnerRes.json(), invoiceRes.json()]);

      const h = hData.hotels || [];
      const b = bData.bookings || [];
      const u = uData.users || [];
      const p = pData.partners || [];
      const inv = iData.invoices || [];

      setHotels(h);
      setBookings(b);
      setUsers(u);
      setPartners(p);
      setTaxInvoices(inv);

      const revenue = b.filter((bk: any) => bk.paymentStatus === 'paid').reduce((s: number, bk: any) => s + bk.totalPrice, 0);
      
      // Calculate profit based on margin of each hotel
      let profit = 0;
      b.filter((bk: any) => bk.paymentStatus === 'paid').forEach((bk: any) => {
        const hotel = h.find((htl: any) => htl._id === bk.hotelId?._id || htl._id === bk.hotelId);
        const margin = hotel?.marginPercentage || 0;
        profit += (bk.totalPrice * margin) / 100;
      });

      setStats({
        totalHotels: h.filter((x: any) => x.status === 'approved').length,
        pendingHotels: h.filter((x: any) => x.status === 'pending').length,
        pendingPartners: p.filter((x: any) => x.partnerStatus === 'pending').length,
        totalBookings: b.length,
        totalRevenue: revenue,
        totalProfit: profit,
        totalUsers: u.length,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function updateHotelStatus(id: string, updates: any) {
    setApproveLoading(id);
    await fetch(`/api/hotels/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    setApproveLoading(null);
    fetchAll();
  }

  async function toggleUserStatus(id: string, isActive: boolean) {
    await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !isActive }) });
    fetchAll();
  }

  async function handlePartnerStatus(id: string, action: string) {
    await fetch('/api/admin/partners', { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ partnerId: id, action }) 
    });
    fetchAll();
  }

  async function handleCreateInvoice(e: React.FormEvent) {
    e.preventDefault();
    setApproveLoading('invoice');

    const total = Number(newInvoiceData.totalAmount) || 0;
    const nights = Number(newInvoiceData.noOfNights) || 1;
    const rooms = Number(newInvoiceData.noOfRooms) || 1;
    const guests = Number(newInvoiceData.noOfGuests) || 1;

    // Step 1: Determine GST slab based on per-room-per-night tariff (amount is inclusive of GST)
    // First, assume 0% to get an initial per-room-night estimate
    let gstPercentage = 0;
    let perRoomNightInclusive = total / (nights * rooms);
    
    // Determine slab from inclusive rate
    if (perRoomNightInclusive >= 7500) {
      gstPercentage = 18;
    } else if (perRoomNightInclusive >= 1000) {
      gstPercentage = 5;
    } else {
      gstPercentage = 0;
    }

    // Step 2: Back-calculate base from inclusive amount
    const baseAmount = total / (1 + gstPercentage / 100);
    const gstAmount = total - baseAmount;
    const grandTotal = total; // Amount entered IS the grand total (inclusive)
    const tariffPerNight = baseAmount / (nights * rooms);

    await fetch('/api/admin/tax-invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        ...newInvoiceData, 
        totalAmount: baseAmount, 
        tariffPerNight, 
        gstPercentage, 
        gstAmount, 
        grandTotal,
        noOfRooms: rooms,
        noOfGuests: guests,
      })
    });
    setShowCreateInvoice(false);
    setNewInvoiceData({ 
      guestName: '', companyName: '', gstNumber: '', address: '', bookingId: `NH${Math.floor(10000000000000 + Math.random() * 90000000000000)}`, placeOfSupply: 'Telangana',
      checkInDate: '', checkOutDate: '', noOfNights: '', noOfRooms: '1', noOfGuests: '1', totalAmount: '', 
      invoiceNo: `INV-${Math.floor(100000 + Math.random() * 900000)}`, 
      invoiceDate: getLocalDateString() 
    });
    setApproveLoading(null);
    fetchAll();
  }

  if (status === 'loading' || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 48, height: 48 }} />
    </div>
  );

  const pendingHotels = hotels.filter(h => h.status === 'pending');
  const approvedHotels = hotels.filter(h => h.status === 'approved');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(20deg); }
          75% { transform: rotate(-20deg); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}} />
      {/* Sidebar Overlay for Mobile */}
      <div 
        className="admin-overlay" 
        style={{ display: isMobileMenuOpen ? 'block' : 'none' }}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      {/* Sidebar */}
      <aside className={`sidebar admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ position: 'sticky', top: 0, height: '100vh', flexShrink: 0, width: 280, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>👑</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a' }}>StayBuddy</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>Admin Portal</div>
          </div>
        </div>
        <nav style={{ padding: '20px 12px', flex: 1 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, paddingLeft: 12 }}>Management</div>
          {NAV.map(item => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 8, background: activeTab === item.id ? '#eff6ff' : 'transparent', color: activeTab === item.id ? '#2563eb' : '#475569', fontWeight: activeTab === item.id ? 700 : 500, border: 'none', cursor: 'pointer', transition: 'all 0.2s', marginBottom: 4 }}>
              <span style={{ 
                fontSize: '1.2rem', 
                opacity: activeTab === item.id ? 1 : 0.7,
                display: 'inline-block',
                transformOrigin: 'top center',
                animation: item.id === 'bookings' && hasNewBookings ? 'shake 0.4s infinite ease-in-out' : 'none'
              }}>
                {item.icon}
              </span> 
              <span>{item.label}</span>
              {item.id === 'bookings' && hasNewBookings && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', marginLeft: 'auto', animation: 'blink 1s infinite' }} />
              )}
              {item.id === 'requests' && stats.pendingHotels > 0 && (
                <span style={{ marginLeft: 'auto', background: '#f97316', color: 'white', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', animation: 'blink 1.5s infinite' }}>{stats.pendingHotels}</span>
              )}
              {item.id === 'partner_approvals' && stats.pendingPartners > 0 && (
                <span style={{ marginLeft: 'auto', background: '#f97316', color: 'white', borderRadius: 10, fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', animation: 'blink 1.5s infinite' }}>{stats.pendingPartners}</span>
              )}
            </button>
          ))}
          
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 32, marginBottom: 12, paddingLeft: 12 }}>External Links</div>
          <Link href="/partner" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 8, color: '#475569', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>🏢</span> Partner Extranet
          </Link>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 8, color: '#475569', fontWeight: 500, textDecoration: 'none', transition: 'all 0.2s' }}>
            <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>🌐</span> View Live Site
          </Link>
        </nav>
        <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{session?.user?.name}</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{session?.user?.email}</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main" style={{ flex: 1, overflow: 'auto', padding: '40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <button className="admin-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
            ☰ Menu
          </button>

          {/* ===== OVERVIEW ===== */}
          {activeTab === 'overview' && (
            <div className="fade-in">
              <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>Dashboard Overview</h1>
              <p style={{ color: '#64748b', marginBottom: 32 }}>Welcome back! Here&apos;s what&apos;s happening across StayBuddy today.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 40 }}>
                {[
                  { label: 'Total Revenue (GMV)', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'StayBuddy Profit', value: `₹${stats.totalProfit.toLocaleString()}`, icon: '📈', color: '#10b981', bg: '#ecfdf5' },
                  { label: 'Active Properties', value: stats.totalHotels, icon: '🏨', color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Total Bookings', value: stats.totalBookings, icon: '📋', color: '#8b5cf6', bg: '#f5f3ff' },
                ].map(s => (
                  <div key={s.label} style={{ background: 'white', padding: 24, borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {pendingHotels.length > 0 && (
                <div onClick={() => setActiveTab('hotels')} style={{ background: '#fff7ed', border: '1px solid #fdba74', padding: '16px 24px', borderRadius: 12, color: '#c2410c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 40, boxShadow: '0 4px 12px rgba(249, 115, 22, 0.1)' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚠️</span> Action Required: {pendingHotels.length} properties are waiting for approval. Review now →
                </div>
              )}

              {/* Bookings by Hotel */}
              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.2rem', color: '#0f172a', fontWeight: 700 }}>Top Performing Properties</h3>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('performance')} style={{ fontSize: '0.85rem' }}>View All Analytics →</button>
                </div>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                      <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Property Name</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>City</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Rooms</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>SB Allocation</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Bookings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const bookingsByHotel = approvedHotels.map(h => {
                        const count = bookings.filter(b => (b.hotelId?._id === h._id || b.hotelId === h._id) && b.paymentStatus === 'paid').length;
                        return { hotel: h, count };
                      }).sort((a, b) => b.count - a.count).slice(0, 5);

                      if (bookingsByHotel.length === 0) {
                        return <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No bookings yet</td></tr>;
                      }

                      return bookingsByHotel.map(({ hotel, count }) => (
                        <tr key={hotel._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px 24px', fontWeight: 600, color: '#0f172a' }}>{hotel.name}</td>
                          <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '0.9rem' }}>{hotel.city}</td>
                          <td style={{ padding: '16px 24px', color: '#0f172a', fontWeight: 600 }}>{hotel.totalRooms || 0}</td>
                          <td style={{ padding: '16px 24px', color: '#059669', fontWeight: 600 }}>{hotel.staybuddyAllocation || 0}</td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: '#2563eb', padding: '4px 12px', borderRadius: 20, fontWeight: 700, fontSize: '0.9rem' }}>
                              {count}
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== LIVE BOOKINGS ===== */}
          {activeTab === 'bookings' && (
            <div className="fade-in">
              <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>Live Bookings</h1>
              <p style={{ color: '#64748b', marginBottom: 32 }}>View and manage all real-time bookings across your platform.</p>

              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Guest</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Property</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Dates</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No live bookings found</td></tr>
                    ) : (
                      [...bookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).reverse().map(b => (
                        <tr key={b._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.guestName}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.guestPhone}</div>
                            <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, marginTop: 4 }}>ID: {b.bookingId || b._id.slice(-8)}</div>
                          </td>
                          <td style={{ padding: '16px 24px', color: '#475569', fontWeight: 500 }}>
                            <div>{b.hotelId?.name || 'Unknown Property'}</div>
                            <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600, marginTop: 4 }}>ID: {b.hotelId?.hotelId || b.hotelId?._id?.slice(-8)}</div>
                          </td>
                          <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#475569' }}>
                            <div style={{ fontWeight: 600 }}>{new Date(b.checkIn).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – {new Date(b.checkOut).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                          </td>
                          <td style={{ padding: '16px 24px', fontWeight: 800, color: '#059669' }}>
                            ₹{b.totalPrice?.toLocaleString()}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <span style={{ 
                              padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                              background: b.status === 'confirmed' ? '#d1fae5' : b.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                              color: b.status === 'confirmed' ? '#059669' : b.status === 'cancelled' ? '#dc2626' : '#d97706'
                            }}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== PARTNER REQUESTS (PROPERTIES) ===== */}
          {activeTab === 'requests' && (
            <div className="fade-in">
              <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>Property Requests</h1>
              <p style={{ color: '#64748b', marginBottom: 32 }}>Review, edit, and approve properties submitted by partners via the Extranet.</p>
              
              {pendingHotels.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', background: 'white', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 16 }}>✅</div>
                  <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>All caught up!</h3>
                  <p style={{ color: '#64748b' }}>No pending partner requests at the moment.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                  {pendingHotels.map(hotel => (
                    <div key={hotel._id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ height: 140, background: '#f1f5f9', backgroundImage: `url(${hotel.images?.[0] || 'https://via.placeholder.com/400x200'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <div style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{hotel.name}</h4>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 12 }}>NEW</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 16 }}>{hotel.city}, {hotel.country} • Partner: {hotel.partnerId?.name || 'Unknown'}</div>
                        <button onClick={() => setEditingHotel(hotel)} style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
                          📝 Review & Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== PARTNER APPROVALS ===== */}
          {activeTab === 'partner_approvals' && (
            <div className="fade-in">
              <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>Partner Approvals</h1>
              <p style={{ color: '#64748b', marginBottom: 32 }}>Review and approve new partners who signed up via Google.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {partners.filter((p: any) => p.partnerStatus === 'pending').length === 0 ? (
                  <div style={{ padding: '60px', gridColumn: '1 / -1', textAlign: 'center', background: 'white', borderRadius: 16, border: '1px dashed #cbd5e1' }}>
                    <div style={{ fontSize: '2rem', marginBottom: 16 }}>✅</div>
                    <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>All caught up!</h3>
                    <p style={{ color: '#64748b' }}>No pending partner account requests at the moment.</p>
                  </div>
                ) : (
                  partners.filter((p: any) => p.partnerStatus === 'pending').map((p: any) => (
                    <div key={p._id} style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                           {p.avatar ? <img src={p.avatar} alt="avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : '👤'}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: '#0f172a' }}>{p.name}</h3>
                          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{p.email}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => handlePartnerStatus(p._id, 'approve')} style={{ flex: 1, padding: '10px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Approve</button>
                        <button onClick={() => handlePartnerStatus(p._id, 'reject')} style={{ flex: 1, padding: '10px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Reject</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ===== HOTELS & MARGINS ===== */}
          {activeTab === 'hotels' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>Properties & Margins</h1>
                  <p style={{ color: '#64748b' }}>Manage extranet listings, set commission margins, and approve new properties.</p>
                </div>
                <Link href="/partner" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                  + Add Extranet Property
                </Link>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h3 style={{ fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}><span>✅</span> Active Properties ({approvedHotels.length})</h3>
              </div>
              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Property</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Margin (%)</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedHotels.map(h => (
                      <tr key={h._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '16px 24px', cursor: 'pointer' }} onClick={() => setExtranetModal(h)}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{h.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{h.city}</div>
                          <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600, marginTop: 4 }}>ID: {h.hotelId || h._id?.slice(-8)}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ padding: '4px 8px', background: h.isExtranet ? '#ede9fe' : '#e0f2fe', color: h.isExtranet ? '#7c3aed' : '#0284c7', borderRadius: 4, fontSize: '0.8rem', fontWeight: 600 }}>
                            {h.isExtranet ? 'Extranet' : 'B2B Partner'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <input 
                            type="number" 
                            defaultValue={h.marginPercentage || 0} 
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (val !== h.marginPercentage) updateHotelStatus(h._id, { marginPercentage: val });
                            }}
                            style={{ width: 80, padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600, color: '#0f172a' }}
                          /> %
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <button 
                            onClick={() => updateHotelStatus(h._id, { isExtranet: !h.isExtranet })}
                            style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                          >
                            Toggle Type
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== PERFORMANCE & INVOICES ===== */}
          {activeTab === 'performance' && (
            <div className="fade-in">
              <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>Performance & Tax Invoices</h1>
              <p style={{ color: '#64748b', marginBottom: 32 }}>Track property-level GMV, generated StayBuddy profits, and download tax invoices.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 24 }}>
                {approvedHotels.map(h => {
                  const propertyBookings = bookings.filter(b => (b.hotelId?._id === h._id || b.hotelId === h._id) && b.paymentStatus === 'paid');
                  const propertyGmv = propertyBookings.reduce((s, b) => s + b.totalPrice, 0);
                  const basePrice = propertyGmv / 1.12;
                  const margin = h.marginPercentage || 0;
                  const propertyProfit = (basePrice * margin) / 100;
                  const b2bPrice = basePrice - propertyProfit;

                  return (
                    <div key={h._id} style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <div>
                          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>{h.name}</h3>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>Margin: {margin}% • {propertyBookings.length} Bookings</div>
                        </div>
                        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', border: '1px solid #e2e8f0' }}>🧾</div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>B2C Price (Guest Paid)</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>₹{Math.round(propertyGmv).toLocaleString()}</div>
                        </div>
                        <div style={{ background: '#eff6ff', padding: '16px', borderRadius: 12, border: '1px solid #bfdbfe' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>B2B Price (Payout)</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1d4ed8' }}>₹{Math.round(b2bPrice).toLocaleString()}</div>
                        </div>
                      </div>

                      <button style={{ width: '100%', padding: '10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1e293b'} onMouseLeave={e => e.currentTarget.style.background = '#0f172a'} onClick={() => setSelectedInvoiceHotel(h)}>
                        📄 Generate Tax Invoice
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== USERS ===== */}
          {activeTab === 'users' && (
            <div className="fade-in">
              <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>User Analytics</h1>
              <p style={{ color: '#64748b', marginBottom: 32 }}>Manage registered customers and partners.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
                {users.map(u => {
                  const userBookings = bookings.filter(b => b.guestEmail === u.email || b.guestPhone === u.phone);
                  return (
                    <div key={u._id} style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: u.isActive ? '#10b981' : '#ef4444' }} />
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 20 }}>
                        <div style={{ position: 'relative', width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #f8fafc, #e2e8f0)', border: '2px solid white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, color: '#64748b', overflow: 'hidden' }}>
                          {u.avatar ? <Image src={u.avatar} alt="avatar" fill style={{ objectFit: 'cover' }} sizes="56px" /> : u.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{u.name}</h3>
                          <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {u.googleId ? '🔵 Google Auth' : '📱 Phone Auth'} 
                          </div>
                        </div>
                        <div style={{ marginLeft: 'auto' }}>
                          <span style={{ padding: '4px 10px', background: u.role === 'admin' ? '#fef3c7' : u.role === 'partner' ? '#e0f2fe' : '#f1f5f9', color: u.role === 'admin' ? '#d97706' : u.role === 'partner' ? '#0284c7' : '#475569', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{u.role}</span>
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 8 }}><strong>Email:</strong> {u.email || 'Not provided'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#475569' }}><strong>Phone:</strong> {u.phone || 'Not provided'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: 8 }}><strong>Bookings Made:</strong> {userBookings.length}</div>
                      </div>

                      <button 
                        onClick={() => toggleUserStatus(u._id, u.isActive)}
                        style={{ width: '100%', padding: '10px', background: u.isActive ? 'white' : '#fee2e2', border: `1px solid ${u.isActive ? '#e2e8f0' : '#fca5a5'}`, color: u.isActive ? '#ef4444' : '#b91c1c', borderRadius: 8, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                      >
                        {u.isActive ? 'Suspend Account' : 'Reactivate Account'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== TAX INVOICES ===== */}
          {activeTab === 'tax_invoices' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                  <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>Tax Invoices / Extra Bills</h1>
                  <p style={{ color: '#64748b' }}>Generate and manage standalone tax invoices and extra bills for customers.</p>
                </div>
                <button onClick={() => setShowCreateInvoice(true)} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                  + Generate New Invoice
                </button>
              </div>

              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Inv No & Date</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Guest & Company</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Stay Details</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxInvoices.length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No tax invoices found.</td></tr>
                    ) : (
                      taxInvoices.map(inv => (
                        <tr key={inv._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{inv.invoiceNo || '-'}</div>
                            <div style={{ color: '#475569', fontSize: '0.85rem' }}>{inv.invoiceDate || inv.date}</div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>{inv.guestName || inv.customerName}</div>
                            {inv.companyName && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>{inv.companyName}</div>}
                            {inv.gstNumber && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>GST: {inv.gstNumber}</div>}
                          </td>
                          <td style={{ padding: '16px 24px', color: '#475569', fontSize: '0.85rem' }}>
                            {inv.checkInDate && inv.checkOutDate ? `${inv.checkInDate} to ${inv.checkOutDate}` : inv.description}
                            {inv.noOfNights && <div style={{ marginTop: 4, fontWeight: 600 }}>{inv.noOfNights} Nights @ ₹{inv.tariffPerNight?.toFixed(2)}/nt</div>}
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Base: ₹{(inv.totalAmount || inv.amount)?.toLocaleString()}</div>
                            {inv.gstPercentage !== undefined && (
                              <div style={{ color: '#f59e0b', fontSize: '0.8rem' }}>GST ({inv.gstPercentage}%): ₹{inv.gstAmount?.toLocaleString()}</div>
                            )}
                            <div style={{ fontWeight: 800, color: '#059669', marginTop: 4 }}>Total: ₹{(inv.grandTotal || inv.totalAmount || inv.amount)?.toLocaleString()}</div>
                          </td>
                          <td style={{ padding: '16px 24px' }}>
                            <button onClick={() => {
                              window.open('/tax-invoice/' + inv._id, '_blank');
                            }} style={{ padding: '6px 12px', background: '#eff6ff', color: '#2563eb', border: 'none', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>View Bill (PDF)</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ===== CREATE TAX INVOICE MODAL ===== */}
      {showCreateInvoice && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}>
          <div className="admin-modal-box" style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 700, padding: 32, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Generate Tax Invoice</h2>
            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Invoice No.</label>
                  <input required type="text" value={newInvoiceData.invoiceNo} onChange={e => setNewInvoiceData({...newInvoiceData, invoiceNo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Invoice Date</label>
                  <input required type="date" value={newInvoiceData.invoiceDate} onChange={e => setNewInvoiceData({...newInvoiceData, invoiceDate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>
              
              <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Guest Name</label>
                  <input required type="text" value={newInvoiceData.guestName} onChange={e => setNewInvoiceData({...newInvoiceData, guestName: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Company Name (Optional)</label>
                  <input type="text" value={newInvoiceData.companyName} onChange={e => setNewInvoiceData({...newInvoiceData, companyName: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>

              <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>GST Number (Optional)</label>
                  <input type="text" value={newInvoiceData.gstNumber} onChange={e => setNewInvoiceData({...newInvoiceData, gstNumber: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Address</label>
                  <input type="text" value={newInvoiceData.address} onChange={e => setNewInvoiceData({...newInvoiceData, address: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>

              <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Booking ID (Optional)</label>
                  <input type="text" value={newInvoiceData.bookingId} onChange={e => setNewInvoiceData({...newInvoiceData, bookingId: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Place of Supply (State)</label>
                  <input type="text" value={newInvoiceData.placeOfSupply} onChange={e => setNewInvoiceData({...newInvoiceData, placeOfSupply: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>


              <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Check-In</label>
                  <input required type="date" value={newInvoiceData.checkInDate} onChange={e => setNewInvoiceData({...newInvoiceData, checkInDate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Check-Out</label>
                  <input required type="date" value={newInvoiceData.checkOutDate} onChange={e => setNewInvoiceData({...newInvoiceData, checkOutDate: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Nights</label>
                  <input required type="number" min="1" value={newInvoiceData.noOfNights} onChange={e => setNewInvoiceData({...newInvoiceData, noOfNights: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Rooms</label>
                  <input required type="number" min="1" value={newInvoiceData.noOfRooms} onChange={e => setNewInvoiceData({...newInvoiceData, noOfRooms: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Guests/Rm</label>
                  <input required type="number" min="1" value={newInvoiceData.noOfGuests} onChange={e => setNewInvoiceData({...newInvoiceData, noOfGuests: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 8 }}>Total Amount (₹) Inclusive of GST</label>
                <input required type="number" value={newInvoiceData.totalAmount} onChange={e => setNewInvoiceData({...newInvoiceData, totalAmount: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 8, lineHeight: '1.6', background: '#f8fafc', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  {(() => {
                    const amt = Number(newInvoiceData.totalAmount) || 0;
                    const n = Number(newInvoiceData.noOfNights) || 1;
                    const r = Number(newInvoiceData.noOfRooms) || 1;
                    const perRoomNight = amt / (n * r);
                    let gst = 0;
                    if (perRoomNight >= 7500) gst = 18;
                    else if (perRoomNight >= 1000) gst = 5;
                    const base = amt / (1 + gst / 100);
                    const gstAmt = amt - base;
                    const basePerRoomNight = base / (n * r);
                    return (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Per Room/Night (inclusive):</span>
                          <strong>₹{perRoomNight.toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>GST Slab:</span>
                          <strong style={{ color: gst > 0 ? '#ea580c' : '#16a34a' }}>{gst}%</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Base (excl. GST):</span>
                          <strong>₹{base.toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>GST Amount:</span>
                          <strong>₹{gstAmt.toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Tariff/Room/Night (excl. GST):</span>
                          <strong>₹{basePerRoomNight.toFixed(2)}</strong>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setShowCreateInvoice(false)} style={{ flex: 1, padding: '12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={approveLoading === 'invoice'} style={{ flex: 1, padding: '12px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: approveLoading === 'invoice' ? 0.7 : 1 }}>
                  {approveLoading === 'invoice' ? 'Saving...' : 'Save Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== INVOICE MODAL ===== */}
      {selectedInvoiceHotel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px', overflowY: 'auto' }} onClick={() => setSelectedInvoiceHotel(null)}>
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * { visibility: hidden; }
              #printable-invoice, #printable-invoice * { visibility: visible; }
              #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; margin: 0 !important; padding: 20px !important; }
              .no-print { display: none !important; }
            }
          `}} />
          <div id="printable-invoice" className="invoice-container" style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 900, padding: 40, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button className="no-print" onClick={() => setSelectedInvoiceHotel(null)} style={{ position: 'absolute', top: 20, right: 20, background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            
            {/* Invoice Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: 24, marginBottom: 32 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>SB</div>
                  <h1 style={{ fontSize: '1.8rem', color: '#0f172a', fontWeight: 900 }}>StayBuddy Tech Ltd.</h1>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  123 Tech Park, Innovation Hub<br />
                  Bangalore, Karnataka 560001<br />
                  <strong>Company GSTIN:</strong> 29AAXCS1234A1Z5
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h2 style={{ fontSize: '2rem', color: '#cbd5e1', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tax Invoice</h2>
                <div style={{ color: '#0f172a', fontWeight: 700, fontSize: '1.1rem', marginTop: 12 }}>Invoice #SB-{Math.floor(Math.random() * 1000000)}</div>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Date: {new Date().toLocaleDateString('en-IN')}</div>
              </div>
            </div>

            {/* Client Info */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
              <div style={{ flex: 1, paddingRight: 20 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Billed To (Property)</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>{selectedInvoiceHotel.name}</h3>
                <div style={{ color: '#475569', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  {selectedInvoiceHotel.address}, {selectedInvoiceHotel.city}<br />
                  {selectedInvoiceHotel.country}<br />
                  <strong>Client GSTIN:</strong> 29{selectedInvoiceHotel.name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase()}9876C1Z2
                </div>
              </div>
              <div style={{ flex: 1, background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Billing Period:</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>All Time</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Commission Rate:</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>{selectedInvoiceHotel.marginPercentage || 0}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b', fontWeight: 600 }}>Payment Terms:</span>
                  <span style={{ color: '#0f172a', fontWeight: 700 }}>Net 15</span>
                </div>
              </div>
            </div>

            {/* Bookings Table */}
            <div style={{ marginBottom: 40, overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#0f172a', color: 'white' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Guest</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Check-In / Out</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total GMV</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base Price</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const hBookings = bookings.filter(b => (b.hotelId?._id === selectedInvoiceHotel._id || b.hotelId === selectedInvoiceHotel._id) && b.paymentStatus === 'paid');
                    if (hBookings.length === 0) return <tr><td colSpan={5} style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>No completed bookings to invoice.</td></tr>;
                    
                    return hBookings.map(b => {
                      const gmv = b.totalPrice || 0;
                      const base = gmv / 1.12;
                      const comm = (base * (selectedInvoiceHotel.marginPercentage || 0)) / 100;
                      return (
                        <tr key={b._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '16px', color: '#0f172a', fontWeight: 600 }}>{b.guestName}</td>
                          <td style={{ padding: '16px', color: '#475569', fontSize: '0.9rem' }}>{new Date(b.checkIn).toLocaleDateString('en-IN', {day:'numeric', month:'short'})} - {new Date(b.checkOut).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</td>
                          <td style={{ padding: '16px', textAlign: 'right', color: '#0f172a' }}>₹{Math.round(gmv).toLocaleString()}</td>
                          <td style={{ padding: '16px', textAlign: 'right', color: '#0f172a' }}>₹{Math.round(base).toLocaleString()}</td>
                          <td style={{ padding: '16px', textAlign: 'right', color: '#0f172a', fontWeight: 700 }}>₹{Math.round(comm).toLocaleString()}</td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            {(() => {
              const hBookings = bookings.filter(b => (b.hotelId?._id === selectedInvoiceHotel._id || b.hotelId === selectedInvoiceHotel._id) && b.paymentStatus === 'paid');
              const totalGmv = hBookings.reduce((s, b) => s + b.totalPrice, 0);
              const totalBase = totalGmv / 1.12;
              const totalCommBase = (totalBase * (selectedInvoiceHotel.marginPercentage || 0)) / 100;
              const cgst = totalCommBase * 0.09;
              const sgst = totalCommBase * 0.09;
              const finalInvoiceValue = totalCommBase + cgst + sgst;

              return (
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '2px solid #e2e8f0', paddingTop: 24 }}>
                  <div style={{ width: 320 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#475569' }}>
                      <span>Subtotal (Commission Base):</span>
                      <span style={{ fontWeight: 600 }}>₹{Math.round(totalCommBase).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#475569' }}>
                      <span>CGST (9%):</span>
                      <span>₹{Math.round(cgst).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, color: '#475569' }}>
                      <span>SGST (9%):</span>
                      <span>₹{Math.round(sgst).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0', color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>
                      <span>Total Invoice Value:</span>
                      <span>₹{Math.round(finalInvoiceValue).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="no-print" style={{ marginTop: 40, textAlign: 'center' }}>
              <button onClick={() => window.print()} style={{ background: '#2563eb', color: 'white', border: 'none', padding: '12px 32px', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
                🖨️ Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDITING HOTEL MODAL ===== */}
      {editingHotel && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={() => setEditingHotel(null)}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: 32, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditingHotel(null)} style={{ position: 'absolute', top: 20, right: 20, background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>✕</button>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: 24, fontWeight: 800 }}>Review & Edit Property</h2>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const updates = {
                name: fd.get('name'),
                description: fd.get('description'),
                city: fd.get('city'),
                address: fd.get('address'),
                basePrice: parseFloat(fd.get('basePrice') as string),
                marginPercentage: parseFloat(fd.get('marginPercentage') as string),
                isExtranet: true,
                status: 'approved'
              };
              setApproveLoading(editingHotel._id);
              await updateHotelStatus(editingHotel._id, updates);
              setEditingHotel(null);
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Property Name</label>
                  <input name="name" defaultValue={editingHotel.name} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>City</label>
                  <input name="city" defaultValue={editingHotel.city} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Full Address</label>
                <input name="address" defaultValue={editingHotel.address} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Description</label>
                <textarea name="description" defaultValue={editingHotel.description} required rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32, background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Base Price (₹) / night</label>
                  <input name="basePrice" type="number" defaultValue={editingHotel.basePrice || 0} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>StayBuddy Margin (%)</label>
                  <input name="marginPercentage" type="number" defaultValue={editingHotel.marginPercentage || 15} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 600, color: '#10b981' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" disabled={approveLoading === editingHotel._id} style={{ flex: 1, padding: '14px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                  {approveLoading === editingHotel._id ? 'Approving...' : '✓ Save & Approve'}
                </button>
                <button type="button" onClick={() => { const r = prompt('Rejection reason:'); if (r) { updateHotelStatus(editingHotel._id, { status: 'rejected', rejectionReason: r }); setEditingHotel(null); } }} disabled={approveLoading === editingHotel._id} style={{ flex: 1, padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}>
                  ✕ Reject Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Extranet Edit Modal */}
      {extranetModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }} onClick={() => setExtranetModal(null)} />
          <div style={{ position: 'relative', background: '#f8fafc', width: '90%', maxWidth: 1000, margin: 'auto', maxHeight: '90vh', borderRadius: 24, display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            <div style={{ padding: '24px 32px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>Extranet Manager: {extranetModal.name}</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>Review and correct property details provided by partner</p>
              </div>
              <button onClick={() => setExtranetModal(null)} style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>✕</button>
            </div>
            
            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                updateHotelStatus(extranetModal._id, extranetModal);
                setExtranetModal(null);
                alert('Property updated successfully!');
              }} style={{ display: 'flex', flexDirection: 'column', gap: 32, paddingBottom: 80 }}>
                
                {/* Basic Info */}
                <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: '#0f172a' }}>Basic Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Property Name</label>
                      <input type="text" value={extranetModal.name} onChange={e => setExtranetModal({...extranetModal, name: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Property Type</label>
                      <input type="text" value={extranetModal.propertyType || 'Hotel'} onChange={e => setExtranetModal({...extranetModal, propertyType: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Description</label>
                      <textarea value={extranetModal.description} onChange={e => setExtranetModal({...extranetModal, description: e.target.value})} rows={3} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: '#0f172a' }}>Location Details</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>City</label>
                      <input type="text" value={extranetModal.city || ''} onChange={e => setExtranetModal({...extranetModal, city: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Address</label>
                      <input type="text" value={extranetModal.address || ''} onChange={e => setExtranetModal({...extranetModal, address: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Location Display (Search String)</label>
                      <input type="text" value={extranetModal.location || ''} onChange={e => setExtranetModal({...extranetModal, location: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                </div>

                {/* Photos */}
                <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: '#0f172a' }}>Property Photos</h3>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
                    {(extranetModal.images || []).map((img: string, i: number) => (
                      <div key={i} style={{ position: 'relative', width: 120, height: 120 }}>
                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                        <button type="button" onClick={() => setExtranetModal({...extranetModal, images: extranetModal.images.filter((_: any, idx: number) => idx !== i)})} style={{ position: 'absolute', top: 4, right: 4, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer' }}>×</button>
                      </div>
                    ))}
                  </div>
                  <input type="text" placeholder="Paste image URL and press Enter to Add" onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = e.currentTarget.value;
                      if (val) {
                        setExtranetModal({...extranetModal, images: [...(extranetModal.images || []), val]});
                        e.currentTarget.value = '';
                      }
                    }
                  }} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                </div>

                {/* Amenities */}
                <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: '#0f172a' }}>Amenities</h3>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['Free WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Parking', 'Bar', 'Pet Friendly', 'AC'].map(am => {
                      const has = (extranetModal.amenities || []).includes(am);
                      return (
                        <div key={am} onClick={() => {
                          const newAm = has ? extranetModal.amenities.filter((a: string) => a !== am) : [...(extranetModal.amenities || []), am];
                          setExtranetModal({...extranetModal, amenities: newAm});
                        }} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${has ? '#2563eb' : '#cbd5e1'}`, background: has ? '#eff6ff' : 'white', color: has ? '#2563eb' : '#64748b', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                          {am}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Additional Settings */}
                <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: 16, color: '#0f172a' }}>Additional Settings & Contact Info</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Star Rating</label>
                      <input type="number" min="1" max="5" value={extranetModal.starRating || 3} onChange={e => setExtranetModal({...extranetModal, starRating: Number(e.target.value)})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Total Property Rooms</label>
                      <input type="number" value={extranetModal.totalPropertyRooms || 10} onChange={e => setExtranetModal({...extranetModal, totalPropertyRooms: Number(e.target.value)})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Contact Name</label>
                      <input type="text" value={extranetModal.contactName || ''} onChange={e => setExtranetModal({...extranetModal, contactName: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: 6 }}>Contact Phone</label>
                      <input type="text" value={extranetModal.contactPhone || ''} onChange={e => setExtranetModal({...extranetModal, contactPhone: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1' }} />
                    </div>
                  </div>
                </div>

                {/* Rooms Management */}
                <div style={{ background: 'white', padding: 24, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 style={{ fontSize: '1.1rem', color: '#0f172a', margin: 0 }}>Rooms Management</h3>
                    <button type="button" onClick={() => {
                      const newRoom = { id: Date.now().toString(), type: 'Standard Room', priceDouble: 1000, priceSingle: 1000, b2bPrice: 800, maxGuests: 2, totalRooms: 5, staybuddyAllocation: 5, ratePlan: 'EP' };
                      setExtranetModal({...extranetModal, rooms: [...(extranetModal.rooms || []), newRoom]});
                    }} style={{ background: 'var(--brand-100)', color: 'var(--brand-600)', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem' }}>+ Add Room</button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {(extranetModal.rooms || []).map((room: any, rIdx: number) => (
                      <div key={room.id || rIdx} style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 12, background: '#f8fafc' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <h4 style={{ margin: 0, fontSize: '1rem' }}>Room {rIdx + 1}</h4>
                          <button type="button" onClick={() => {
                            const updatedRooms = extranetModal.rooms.filter((_: any, idx: number) => idx !== rIdx);
                            setExtranetModal({...extranetModal, rooms: updatedRooms});
                          }} style={{ color: 'red', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Remove</button>
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Room Type</label>
                            <input type="text" value={room.type || ''} onChange={e => {
                              const updatedRooms = [...extranetModal.rooms];
                              updatedRooms[rIdx].type = e.target.value;
                              setExtranetModal({...extranetModal, rooms: updatedRooms});
                            }} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>B2C Price (Double)</label>
                            <input type="number" value={room.priceDouble || ''} onChange={e => {
                              const updatedRooms = [...extranetModal.rooms];
                              updatedRooms[rIdx].priceDouble = Number(e.target.value);
                              setExtranetModal({...extranetModal, rooms: updatedRooms});
                            }} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>B2B Price (Double)</label>
                            <input type="number" value={room.b2bPrice || ''} onChange={e => {
                              const updatedRooms = [...extranetModal.rooms];
                              updatedRooms[rIdx].b2bPrice = Number(e.target.value);
                              setExtranetModal({...extranetModal, rooms: updatedRooms});
                            }} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Staybuddy Allocation</label>
                            <input type="number" value={room.staybuddyAllocation || ''} onChange={e => {
                              const updatedRooms = [...extranetModal.rooms];
                              updatedRooms[rIdx].staybuddyAllocation = Number(e.target.value);
                              setExtranetModal({...extranetModal, rooms: updatedRooms});
                            }} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Rate Plan</label>
                            <select value={room.ratePlan || 'EP'} onChange={e => {
                              const updatedRooms = [...extranetModal.rooms];
                              updatedRooms[rIdx].ratePlan = e.target.value;
                              setExtranetModal({...extranetModal, rooms: updatedRooms});
                            }} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                              <option value="EP">EP (Room Only)</option>
                              <option value="CP">CP (Room + Breakfast)</option>
                              <option value="MAP">MAP (Room + 2 Meals)</option>
                              <option value="AP">AP (Room + All Meals)</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Max Guests</label>
                            <input type="number" value={room.maxGuests || 2} onChange={e => {
                              const updatedRooms = [...extranetModal.rooms];
                              updatedRooms[rIdx].maxGuests = Number(e.target.value);
                              setExtranetModal({...extranetModal, rooms: updatedRooms});
                            }} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!extranetModal.rooms || extranetModal.rooms.length === 0) && (
                      <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', margin: '20px 0' }}>No rooms added yet. Click "+ Add Room" to create one.</p>
                    )}
                  </div>
                </div>
                
                <div style={{ position: 'sticky', bottom: 0, background: '#f8fafc', padding: '16px 0', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 16 }}>
                  <button type="button" onClick={() => setExtranetModal(null)} className="btn btn-outline" style={{ background: 'white' }}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '12px 32px' }}>Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
