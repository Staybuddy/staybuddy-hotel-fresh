'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { compressImage } from '@/lib/imageUtils';
import { parseCoordinates } from '@/lib/coordinates';
import TradeShowExtractor from '@/components/admin/TradeShowExtractor';

const NAV = [
  { id: 'trade_shows', label: 'Trade Shows Extractor', icon: '🎯' },
  { id: 'overview', label: 'Dashboard', icon: '📊' },
  { id: 'bookings', label: 'Live Bookings', icon: '🛎️' },
  { id: 'referrals', label: 'Referral Bookings', icon: '🎁' },
  { id: 'partner_approvals', label: 'Partner Approvals', icon: '🧑‍💼' },
  { id: 'requests', label: 'Property Requests', icon: '📝' },
  { id: 'hotels', label: 'Properties & Margins', icon: '🏨' },
  { id: 'onboarding_team', label: 'Hotel Onboarding Team', icon: '🚀' },
  { id: 'performance', label: 'Performance & Invoices', icon: '📈' },
  { id: 'users', label: 'User Analytics', icon: '👥' },
  { id: 'agreements', label: 'Partner Agreements', icon: '📜' },
  { id: 'tax_invoices', label: 'Tax Invoices', icon: '🧾' },
];

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('trade_shows');
  const [hotels, setHotels] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [referralSearch, setReferralSearch] = useState('');
  const [extranetModal, setExtranetModal] = useState<any>(null); // Hotel data for extranet edit
  const [extranetModalTab, setExtranetModalTab] = useState<'property' | 'location' | 'amenities' | 'rooms' | 'photos' | 'policies'>('property');
  const [extranetAiLoading, setExtranetAiLoading] = useState(false);
  const [taxInvoices, setTaxInvoices] = useState<any[]>([]);
  const getLocalDateString = () => {
    const today = new Date();
    return today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  };

  const [showCreateInvoice, setShowCreateInvoice] = useState(false);
  const [newInvoiceData, setNewInvoiceData] = useState({ 
    guestName: '', companyName: '', gstNumber: '', address: '', bookingId: `SB-${Math.floor(1000000 + Math.random() * 9000000)}`, placeOfSupply: 'Telangana', hotelName: '', hotelCity: '',
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
  const [adminRecheckingId, setAdminRecheckingId] = useState<string | null>(null);
  const [bookingTab, setBookingTab] = useState<'live' | 'pending'>('live');
  const [hotelTabFilter, setHotelTabFilter] = useState<'all' | 'approved' | 'pending'>('all');

  // Hotel Onboarding Specialist Staff States
  const [onboardingStaff, setOnboardingStaff] = useState<any[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffNotes, setNewStaffNotes] = useState('');
  const [staffActionMsg, setStaffActionMsg] = useState<{ type: string; text: string }>({ type: '', text: '' });

  async function adminRecheckBookingPayment(bookingId: string) {
    setAdminRecheckingId(bookingId);
    try {
      const res = await fetch('/api/payments/recheck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId })
      });
      const data = await res.json();
      if (data.verified) {
        alert('🎉 Payment verified with Razorpay! Booking marked confirmed.');
        fetchAll(false);
      } else {
        alert(data.message || 'No captured payment found on Razorpay for this booking.');
      }
    } catch (e: any) {
      alert('Error verifying payment: ' + (e.message || e));
    } finally {
      setAdminRecheckingId(null);
    }
  }

  function getExtranetLocation() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setExtranetModal((p: any) => ({ ...p, lat, lng }));
      },
      (err) => {
        alert("Could not access location: " + err.message);
      }
    );
  }

  async function generateExtranetAIDescription() {
    if (!extranetModal) return;
    setExtranetAiLoading(true);
    try {
      const res = await fetch('/api/partner/ai-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: extranetModal.name,
          propertyType: extranetModal.propertyType,
          starRating: extranetModal.starRating,
          category: extranetModal.category,
          totalPropertyRooms: extranetModal.totalPropertyRooms,
          city: extranetModal.city,
          area: extranetModal.area,
          address: extranetModal.address,
          lat: extranetModal.lat,
          lng: extranetModal.lng
        })
      });
      const data = await res.json();
      if (data.description) {
        setExtranetModal((p: any) => ({
          ...p,
          description: data.description,
          transitHubs: data.transitHubs || p.transitHubs
        }));
      }
    } catch (e) {
      console.error('Error generating AI description:', e);
    } finally {
      setExtranetAiLoading(false);
    }
  }

  const [uploadingImage, setUploadingImage] = useState(false);

  async function handleMultipleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (urls: string[]) => void
  ) {
    const rawFiles = Array.from(e.target.files || []);
    if (!rawFiles.length) return;
    setUploadingImage(true);
    try {
      const compressedFiles = await Promise.all(rawFiles.map((f) => compressImage(f)));
      const formData = new FormData();
      compressedFiles.forEach((f) => formData.append('files', f));

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.urls && data.urls.length > 0) {
        callback(data.urls);
      } else if (data.url) {
        callback([data.url]);
      } else {
        alert(data.error || 'Failed to upload images');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload images');
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
    }
  }, []);

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
      if (role !== 'admin') { 
        if (role === 'onboarder') {
          router.push('/partner'); // Direct onboarding executives straight to Partner Extranet!
          return;
        }
        router.push('/'); 
        return; 
      }
      fetchAll();

      // Avoid rapid polling to prevent exhausting Firebase free quota
      const interval = setInterval(() => {
        fetch('/api/admin/bookings').then(r => r.json()).then(data => {
          if (data.bookings) {
            setBookings(prev => {
              const prevPaid = prev.filter(x => (x.status === 'confirmed' || x.status === 'completed') && x.paymentStatus === 'paid').length;
              const newPaid = data.bookings.filter((x: any) => (x.status === 'confirmed' || x.status === 'completed') && x.paymentStatus === 'paid').length;
              if (newPaid > prevPaid && prev.length > 0) {
                if (activeTab !== 'bookings') setHasNewBookings(true);
              }
              return data.bookings;
            });
          }
        }).catch(e => console.error(e));
      }, 60000); // 60s instead of 10s
      return () => clearInterval(interval);
    }
  }, [status]);

  async function fetchAll(showLoadingIndicator = true) {
    if (showLoadingIndicator) setLoading(true);
    try {
      const [hotelRes, bookingRes, userRes, partnerRes, invoiceRes, staffRes] = await Promise.all([
        fetch('/api/admin/hotels'),
        fetch('/api/admin/bookings'),
        fetch('/api/admin/users'),
        fetch('/api/admin/partners'),
        fetch('/api/admin/tax-invoices'),
        fetch('/api/admin/onboarding-staff'),
      ]);
      const [hData, bData, uData, pData, iData, sData] = await Promise.all([hotelRes.json(), bookingRes.json(), userRes.json(), partnerRes.json(), invoiceRes.json(), staffRes.json()]);

      const h = hData.hotels || [];
      const b = bData.bookings || [];
      const u = uData.users || [];
      const p = pData.partners || [];
      const inv = iData.invoices || [];
      const s = sData.staff || [];

      setHotels(h);
      setBookings(b);
      setUsers(u);
      setPartners(p);
      setTaxInvoices(inv);
      setOnboardingStaff(s);

      const revenue = b.filter((bk: any) => bk.paymentStatus === 'paid').reduce((s: number, bk: any) => s + bk.totalPrice, 0);
      
      // Calculate profit based on margin of each hotel (using base price)
      let profit = 0;
      b.filter((bk: any) => bk.paymentStatus === 'paid').forEach((bk: any) => {
        const hotel = h.find((htl: any) => htl._id === bk.hotelId?._id || htl._id === bk.hotelId);
        const margin = hotel?.marginPercentage || 0;
        
        const nights = bk.noOfNights || 1;
        const rooms = bk.noOfRooms || 1;
        const perRoomNightInclusive = bk.totalPrice / (nights * rooms);
        let gstPercentage = 0;
        if (perRoomNightInclusive >= 7500) {
          gstPercentage = 18;
        } else if (perRoomNightInclusive >= 1000) {
          gstPercentage = 5;
        } else {
          gstPercentage = 0;
        }
        const basePrice = bk.totalPrice / (1 + gstPercentage / 100);

        profit += (basePrice * margin) / 100;
      });

      setStats({
        totalHotels: h.filter((x: any) => x.status === 'approved').length,
        pendingHotels: h.filter((x: any) => x.status === 'pending').length,
        pendingPartners: p.filter((x: any) => x.partnerStatus === 'pending').length,
        totalBookings: b.filter((bk: any) => (bk.status === 'confirmed' || bk.status === 'completed') && bk.paymentStatus === 'paid').length,
        totalRevenue: revenue,
        totalProfit: profit,
        totalUsers: u.length,
      });
    } catch (e) { console.error(e); }
    finally { if (showLoadingIndicator) setLoading(false); }
  }

  async function updateHotelStatus(id: string, updates: any) {
    setApproveLoading(id);
    await fetch(`/api/hotels/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    setApproveLoading(null);
    fetchAll(false);
  }

  async function deleteHotel(id: string) {
    if (!confirm('Are you sure you want to permanently delete this property and all its rooms?')) return;
    setApproveLoading(id);
    try {
      const res = await fetch(`/api/hotels/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        alert('Failed to delete property');
      }
    } catch (err) {
      console.error(err);
      alert('Error deleting property');
    } finally {
      setApproveLoading(null);
      fetchAll(false);
    }
  }

  async function handleAddStaff(e: React.FormEvent) {
    e.preventDefault();
    if (!newStaffEmail || !newStaffEmail.includes('@')) {
      setStaffActionMsg({ type: 'error', text: 'Please enter a valid Gmail / Email address.' });
      return;
    }
    setStaffLoading(true);
    setStaffActionMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/onboarding-staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newStaffEmail,
          name: newStaffName,
          phone: newStaffPhone,
          notes: newStaffNotes
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setStaffActionMsg({ type: 'error', text: data.error || 'Failed to add staff member.' });
      } else {
        setStaffActionMsg({ type: 'success', text: `🎉 ${newStaffEmail} assigned to Onboarding Team! They can now access Partner Extranet and B2C site.` });
        setNewStaffEmail('');
        setNewStaffName('');
        setNewStaffPhone('');
        setNewStaffNotes('');
        const sRes = await fetch('/api/admin/onboarding-staff');
        const sData = await sRes.json();
        if (sData.staff) setOnboardingStaff(sData.staff);
      }
    } catch (err: any) {
      setStaffActionMsg({ type: 'error', text: err.message || 'Network error adding staff.' });
    } finally {
      setStaffLoading(false);
    }
  }

  async function handleDeleteStaff(id: string, email: string) {
    if (!confirm(`Are you sure you want to revoke onboarding access for ${email}? They will no longer be able to onboard properties.`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/onboarding-staff', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, email })
      });
      const data = await res.json();
      if (res.ok) {
        setOnboardingStaff(prev => prev.filter(s => s._id !== id && s.email !== email));
        setStaffActionMsg({ type: 'success', text: `Access revoked for ${email}.` });
        setTimeout(() => setStaffActionMsg({ type: '', text: '' }), 4000);
      } else {
        alert(data.error || 'Failed to remove staff.');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting staff.');
    }
  }

  async function openReviewModal(hotel: any) {
    setEditingHotel(hotel);
    try {
      const res = await fetch(`/api/hotels/${hotel._id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.hotel) {
          setEditingHotel((prev: any) => ({
            ...prev,
            ...data.hotel,
            rooms: (data.rooms && data.rooms.length > 0) ? data.rooms : (prev?.rooms || [])
          }));
        }
      }
    } catch (e) {
      console.warn('Could not fetch latest hotel rooms for review:', e);
    }
  }

  async function updateUser(id: string, updates: any) {
    await fetch(`/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    fetchAll(false);
  }

  async function handlePartnerStatus(id: string, action: string) {
    await fetch('/api/admin/partners', { 
      method: 'PATCH', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ partnerId: id, action }) 
    });
    fetchAll(false);
  }

  const calculateNightsDifference = (inStr: string, outStr: string): string => {
    if (!inStr || !outStr) return '';
    const [y1, m1, d1] = inStr.split('-').map(Number);
    const [y2, m2, d2] = outStr.split('-').map(Number);
    if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return '';
    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    const diffTime = date2.getTime() - date1.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? String(diffDays) : '1';
  };

  const handleCheckInChange = (newIn: string) => {
    setNewInvoiceData(prev => {
      let nextOut = prev.checkOutDate;
      if (newIn) {
        if (!nextOut) {
          const [y, m, d] = newIn.split('-').map(Number);
          if (y && m && d) {
            const nextDay = new Date(y, m - 1, d + 1);
            nextOut = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
          }
        } else {
          const [y1, m1, d1] = newIn.split('-').map(Number);
          const [y2, m2, d2] = nextOut.split('-').map(Number);
          if (y1 && m1 && d1 && y2 && m2 && d2) {
            const date1 = new Date(y1, m1 - 1, d1);
            const date2 = new Date(y2, m2 - 1, d2);
            if (date2 <= date1) {
              const nextDay = new Date(y1, m1 - 1, d1 + 1);
              nextOut = `${nextDay.getFullYear()}-${String(nextDay.getMonth() + 1).padStart(2, '0')}-${String(nextDay.getDate()).padStart(2, '0')}`;
            }
          }
        }
      }
      const nights = calculateNightsDifference(newIn, nextOut);
      return {
        ...prev,
        checkInDate: newIn,
        checkOutDate: nextOut,
        ...(nights ? { noOfNights: nights } : {})
      };
    });
  };

  const handleCheckOutChange = (newOut: string) => {
    setNewInvoiceData(prev => {
      const nights = calculateNightsDifference(prev.checkInDate, newOut);
      return {
        ...prev,
        checkOutDate: newOut,
        ...(nights ? { noOfNights: nights } : {})
      };
    });
  };

  const openCreateInvoiceModal = () => {
    const today = getLocalDateString();
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrow = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    setNewInvoiceData(prev => ({
      ...prev,
      invoiceDate: prev.invoiceDate || today,
      checkInDate: prev.checkInDate || today,
      checkOutDate: prev.checkOutDate || tomorrow,
      noOfNights: prev.noOfNights || '1',
      invoiceNo: prev.invoiceNo || `INV-${Math.floor(100000 + Math.random() * 900000)}`
    }));
    setShowCreateInvoice(true);
  };

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
      guestName: '', companyName: '', gstNumber: '', address: '', bookingId: `SB-${Math.floor(1000000 + Math.random() * 9000000)}`, placeOfSupply: 'Telangana', hotelName: '', hotelCity: '',
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
        <nav style={{ padding: '20px 12px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12, paddingLeft: 12 }}>Management</div>
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMobileMenuOpen(false);
                if (typeof window !== 'undefined') {
                  window.history.replaceState(null, '', `?tab=${item.id}`);
                }
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                borderRadius: 8,
                background: activeTab === item.id ? '#eff6ff' : 'transparent',
                color: activeTab === item.id ? '#2563eb' : '#475569',
                fontWeight: activeTab === item.id ? 700 : 500,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                marginBottom: 4,
              }}
            >
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 40 }}>
                {[
                  { label: 'Total Revenue (GMV)', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: '#f59e0b', bg: '#fffbeb' },
                  { label: 'StayBuddy Profit', value: `₹${stats.totalProfit.toLocaleString()}`, icon: '📈', color: '#10b981', bg: '#ecfdf5' },
                  { label: 'Active Properties', value: stats.totalHotels, icon: '🏨', color: '#3b82f6', bg: '#eff6ff' },
                  { label: 'Total Bookings', value: stats.totalBookings, icon: '📋', color: '#8b5cf6', bg: '#f5f3ff' },
                  { 
                    label: 'Referral Bookings', 
                    value: bookings.filter(b => b.isReferralBooking || b.referralCode || b.referredByUserId).length, 
                    icon: '🎁', 
                    color: '#ea580c', 
                    bg: '#fff7ed',
                    onClick: () => setActiveTab('referrals')
                  },
                ].map(s => (
                  <div 
                    key={s.label} 
                    onClick={s.onClick}
                    style={{ 
                      background: 'white', 
                      padding: 24, 
                      borderRadius: 16, 
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 20,
                      cursor: s.onClick ? 'pointer' : 'default',
                      transition: 'transform 0.15s ease'
                    }}
                  >
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>{s.icon}</div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
                      <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a' }}>{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {pendingHotels.length > 0 && (
                <div onClick={() => setActiveTab('requests')} style={{ background: '#fff7ed', border: '1px solid #fdba74', padding: '16px 24px', borderRadius: 12, color: '#c2410c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 40, boxShadow: '0 4px 12px rgba(249, 115, 22, 0.1)' }}>
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
          {activeTab === 'bookings' && (() => {
            const liveBookings = bookings.filter(b => (b.status === 'confirmed' || b.status === 'completed') && b.paymentStatus === 'paid');
            const pendingBookings = bookings.filter(b => b.status === 'pending' || b.paymentStatus === 'pending' || b.paymentStatus === 'unpaid');
            const displayBookings = bookingTab === 'live' ? liveBookings : pendingBookings;
            const sortedBookings = [...displayBookings].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            return (
              <div className="fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 6 }}>Live Bookings</h1>
                    <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                      Real-time confirmed bookings where payment is completed, verified with Razorpay, and confirmation emails sent.
                    </p>
                  </div>

                  {/* Filter Sub-Tabs */}
                  <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: '4px', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                    <button
                      onClick={() => setBookingTab('live')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        background: bookingTab === 'live' ? 'white' : 'transparent',
                        color: bookingTab === 'live' ? '#0f172a' : '#64748b',
                        boxShadow: bookingTab === 'live' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>🟢 Live & Confirmed</span>
                      <span style={{
                        background: bookingTab === 'live' ? '#d1fae5' : '#e2e8f0',
                        color: bookingTab === 'live' ? '#065f46' : '#475569',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {liveBookings.length}
                      </span>
                    </button>

                    <button
                      onClick={() => setBookingTab('pending')}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 8,
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        background: bookingTab === 'pending' ? 'white' : 'transparent',
                        color: bookingTab === 'pending' ? '#0f172a' : '#64748b',
                        boxShadow: bookingTab === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>⏳ Incomplete / Unpaid Attempts</span>
                      <span style={{
                        background: bookingTab === 'pending' ? '#fef3c7' : '#e2e8f0',
                        color: bookingTab === 'pending' ? '#92400e' : '#475569',
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {pendingBookings.length}
                      </span>
                    </button>
                  </div>
                </div>

                {bookingTab === 'pending' && (
                  <div style={{
                    marginBottom: 20,
                    padding: '14px 18px',
                    borderRadius: 10,
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    color: '#92400e',
                    fontSize: '0.85rem',
                    lineHeight: 1.5
                  }}>
                    <strong>⚠️ Incomplete Checkout Attempts:</strong> These are booking attempts where the guest did not complete payment or cancelled at checkout. If a customer paid via PhonePe / UPI and hit back, click <strong>&quot;Verify Razorpay&quot;</strong> to directly check Razorpay servers and promote it into Live Bookings.
                  </div>
                )}

                <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                  <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Guest</th>
                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Property</th>
                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Dates</th>
                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Amount</th>
                        <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status & Verification</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedBookings.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#64748b' }}>
                            {bookingTab === 'live' ? 'No live confirmed bookings found.' : 'No incomplete or pending payment attempts.'}
                          </td>
                        </tr>
                      ) : (
                        sortedBookings.map(b => (
                          <tr key={b._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.guestName}</div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{b.guestPhone}</div>
                              <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600, marginTop: 4 }}>Booking ID: {b.bookingId || b._id.slice(-8)}</div>
                              {b.isReferralBooking && (
                                <div style={{ marginTop: 4 }}>
                                  <span style={{ fontSize: '0.7rem', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '2px 8px', borderRadius: 6, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    🎁 Referral: {b.referralCode || 'Used'} ({b.referrerName || 'Member'})
                                  </span>
                                </div>
                              )}
                            </td>
                            <td style={{ padding: '16px 24px', color: '#475569', fontWeight: 500 }}>
                              <div>{b.hotelId?.name || 'Unknown Property'}</div>
                              <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600, marginTop: 4 }}>Hotel ID: {b.hotelId?.hotelId || b.hotelId?._id?.slice(-8)}</div>
                            </td>
                            <td style={{ padding: '16px 24px', fontSize: '0.85rem', color: '#475569' }}>
                              <div style={{ fontWeight: 600 }}>{new Date(b.checkIn).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} – {new Date(b.checkOut).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</div>
                            </td>
                            <td style={{ padding: '16px 24px', fontWeight: 800, color: '#059669' }}>
                              ₹{b.totalPrice?.toLocaleString()}
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
                                <span style={{ 
                                  padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                                  background: b.status === 'confirmed' ? '#d1fae5' : b.status === 'completed' ? '#dbeafe' : b.status === 'cancelled' ? '#fee2e2' : '#fef3c7',
                                  color: b.status === 'confirmed' ? '#059669' : b.status === 'completed' ? '#1d4ed8' : b.status === 'cancelled' ? '#dc2626' : '#d97706'
                                }}>
                                  {b.status} • {b.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                                </span>

                                {b.paymentStatus === 'paid' && (
                                  <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span>✅ Verified</span>
                                    <span>• ✉️ Invoices & Emails Sent</span>
                                  </div>
                                )}

                                {(b.status === 'pending' || b.paymentStatus === 'pending' || b.paymentStatus === 'unpaid') && (
                                  <button
                                    onClick={() => adminRecheckBookingPayment(b._id)}
                                    disabled={adminRecheckingId === b._id}
                                    style={{
                                      fontSize: '0.72rem',
                                      padding: '4px 10px',
                                      borderRadius: 6,
                                      border: '1px solid #3b82f6',
                                      background: '#eff6ff',
                                      color: '#1d4ed8',
                                      fontWeight: 600,
                                      cursor: adminRecheckingId === b._id ? 'not-allowed' : 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4
                                    }}
                                    title="Check Razorpay for captured payment / email confirmation"
                                  >
                                    {adminRecheckingId === b._id ? 'Checking...' : '🔄 Verify Razorpay'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ===== REFERRAL BOOKINGS TAB ===== */}
          {activeTab === 'referrals' && (() => {
            const allReferralBookings = bookings.filter(b => b.isReferralBooking || b.referralCode || b.referredByUserId);
            const filteredReferrals = allReferralBookings.filter(b => {
              if (!referralSearch.trim()) return true;
              const q = referralSearch.toLowerCase();
              return (
                (b.bookingId && b.bookingId.toLowerCase().includes(q)) ||
                (b.guestName && b.guestName.toLowerCase().includes(q)) ||
                (b.guestPhone && b.guestPhone.toLowerCase().includes(q)) ||
                (b.referralCode && b.referralCode.toLowerCase().includes(q)) ||
                (b.referrerName && b.referrerName.toLowerCase().includes(q)) ||
                (b.hotelId?.name && b.hotelId.name.toLowerCase().includes(q))
              );
            });

            const completedReferrals = allReferralBookings.filter(b => (b.status === 'confirmed' || b.status === 'completed') && b.paymentStatus === 'paid');
            const totalRewardsCredited = completedReferrals.length * 20;
            const uniqueReferrers = new Set(allReferralBookings.map(b => b.referralCode || b.referredByUserId).filter(Boolean)).size;

            return (
              <div className="fade-in">
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h1 style={{ fontSize: '2rem', color: '#0f172a', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span>🎁 Referral Bookings & Rewards</span>
                      <span style={{ fontSize: '0.8rem', background: '#fff7ed', color: '#ea580c', border: '1px solid #fed7aa', padding: '2px 10px', borderRadius: 12, fontWeight: 800 }}>
                        ₹20 Per Stay Cap (Max 5)
                      </span>
                    </h1>
                    <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
                      Track guest bookings acquired through member referral codes, unique referral IDs, and wallet payout statuses.
                    </p>
                  </div>

                  {/* Search Bar */}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Search code, guest, or referrer..."
                      value={referralSearch}
                      onChange={(e) => setReferralSearch(e.target.value)}
                      style={{
                        padding: '10px 16px',
                        border: '1.5px solid #cbd5e1',
                        borderRadius: 10,
                        fontSize: '0.88rem',
                        width: 260
                      }}
                    />
                  </div>
                </div>

                {/* Stat Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
                  <div style={{ background: 'white', padding: '20px', borderRadius: 16, border: '1px solid #fed7aa', boxShadow: '0 4px 12px rgba(234, 88, 12, 0.06)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Referral Bookings</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#ea580c', marginTop: 4 }}>{allReferralBookings.length}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>All-time bookings via referral links</div>
                  </div>

                  <div style={{ background: 'white', padding: '20px', borderRadius: 16, border: '1px solid #bbf7d0', boxShadow: '0 4px 12px rgba(22, 163, 74, 0.06)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Completed Stays (Paid)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#16a34a', marginTop: 4 }}>{completedReferrals.length}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>Guest checked-in / checkout completed</div>
                  </div>

                  <div style={{ background: 'white', padding: '20px', borderRadius: 16, border: '1px solid #bfdbfe', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.06)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Wallet Rewards Generated</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#2563eb', marginTop: 4 }}>₹{totalRewardsCredited}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>₹20 credited per completed stay</div>
                  </div>

                  <div style={{ background: 'white', padding: '20px', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.04)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Referrers</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#0f172a', marginTop: 4 }}>{uniqueReferrers}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 2 }}>Members with successful referrals</div>
                  </div>
                </div>

                {/* Referral Bookings Table */}
                <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                  <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 800, margin: 0 }}>
                      Referral Bookings Log ({filteredReferrals.length})
                    </h3>
                  </div>

                  <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Booking Details</th>
                        <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Referral ID / Code</th>
                        <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Referrer Client</th>
                        <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Referred Guest</th>
                        <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Property Booked</th>
                        <th style={{ padding: '14px 20px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Reward Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredReferrals.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: '#94a3b8' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🎁</div>
                            <div style={{ fontWeight: 700, color: '#475569', fontSize: '1rem' }}>No referral bookings recorded yet</div>
                            <div style={{ fontSize: '0.84rem', marginTop: 4 }}>When users share their referral codes and guests book, bookings will be automatically tracked here.</div>
                          </td>
                        </tr>
                      ) : (
                        filteredReferrals.map((b) => {
                          const isRewarded = (b.status === 'completed' || b.paymentStatus === 'paid');
                          return (
                            <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                                  {b.bookingId || b._id?.slice(-8)}
                                </div>
                                <div style={{ fontSize: '0.76rem', color: '#64748b', marginTop: 2 }}>
                                  {b.createdAt ? new Date(b.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#059669', fontWeight: 700, marginTop: 2 }}>
                                  ₹{b.totalPrice?.toLocaleString()}
                                </div>
                              </td>

                              <td style={{ padding: '14px 20px' }}>
                                <span style={{
                                  background: '#fff7ed',
                                  color: '#c2410c',
                                  border: '1px solid #fed7aa',
                                  padding: '4px 10px',
                                  borderRadius: 8,
                                  fontWeight: 900,
                                  fontSize: '0.84rem',
                                  letterSpacing: '0.04em'
                                }}>
                                  {b.referralCode || 'SBSTAY20'}
                                </span>
                              </td>

                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                                  {b.referrerName || 'StayBuddy Member'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                                  {b.referredByUserId ? `UID: ${b.referredByUserId.slice(-6)}` : 'Client Account'}
                                </div>
                              </td>

                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                                  {b.guestName || b.customerId?.name || 'Guest'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                                  📞 {b.guestPhone || b.customerId?.phone || 'N/A'}
                                </div>
                              </td>

                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>
                                  {b.hotelId?.name || 'Hotel'}
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>
                                  📍 {b.hotelId?.city || 'India'}
                                </div>
                              </td>

                              <td style={{ padding: '14px 20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                                  <span style={{
                                    padding: '4px 10px',
                                    borderRadius: 14,
                                    fontSize: '0.74rem',
                                    fontWeight: 800,
                                    background: isRewarded ? '#dcfce7' : '#fef3c7',
                                    color: isRewarded ? '#15803d' : '#92400e',
                                    border: isRewarded ? '1px solid #86efac' : '1px solid #fde68a'
                                  }}>
                                    {isRewarded ? '✅ ₹20 Credited to Wallet' : '⏳ Pending Stay Completion'}
                                  </span>
                                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    {b.status} • {b.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            );
          })()}

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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, width: '100%' }}>
                  {pendingHotels.map(hotel => (
                    <div key={hotel._id} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                      <div style={{ height: 140, background: '#f1f5f9', backgroundImage: `url(${hotel.images?.[0] || 'https://via.placeholder.com/400x200'})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                      <div style={{ padding: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>{hotel.name}</h4>
                          <span style={{ fontSize: '0.7rem', fontWeight: 700, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 12 }}>NEW</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 16 }}>{hotel.city}, {hotel.country} • Partner: {hotel.partnerId?.name || 'Unknown'}</div>
                        <button onClick={() => openReviewModal(hotel)} style={{ width: '100%', padding: '10px', background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'} onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}>
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
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, width: '100%' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>Properties & Margins</h1>
                  <p style={{ color: '#64748b' }}>Manage extranet listings, set commission margins, and approve new properties.</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link href="/partner" className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
                    + Add Extranet Property
                  </Link>
                </div>
              </div>

              {pendingHotels.length > 0 && (
                <div style={{ background: '#fff7ed', border: '1px solid #fdba74', padding: '16px 20px', borderRadius: 12, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1.4rem' }}>⏳</span>
                    <div>
                      <strong style={{ color: '#c2410c' }}>{pendingHotels.length} Property Request(s) Awaiting Review</strong>
                      <div style={{ fontSize: '0.85rem', color: '#9a3412' }}>Submitted via Extranet. Approve to activate and make them bookable.</div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab('requests')} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    Review Requests ({pendingHotels.length}) →
                  </button>
                </div>
              )}

              {/* Status Filter Tabs */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {[
                  { id: 'all', label: `All Properties (${hotels.length})` },
                  { id: 'approved', label: `Active (${approvedHotels.length})` },
                  { id: 'pending', label: `Pending Requests (${pendingHotels.length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setHotelTabFilter(tab.id as any)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: hotelTabFilter === tab.id ? '1px solid #2563eb' : '1px solid #cbd5e1',
                      background: hotelTabFilter === tab.id ? '#2563eb' : 'white',
                      color: hotelTabFilter === tab.id ? 'white' : '#475569',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflowX: 'auto' }}>
                <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Property</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Margin (%)</th>
                      <th style={{ padding: '16px 24px', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(hotelTabFilter === 'all' ? hotels : hotelTabFilter === 'pending' ? pendingHotels : approvedHotels).map(h => (
                      <tr key={h._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '16px 24px', cursor: 'pointer' }} onClick={() => { setExtranetModal(h); setExtranetModalTab('property'); }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{h.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{h.city}</div>
                          <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontWeight: 600, marginTop: 4 }}>Hotel ID: {h.hotelId || h._id?.slice(-8)}</div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: 12, 
                            fontSize: '0.78rem', 
                            fontWeight: 700,
                            background: h.status === 'approved' ? '#dcfce7' : h.status === 'rejected' ? '#fee2e2' : '#fef3c7',
                            color: h.status === 'approved' ? '#166534' : h.status === 'rejected' ? '#991b1b' : '#92400e'
                          }}>
                            {h.status === 'approved' ? '✅ Active' : h.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                          </span>
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
                        <td style={{ padding: '16px 24px', whiteSpace: 'nowrap' }}>
                          {h.status === 'pending' && (
                            <button 
                              onClick={() => updateHotelStatus(h._id, { status: 'approved' })}
                              disabled={approveLoading === h._id}
                              style={{ marginRight: 8, padding: '6px 12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                            >
                              {approveLoading === h._id ? 'Approving...' : '✓ Approve'}
                            </button>
                          )}
                          <button 
                            onClick={() => updateHotelStatus(h._id, { isExtranet: !h.isExtranet })}
                            style={{ padding: '6px 12px', background: 'transparent', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                          >
                            Toggle Type
                          </button>
                          <button 
                            onClick={() => deleteHotel(h._id)}
                            disabled={approveLoading === h._id}
                            style={{ marginLeft: 8, padding: '6px 12px', background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 6, fontSize: '0.85rem', fontWeight: 700, color: '#e11d48', cursor: 'pointer' }}
                          >
                            {approveLoading === h._id ? 'Deleting...' : '🗑️ Delete'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== HOTEL ONBOARDING SPECIALIST TEAM ===== */}
          {activeTab === 'onboarding_team' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span>Hotel Onboarding Team</span>
                    <span style={{ fontSize: '1rem', background: '#ffedd5', color: '#ea580c', padding: '4px 12px', borderRadius: 9999, fontWeight: 700 }}>
                      🚀 Ground & Remote Specialists
                    </span>
                  </h1>
                  <p style={{ color: '#64748b', maxWidth: 760, lineHeight: 1.5 }}>
                    Assign Gmail IDs to executives hired to onboard hotels for StayBuddy. Assigned staff get instant, seamless access to the 
                    <strong> Partner Extranet</strong> and the <strong>B2C website</strong> to onboard properties. Their accounts are strictly 
                    <strong> blocked from all Admin features</strong> and all partner communications go exclusively to the hotel partner.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ background: 'white', padding: '12px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Executives</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>{onboardingStaff.length}</div>
                  </div>
                  <div style={{ background: 'white', padding: '12px 20px', borderRadius: 12, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Total Properties Onboarded</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ea580c' }}>
                      {onboardingStaff.reduce((sum, s) => sum + (s.hotelsOnboarded || 0), 0)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Access Isolation Rule Banner */}
              <div style={{ 
                background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)', 
                border: '1px solid #bfdbfe', 
                borderRadius: 16, 
                padding: '20px 24px', 
                marginBottom: 28,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 20
              }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.5rem', background: '#dbeafe', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    🔒
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#1e3a8a', fontSize: '0.95rem', marginBottom: 2 }}>Strict Extranet & B2C Access Only</div>
                    <div style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.4 }}>
                      Assigned staff sign in via Google. They can access <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>/partner</code> and the live booking portal, but are 100% blocked from <code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>/admin</code>.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.5rem', background: '#ffedd5', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    ✉️
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#9a3412', fontSize: '0.95rem', marginBottom: 2 }}>Isolated Partner Communications</div>
                    <div style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.4 }}>
                      Partner contact details (phone, email) entered during onboarding receive agreements, credentials, and guest alerts. The onboarding staff's email receives zero partner alerts.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.5rem', background: '#dcfce7', width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    📊
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.95rem', marginBottom: 2 }}>Real-Time Staff Attribution</div>
                    <div style={{ color: '#475569', fontSize: '0.85rem', lineHeight: 1.4 }}>
                      Every property registered tracks which executive submitted it (<code style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: 4 }}>onboardedBy</code>) for commission and productivity reporting.
                    </div>
                  </div>
                </div>
              </div>

              {/* Add New Executive Form */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, marginBottom: 32, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>➕ Assign New Onboarding Specialist</h3>
                    <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Enter the Google / Gmail address of the person you hired. They will be granted instant onboarding privileges.</p>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, background: '#f1f5f9', color: '#475569', padding: '6px 14px', borderRadius: 9999 }}>
                    Slot Capacity: {onboardingStaff.length} / 4 Initial Slots Active
                  </div>
                </div>

                {staffActionMsg.text && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 10,
                    marginBottom: 20,
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    background: staffActionMsg.type === 'error' ? '#fef2f2' : '#f0fdf4',
                    color: staffActionMsg.type === 'error' ? '#991b1b' : '#166534',
                    border: `1px solid ${staffActionMsg.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
                  }}>
                    {staffActionMsg.text}
                  </div>
                )}

                <form onSubmit={handleAddStaff} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
                      Executive Gmail ID *
                    </label>
                    <input 
                      type="email"
                      required
                      placeholder="e.g. rahul.staybuddy@gmail.com"
                      value={newStaffEmail}
                      onChange={e => setNewStaffEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        color: '#0f172a'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
                      Full Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={newStaffName}
                      onChange={e => setNewStaffName(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        color: '#0f172a'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
                      Mobile / WhatsApp
                    </label>
                    <input 
                      type="tel"
                      placeholder="e.g. +91 98765 43210"
                      value={newStaffPhone}
                      onChange={e => setNewStaffPhone(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        color: '#0f172a'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6, textTransform: 'uppercase' }}>
                      Assigned Region / Territory
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Hyderabad & Secunderabad"
                      value={newStaffNotes}
                      onChange={e => setNewStaffNotes(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        outline: 'none',
                        color: '#0f172a'
                      }}
                    />
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={staffLoading}
                      style={{
                        width: '100%',
                        padding: '12px 18px',
                        background: '#ea580c',
                        color: 'white',
                        border: 'none',
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        cursor: staffLoading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 2px 4px rgba(234, 88, 12, 0.3)',
                        transition: 'background 0.2s'
                      }}
                    >
                      {staffLoading ? 'Assigning...' : '🚀 Assign Specialist'}
                    </button>
                  </div>
                </form>
              </div>

              {/* 4 Slots Visual Tracker */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>Executive Slots Status (Initial 4 Allocation)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                  {[0, 1, 2, 3].map(slotIndex => {
                    const member = onboardingStaff[slotIndex];
                    if (member) {
                      return (
                        <div key={member._id} style={{ 
                          background: 'white', 
                          border: '2px solid #fdba74', 
                          borderRadius: 14, 
                          padding: 16,
                          boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)',
                          position: 'relative'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#ffedd5', color: '#c2410c', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>
                              {slotIndex + 1}
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                {member.name || 'Executive'}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a' }}></span>
                                Active Onboarder
                              </div>
                            </div>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 6, wordBreak: 'break-all' }}>
                            ✉️ {member.email}
                          </div>
                          {member.phone && (
                            <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 6 }}>
                              📞 {member.phone}
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '3px 8px', borderRadius: 6 }}>
                              🏨 {member.hotelsOnboarded || 0} Hotels
                            </span>
                            <button
                              onClick={() => handleDeleteStaff(member._id, member.email)}
                              style={{
                                background: '#fee2e2',
                                color: '#b91c1c',
                                border: 'none',
                                borderRadius: 6,
                                padding: '4px 10px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={slotIndex} style={{ 
                          background: '#f8fafc', 
                          border: '2px dashed #cbd5e1', 
                          borderRadius: 14, 
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textAlign: 'center',
                          minHeight: 140
                        }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#e2e8f0', color: '#64748b', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', marginBottom: 8 }}>
                            {slotIndex + 1}
                          </div>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b' }}>Slot {slotIndex + 1} Available</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>Assign Gmail ID in the form above</div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              {/* Comprehensive Staff Table */}
              <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>All Assigned Onboarding Executives ({onboardingStaff.length})</h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Includes initial 4 slots and any additional team members</span>
                </div>

                {onboardingStaff.length === 0 ? (
                  <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🚀</div>
                    <h4 style={{ fontSize: '1.1rem', color: '#0f172a', marginBottom: 6 }}>No Onboarding Executives Assigned Yet</h4>
                    <p style={{ fontSize: '0.85rem', maxWidth: 450, margin: '0 auto' }}>
                      Add your first executive using the form above to grant them Extranet & B2C onboarding privileges.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                          <th style={{ padding: '14px 20px', fontWeight: 700 }}>Executive & Gmail</th>
                          <th style={{ padding: '14px 20px', fontWeight: 700 }}>Contact Phone</th>
                          <th style={{ padding: '14px 20px', fontWeight: 700 }}>Territory / Region</th>
                          <th style={{ padding: '14px 20px', fontWeight: 700 }}>Access Scope</th>
                          <th style={{ padding: '14px 20px', fontWeight: 700 }}>Properties Onboarded</th>
                          <th style={{ padding: '14px 20px', fontWeight: 700 }}>Assigned Date</th>
                          <th style={{ padding: '14px 20px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody style={{ divideY: '1px solid #f1f5f9' }}>
                        {onboardingStaff.map((staff: any) => (
                          <tr key={staff._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{staff.name || 'Onboarding Specialist'}</div>
                              <div style={{ fontSize: '0.82rem', color: '#2563eb', fontWeight: 600 }}>{staff.email}</div>
                            </td>
                            <td style={{ padding: '16px 20px', color: '#475569' }}>
                              {staff.phone || '—'}
                            </td>
                            <td style={{ padding: '16px 20px', color: '#475569' }}>
                              {staff.notes || 'General'}
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: 6, 
                                fontSize: '0.78rem', 
                                fontWeight: 700, 
                                background: '#f0fdf4', 
                                color: '#15803d', 
                                padding: '4px 10px', 
                                borderRadius: 9999,
                                border: '1px solid #bbf7d0'
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }}></span>
                                Extranet + B2C (No Admin)
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px' }}>
                              <span style={{ 
                                fontSize: '0.85rem', 
                                fontWeight: 800, 
                                color: staff.hotelsOnboarded > 0 ? '#ea580c' : '#64748b',
                                background: staff.hotelsOnboarded > 0 ? '#fff7ed' : '#f1f5f9',
                                padding: '4px 10px',
                                borderRadius: 8
                              }}>
                                🏨 {staff.hotelsOnboarded || 0} Hotels
                              </span>
                            </td>
                            <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.8rem' }}>
                              {staff.addedAt ? new Date(staff.addedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                            </td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              <button
                                onClick={() => handleDeleteStaff(staff._id, staff.email)}
                                style={{
                                  background: '#fee2e2',
                                  color: '#b91c1c',
                                  border: '1px solid #fecaca',
                                  borderRadius: 8,
                                  padding: '6px 14px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'background 0.2s'
                                }}
                              >
                                🗑️ Revoke Access
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== PERFORMANCE & INVOICES ===== */}
          {activeTab === 'performance' && (
            <div className="fade-in">
              <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>Performance & Tax Invoices</h1>
              <p style={{ color: '#64748b', marginBottom: 32 }}>Track property-level GMV, generated StayBuddy profits, and download tax invoices.</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, width: '100%' }}>
                {approvedHotels.map(h => {
                  const propertyBookings = bookings.filter(b => (b.hotelId?._id === h._id || b.hotelId === h._id) && b.paymentStatus === 'paid');
                  let propertyGmv = 0;
                  let totalBasePrice = 0;
                  let totalGstAmount = 0;

                  propertyBookings.forEach(b => {
                    propertyGmv += b.totalPrice;
                    const nights = b.noOfNights || 1;
                    const rooms = b.noOfRooms || 1;
                    const perRoomNightInclusive = b.totalPrice / (nights * rooms);
                    let gstPercentage = 0;
                    if (perRoomNightInclusive >= 7500) {
                      gstPercentage = 18;
                    } else if (perRoomNightInclusive >= 1000) {
                      gstPercentage = 5;
                    } else {
                      gstPercentage = 0;
                    }
                    const basePrice = b.totalPrice / (1 + gstPercentage / 100);
                    totalBasePrice += basePrice;
                    totalGstAmount += (b.totalPrice - basePrice);
                  });

                  const margin = h.marginPercentage || 0;
                  const propertyProfit = (totalBasePrice * margin) / 100;
                  const b2bPrice = totalBasePrice - propertyProfit;

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
                        <div style={{ background: '#fef3c7', padding: '16px', borderRadius: 12, border: '1px solid #fde68a' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d97706', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>GST Amount</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#d97706' }}>₹{Math.round(totalGstAmount).toLocaleString()}</div>
                        </div>
                        <div style={{ background: '#ecfdf5', padding: '16px', borderRadius: 12, border: '1px solid #a7f3d0' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.05em' }}>StayBuddy Profit</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669' }}>₹{Math.round(propertyProfit).toLocaleString()}</div>
                        </div>
                      </div>

                      {propertyBookings.length > 0 && (
                        <div style={{ marginBottom: 24, marginTop: -8 }}>
                          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', marginBottom: 12 }}>Booking Breakdown</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {propertyBookings.map((bk: any) => {
                              const nights = Math.ceil((new Date(bk.checkOut).getTime() - new Date(bk.checkIn).getTime()) / (1000 * 3600 * 24)) || 1;
                              const rooms = bk.rooms || 1;
                              const perRoomNightInclusive = bk.totalPrice / (nights * rooms);
                              let gstP = 0;
                              if (perRoomNightInclusive >= 7500) gstP = 18;
                              else if (perRoomNightInclusive >= 1000) gstP = 5;
                              
                              const bkBase = bk.totalPrice / (1 + gstP / 100);
                              const bkGst = bk.totalPrice - bkBase;
                              const bkProfit = (bkBase * margin) / 100;
                              const bkB2b = bkBase - bkProfit;
                              
                              return (
                                <div key={bk._id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 16, padding: '10px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center', fontSize: '0.8rem' }}>
                                  <div>
                                    <div style={{ fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{fontSize: '1rem'}}>🧾</span> {bk.invoiceNo || `INV-${(bk.bookingId || bk._id?.slice(-6)).toUpperCase()}`}</div>
                                    <div style={{ color: '#3b82f6', fontSize: '0.7rem', fontWeight: 600, marginTop: 4 }}>Booking ID: {bk.bookingId || bk._id.slice(-8)}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.7rem', marginTop: 2 }}>Check In: {new Date(bk.checkIn).toLocaleDateString()}</div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>B2C / B2B</div>
                                    <div style={{ fontWeight: 700, color: '#0f172a' }}>₹{Math.round(bk.totalPrice).toLocaleString()} <span style={{ color: '#cbd5e1', fontWeight: 400 }}>|</span> <span style={{ color: '#1d4ed8' }}>₹{Math.round(bkB2b).toLocaleString()}</span></div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>GST ({gstP}%)</div>
                                    <div style={{ fontWeight: 700, color: '#d97706' }}>₹{Math.round(bkGst).toLocaleString()}</div>
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>Profit</div>
                                    <div style={{ fontWeight: 700, color: '#059669' }}>₹{Math.round(bkProfit).toLocaleString()}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <button style={{ width: '100%', padding: '10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = '#1e293b'} onMouseLeave={e => e.currentTarget.style.background = '#0f172a'} onClick={() => setSelectedInvoiceHotel(h)}>
                        📄 Generate Tax Invoice
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== PARTNER AGREEMENTS ===== */}
          {activeTab === 'agreements' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h1 style={{ fontSize: '2rem', color: '#0f172a', margin: 0 }}>Partner Agreements</h1>
              </div>
              <p style={{ color: '#475569', marginBottom: 24 }}>
                The following properties and partners have accepted the StayBuddy Partner Policies and Terms & Conditions.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {hotels.filter((h: any) => h.status === 'approved').map(hotel => {
                  const partner = partners.find(p => p._id === hotel.partnerId);
                  return (
                    <div key={hotel._id} style={{ background: 'white', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', color: '#0f172a', fontSize: '1.1rem', fontWeight: 700 }}>{hotel.name}</h3>
                        <div style={{ color: '#64748b', fontSize: '0.85rem' }}>Partner: <span style={{ color: '#334155', fontWeight: 600 }}>{partner?.name || 'Unknown'}</span> &nbsp;|&nbsp; Email: {partner?.email || 'N/A'}</div>
                        <div style={{ color: '#059669', fontSize: '0.8rem', fontWeight: 600, marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ecfdf5', padding: '4px 10px', borderRadius: 6 }}>
                          <span style={{ fontSize: '1rem' }}>✓</span> Accepted StayBuddy Policies
                        </div>
                      </div>
                      <Link href={`/partner-agreement?hotelId=${hotel._id}`} target="_blank" style={{ padding: '10px 20px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>📄</span> View Master Agreement
                      </Link>
                    </div>
                  );
                })}
                {hotels.filter((h: any) => h.status === 'approved').length === 0 && (
                  <div style={{ padding: 40, textAlign: 'center', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1', color: '#64748b' }}>
                    No approved properties found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== USERS ===== */}
          {activeTab === 'users' && (
            <div className="fade-in">
              <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: 8 }}>User Analytics</h1>
              <p style={{ color: '#64748b', marginBottom: 32 }}>Manage registered customers and partners.</p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, width: '100%' }}>
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
                          <select 
                            value={u.role || 'customer'}
                            onChange={(e) => updateUser(u._id, { role: e.target.value })}
                            style={{ 
                              padding: '6px 14px', 
                              background: u.role === 'admin' ? '#fef3c7' : u.role === 'partner' ? '#e0f2fe' : '#f1f5f9', 
                              color: u.role === 'admin' ? '#d97706' : u.role === 'partner' ? '#0284c7' : '#475569', 
                              borderRadius: 20, 
                              fontSize: '0.75rem', 
                              fontWeight: 700, 
                              border: '1px solid',
                              borderColor: u.role === 'admin' ? '#fde68a' : u.role === 'partner' ? '#bae6fd' : '#e2e8f0',
                              outline: 'none',
                              cursor: 'pointer',
                              textTransform: 'capitalize'
                            }}
                          >
                            <option value="customer">👤 Customer</option>
                            <option value="partner">🏢 Partner</option>
                            <option value="admin">👑 Admin</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 12, marginBottom: 16, border: '1px solid #e2e8f0' }}>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 8 }}><strong>Email:</strong> {u.email || 'Not provided'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#475569' }}><strong>Phone:</strong> {u.phone || 'Not provided'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#475569', marginTop: 8 }}><strong>Bookings Made:</strong> {userBookings.length}</div>
                      </div>

                      <button 
                        onClick={() => updateUser(u._id, { isActive: !u.isActive })}
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
                <button onClick={openCreateInvoiceModal} className="btn btn-primary" style={{ padding: '10px 20px', borderRadius: 8, fontWeight: 600, boxShadow: '0 4px 12px rgba(37,99,235,0.2)' }}>
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

          {/* ===== TRADE SHOW HOTEL EXTRACTOR ===== */}
          {activeTab === 'trade_shows' && (
            <div className="fade-in">
              <TradeShowExtractor />
            </div>
          )}

        </div>
      </main>

      {/* ===== CREATE TAX INVOICE MODAL ===== */}
      {showCreateInvoice && (
        <div className="admin-tax-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateInvoice(false); }}>
          <div className="admin-tax-modal-box">
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, borderBottom: '1px solid #f1f5f9', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800 }}>
                  📄
                </div>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>Generate Tax Invoice</h2>
                  <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Create official GST tax bill / invoice for guests</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowCreateInvoice(false)} 
                style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Row 1: Invoice No & Invoice Date */}
              <div className="tax-grid-2">
                <div>
                  <label className="tax-modal-label">Invoice No.</label>
                  <input required type="text" className="tax-modal-input" value={newInvoiceData.invoiceNo} onChange={e => setNewInvoiceData({...newInvoiceData, invoiceNo: e.target.value})} />
                </div>
                <div>
                  <label className="tax-modal-label">Invoice Date</label>
                  <input required type="date" className="tax-modal-input" value={newInvoiceData.invoiceDate} onChange={e => setNewInvoiceData({...newInvoiceData, invoiceDate: e.target.value})} />
                </div>
              </div>
              
              {/* Row 2: Guest Name & Company Name */}
              <div className="tax-grid-split">
                <div>
                  <label className="tax-modal-label">Guest Name</label>
                  <input required type="text" className="tax-modal-input" placeholder="e.g. John Doe" value={newInvoiceData.guestName} onChange={e => setNewInvoiceData({...newInvoiceData, guestName: e.target.value})} />
                </div>
                <div>
                  <label className="tax-modal-label">
                    <span>Company Name</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Optional</span>
                  </label>
                  <input type="text" className="tax-modal-input" placeholder="e.g. Acme Corp" value={newInvoiceData.companyName} onChange={e => setNewInvoiceData({...newInvoiceData, companyName: e.target.value})} />
                </div>
              </div>

              {/* Row 3: GST Number & Address */}
              <div className="tax-grid-split">
                <div>
                  <label className="tax-modal-label">
                    <span>GST Number</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Optional</span>
                  </label>
                  <input type="text" className="tax-modal-input" placeholder="e.g. 36AABCU9603R1ZM" value={newInvoiceData.gstNumber} onChange={e => setNewInvoiceData({...newInvoiceData, gstNumber: e.target.value})} />
                </div>
                <div>
                  <label className="tax-modal-label">Address</label>
                  <input type="text" className="tax-modal-input" placeholder="Guest / Company Address" value={newInvoiceData.address} onChange={e => setNewInvoiceData({...newInvoiceData, address: e.target.value})} />
                </div>
              </div>

              {/* Row 4: Booking ID, Place of Supply, Hotel Name, Hotel City */}
              <div className="tax-grid-4">
                <div>
                  <label className="tax-modal-label">
                    <span>Booking ID</span>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>Opt</span>
                  </label>
                  <input type="text" className="tax-modal-input" value={newInvoiceData.bookingId} onChange={e => setNewInvoiceData({...newInvoiceData, bookingId: e.target.value})} />
                </div>
                <div>
                  <label className="tax-modal-label">Place of Supply</label>
                  <input type="text" className="tax-modal-input" value={newInvoiceData.placeOfSupply} onChange={e => setNewInvoiceData({...newInvoiceData, placeOfSupply: e.target.value})} />
                </div>
                <div>
                  <label className="tax-modal-label">Hotel Name</label>
                  <input type="text" className="tax-modal-input" value={newInvoiceData.hotelName} onChange={e => setNewInvoiceData({...newInvoiceData, hotelName: e.target.value})} placeholder="e.g. Hotel RK Grand" />
                </div>
                <div>
                  <label className="tax-modal-label">Hotel City</label>
                  <input type="text" className="tax-modal-input" value={newInvoiceData.hotelCity} onChange={e => setNewInvoiceData({...newInvoiceData, hotelCity: e.target.value})} placeholder="e.g. Hyderabad" />
                </div>
              </div>

              {/* Row 5: Stay Details & Occupancy */}
              <div>
                <div className="tax-stay-container">
                  {/* Dates Group: Check-In & Check-Out */}
                  <div className="tax-stay-dates">
                    <div>
                      <label className="tax-modal-label">
                        <span>Check-In</span>
                        <span style={{ fontSize: '0.72rem', color: '#2563eb' }}>📅</span>
                      </label>
                      <input required type="date" className="tax-modal-input" value={newInvoiceData.checkInDate} onChange={e => handleCheckInChange(e.target.value)} />
                    </div>
                    <div>
                      <label className="tax-modal-label">
                        <span>Check-Out</span>
                        <span style={{ fontSize: '0.72rem', color: '#2563eb' }}>📅</span>
                      </label>
                      <input required type="date" className="tax-modal-input" value={newInvoiceData.checkOutDate} onChange={e => handleCheckOutChange(e.target.value)} />
                    </div>
                  </div>

                  {/* Counts Group: Nights, Rooms, Guests/Rm */}
                  <div className="tax-stay-counts">
                    <div>
                      <label className="tax-modal-label">
                        <span>Nights</span>
                        <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: 4, background: '#dbeafe', color: '#1d4ed8', fontWeight: 800 }}>Auto</span>
                      </label>
                      <input required type="number" min="1" className="tax-modal-input" style={{ fontWeight: 700, color: '#1d4ed8', background: '#f8fafc' }} value={newInvoiceData.noOfNights} onChange={e => setNewInvoiceData({...newInvoiceData, noOfNights: e.target.value})} placeholder="1" />
                    </div>
                    <div>
                      <label className="tax-modal-label">Rooms</label>
                      <input required type="number" min="1" className="tax-modal-input" value={newInvoiceData.noOfRooms} onChange={e => setNewInvoiceData({...newInvoiceData, noOfRooms: e.target.value})} />
                    </div>
                    <div>
                      <label className="tax-modal-label">Guests/Rm</label>
                      <input required type="number" min="1" className="tax-modal-input" value={newInvoiceData.noOfGuests} onChange={e => setNewInvoiceData({...newInvoiceData, noOfGuests: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 6: Total Amount & Live Tax Breakdown */}
              <div>
                <label className="tax-modal-label" style={{ fontSize: '0.88rem', color: '#0f172a' }}>
                  <span>Total Bill Amount (₹)</span>
                  <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>Inclusive of GST</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'stretch', borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1', background: 'white' }}>
                  <span style={{ background: '#f8fafc', color: '#475569', fontWeight: 800, padding: '0 16px', display: 'flex', alignItems: 'center', fontSize: '1.1rem', borderRight: '1px solid #cbd5e1' }}>₹</span>
                  <input 
                    required 
                    type="number" 
                    step="any" 
                    min="0"
                    placeholder="0.00" 
                    className="tax-modal-input" 
                    style={{ flex: 1, padding: '10px 14px', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', border: 'none', borderRadius: 0, outline: 'none' }} 
                    value={newInvoiceData.totalAmount} 
                    onChange={e => setNewInvoiceData({...newInvoiceData, totalAmount: e.target.value})} 
                  />
                </div>

                {/* Calculation Breakdown Card */}
                <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 10, background: '#f8fafc', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)' }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div className="tax-breakdown-row">
                          <span>Per Room/Night (inclusive):</span>
                          <strong style={{ color: '#0f172a' }}>₹{perRoomNight.toFixed(2)}</strong>
                        </div>
                        <div className="tax-breakdown-row">
                          <span>Applicable GST Slab:</span>
                          <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.75rem', fontWeight: 800, background: gst === 18 ? '#fee2e2' : gst === 5 ? '#ffedd5' : '#dcfce7', color: gst === 18 ? '#b91c1c' : gst === 5 ? '#c2410c' : '#15803d' }}>
                            {gst}% GST
                          </span>
                        </div>
                        <div className="tax-breakdown-row">
                          <span>Base Amount (excl. GST):</span>
                          <strong>₹{base.toFixed(2)}</strong>
                        </div>
                        <div className="tax-breakdown-row">
                          <span>GST Amount:</span>
                          <strong style={{ color: gst > 0 ? '#ea580c' : '#475569' }}>₹{gstAmt.toFixed(2)}</strong>
                        </div>
                        <div className="tax-breakdown-row">
                          <span>Tariff/Room/Night (excl. GST):</span>
                          <strong style={{ color: '#2563eb' }}>₹{basePerRoomNight.toFixed(2)}</strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button 
                  type="button" 
                  onClick={() => setShowCreateInvoice(false)} 
                  style={{ flex: 1, padding: '12px 16px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={approveLoading === 'invoice'} 
                  style={{ flex: 1.5, padding: '12px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', opacity: approveLoading === 'invoice' ? 0.7 : 1, boxShadow: '0 4px 12px rgba(37,99,235,0.25)', transition: 'all 0.15s ease' }}
                >
                  {approveLoading === 'invoice' ? 'Saving Invoice...' : 'Save & Generate Invoice'}
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
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '92vh', overflowY: 'auto', padding: '28px 32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setEditingHotel(null)} style={{ position: 'absolute', top: 20, right: 20, background: '#f1f5f9', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', color: '#64748b' }}>✕</button>
            
            {/* Header with badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase' }}>
                {editingHotel.status === 'approved' ? '✅ Approved' : '⏳ Pending Review'}
              </span>
              <span style={{ background: '#e0e7ff', color: '#4338ca', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                {editingHotel.propertyType || 'Hotel'}
              </span>
              <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                ⭐ {editingHotel.starRating || 3} Stars
              </span>
              <span style={{ background: '#f1f5f9', color: 'var(--brand-600)', padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>
                ID: {editingHotel.hotelId || editingHotel._id?.slice(-8)}
              </span>
            </div>

            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: 16, fontWeight: 800 }}>
              Review Property: {editingHotel.name}
            </h2>

            {/* Partner Details Banner */}
            <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', fontSize: '0.85rem' }}>
              <div><strong>🧑‍💼 Submitted by:</strong> {editingHotel.partnerId?.name || editingHotel.contactName || 'Partner'}</div>
              <div><strong>✉️ Email:</strong> {editingHotel.partnerId?.email || editingHotel.contactEmail || 'N/A'}</div>
              <div><strong>📞 Phone:</strong> {editingHotel.partnerId?.phone || editingHotel.contactPhone || 'N/A'}</div>
              {editingHotel.contactDesignation && <div><strong>💼 Designation:</strong> {editingHotel.contactDesignation}</div>}
              <div style={{ color: '#64748b' }}><strong>📅 Date:</strong> {new Date(editingHotel.createdAt || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            </div>

            {/* Photos Gallery Preview */}
            {editingHotel.images && editingHotel.images.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    📸 Uploaded Property Photos ({editingHotel.images.length} Photos)
                  </label>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Scroll to view all</span>
                </div>
                <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
                  {editingHotel.images.map((img: string, idx: number) => (
                    <div key={idx} style={{ position: 'relative', width: 130, height: 90, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                      <img src={img} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const updates = {
                name: fd.get('name'),
                description: fd.get('description'),
                city: fd.get('city'),
                area: fd.get('area') || editingHotel.area,
                address: fd.get('address'),
                basePrice: parseFloat(fd.get('basePrice') as string) || 0,
                marginPercentage: parseFloat(fd.get('marginPercentage') as string) || 15,
                isExtranet: true,
                status: 'approved'
              };
              setApproveLoading(editingHotel._id);
              await updateHotelStatus(editingHotel._id, updates);
              setEditingHotel(null);
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Property Name</label>
                  <input name="name" defaultValue={editingHotel.name} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>City</label>
                  <input name="city" defaultValue={editingHotel.city} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Area / Locality</label>
                  <input name="area" defaultValue={editingHotel.area || ''} placeholder="e.g. Shamshabad" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Full Address</label>
                <input name="address" defaultValue={editingHotel.address} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              </div>

              {/* Property Specs bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, background: '#f8fafc', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 16, fontSize: '0.85rem' }}>
                <div><span style={{ color: '#64748b' }}>Total Rooms:</span> <strong>{editingHotel.totalPropertyRooms || 'N/A'}</strong></div>
                <div><span style={{ color: '#64748b' }}>SB Allocation:</span> <strong>{editingHotel.staybuddyAllocation || 'N/A'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Total Floors:</span> <strong>{editingHotel.totalFloors || 'N/A'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Check-in:</span> <strong>{editingHotel.checkInTime || '14:00'}</strong></div>
                <div><span style={{ color: '#64748b' }}>Check-out:</span> <strong>{editingHotel.checkOutTime || '11:00'}</strong></div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Description</label>
                <textarea name="description" defaultValue={editingHotel.description} required rows={2} style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'vertical' }} />
              </div>

              {/* Hotel Amenities chips */}
              {editingHotel.amenities && editingHotel.amenities.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Hotel Amenities Selected</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {editingHotel.amenities.map((am: string, i: number) => (
                      <span key={i} style={{ background: '#f1f5f9', color: '#334155', padding: '3px 10px', borderRadius: 6, fontSize: '0.78rem', fontWeight: 600 }}>
                        ✓ {am}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* ===== ALL ROOMS & OCCUPANCY PRICING SECTION ===== */}
              <div style={{ marginBottom: 24, borderTop: '2px solid #e2e8f0', paddingTop: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    🛏️ Rooms & Occupancy Pricing ({(editingHotel.rooms || []).length} Types)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Single, Double, Triple & B2B rates</span>
                </div>

                {(!editingHotel.rooms || editingHotel.rooms.length === 0) ? (
                  <div style={{ padding: '24px', background: '#f8fafc', borderRadius: 10, color: '#64748b', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
                    No specific rooms attached to this submission. Partner will configure via Extranet Manager.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {editingHotel.rooms.map((room: any, rIdx: number) => (
                      <div key={room._id || rIdx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>{room.type}</h4>
                              <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.72rem', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                                ☕ {room.ratePlan || 'EP'} ({room.ratePlan === 'CP' ? 'Free Breakfast' : room.ratePlan === 'MAP' ? 'Breakfast & Dinner' : room.ratePlan === 'AP' ? 'All Meals' : 'Room Only'})
                              </span>
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                              <span>🛏️ {room.bedType || 'Double'}</span>
                              <span>👥 Max {room.maxGuests || 3} Guests</span>
                              {room.size && <span>📐 {room.size} m²</span>}
                              {room.description && <span>• {room.description}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, fontSize: '0.82rem' }}>
                            <span style={{ background: '#f8fafc', padding: '4px 10px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 600 }}>
                              Total Rooms: {room.totalRooms !== undefined ? room.totalRooms : 'N/A'}
                            </span>
                            <span style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 10px', borderRadius: 6, border: '1px solid #bfdbfe', fontWeight: 700 }}>
                              SB Allocation: {room.staybuddyAllocation !== undefined ? room.staybuddyAllocation : 'N/A'}
                            </span>
                          </div>
                        </div>

                        {/* Occupancy Pricing Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 10 }}>
                          <div style={{ background: '#fff7ed', padding: '10px 12px', borderRadius: 8, border: '1px solid #fed7aa', borderLeft: '4px solid #f97316' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#9a3412', fontWeight: 800 }}>👤 Single (1 Adult)</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c2410c', marginTop: 2 }}>
                              ₹{editingHotel.marginPercentage ? Math.round((room.priceSingle || 0) * (1 + (editingHotel.marginPercentage || 0) / 100)) : (room.priceSingle || 0)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#9a3412', marginTop: 2 }}>B2B: ₹{room.priceSingle || 0}</div>
                          </div>
                          <div style={{ background: '#f0fdf4', padding: '10px 12px', borderRadius: 8, border: '1px solid #bbf7d0', borderLeft: '4px solid #22c55e' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#166534', fontWeight: 800 }}>👥 Double (2 Adults)</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#15803d', marginTop: 2 }}>
                              ₹{editingHotel.marginPercentage ? Math.round((room.priceDouble || room.priceSingle || 0) * (1 + (editingHotel.marginPercentage || 0) / 100)) : (room.priceDouble || room.priceSingle || 0)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#166534', marginTop: 2 }}>B2B: ₹{room.priceDouble || room.priceSingle || 0}</div>
                          </div>
                          <div style={{ background: '#eff6ff', padding: '10px 12px', borderRadius: 8, border: '1px solid #bfdbfe', borderLeft: '4px solid #3b82f6' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#1e40af', fontWeight: 800 }}>👨‍👩‍👦 Triple (3 Adults)</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1d4ed8', marginTop: 2 }}>
                              ₹{editingHotel.marginPercentage && room.priceTriple ? Math.round(Number(room.priceTriple) * (1 + (editingHotel.marginPercentage || 0) / 100)) : (room.priceTriple || 0)}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#1e40af', marginTop: 2 }}>B2B: ₹{room.priceTriple || 0}</div>
                          </div>
                          <div style={{ background: '#faf5ff', padding: '10px 12px', borderRadius: 8, border: '1px solid #e9d5ff', borderLeft: '4px solid #a855f7' }}>
                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#6b21a8', fontWeight: 800 }}>💼 B2B Partner Rate</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#7e22ce', marginTop: 2 }}>₹{room.b2bPrice || 0}</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b21a8', marginTop: 2 }}>Margin: {editingHotel.marginPercentage || 0}%</div>
                          </div>
                        </div>

                        {/* Room Amenities */}
                        {room.amenities && room.amenities.length > 0 && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                            {room.amenities.map((am: string, aIdx: number) => (
                              <span key={aIdx} style={{ fontSize: '0.74rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                                ✓ {am}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Room Photos */}
                        {room.images && room.images.length > 0 && (
                          <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
                            {room.images.map((img: string, iIdx: number) => (
                              <div key={iIdx} style={{ position: 'relative', width: 90, height: 60, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid #cbd5e1' }}>
                                <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Commercials & Pricing (Margin & Approval) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28, background: '#f8fafc', padding: 20, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>Base Starting Rate (₹) / night</label>
                  <input name="basePrice" type="number" defaultValue={editingHotel.basePrice || 0} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 600, color: '#0f172a' }} />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4, display: 'block' }}>Default catalog starting rate if rooms are unconfigured</span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: 6 }}>StayBuddy Margin (%)</label>
                  <input name="marginPercentage" type="number" defaultValue={editingHotel.marginPercentage || 15} required style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '1rem', fontWeight: 700, color: '#10b981' }} />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: 4, display: 'block' }}>StayBuddy profit margin added on top of B2B rates</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button type="submit" disabled={approveLoading === editingHotel._id} style={{ flex: 1.5, padding: '14px', background: '#10b981', color: 'white', border: 'none', borderRadius: 8, fontSize: '1.05rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {approveLoading === editingHotel._id ? 'Approving...' : '✓ Save & Approve Property'}
                </button>
                <button type="button" onClick={() => { const r = prompt('Rejection reason:'); if (r) { updateHotelStatus(editingHotel._id, { status: 'rejected', rejectionReason: r }); setEditingHotel(null); } }} disabled={approveLoading === editingHotel._id} style={{ flex: 1, padding: '14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, fontSize: '1.05rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(239,68,68,0.2)' }}>
                  ✕ Reject Request
                </button>
                <button type="button" onClick={() => setEditingHotel(null)} style={{ padding: '14px 24px', background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '1rem', fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {/* Extranet Edit Modal */}
      {extranetModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)' }} onClick={() => setExtranetModal(null)} />
          <div style={{ position: 'relative', background: '#f8fafc', width: '94%', maxWidth: 1080, margin: 'auto', maxHeight: '92vh', borderRadius: 24, display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
            
            {/* Modal Header */}
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                  🏨
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Extranet Manager: {extranetModal.name}
                    </h2>
                    <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', fontWeight: 700, padding: '2px 8px', borderRadius: 12 }}>
                      {extranetModal.city || 'Partner Property'}
                    </span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: '0.82rem', margin: '2px 0 0' }}>
                    Admin Extranet CRM • Review and manage full property details • {
                      extranetModalTab === 'property' ? 'Tab 1 of 6 — Property Info' :
                      extranetModalTab === 'location' ? 'Tab 2 of 6 — Location & Transit' :
                      extranetModalTab === 'amenities' ? 'Tab 3 of 6 — Amenities & Meal Plans' :
                      extranetModalTab === 'rooms' ? 'Tab 4 of 6 — Rooms & Pricing' :
                      extranetModalTab === 'photos' ? 'Tab 5 of 6 — Photos & 30-Photo Gallery' :
                      'Tab 6 of 6 — Policies & Inventory'
                    }
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button 
                  onClick={() => setExtranetModal(null)} 
                  style={{ 
                    background: '#f1f5f9', 
                    border: 'none', 
                    width: 36, 
                    height: 36, 
                    borderRadius: '50%', 
                    cursor: 'pointer', 
                    fontSize: '1.1rem', 
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Segmented Nav Tabs */}
            <div style={{
              display: 'flex',
              background: 'white',
              borderBottom: '1px solid #e2e8f0',
              padding: '0 8px',
              overflowX: 'auto',
              WebkitOverflowScrolling: 'touch',
              scrollbarWidth: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {[
                { id: 'property', label: 'PROPERTY', step: 1 },
                { id: 'location', label: 'LOCATION', step: 2 },
                { id: 'amenities', label: 'AMENITIES', step: 3 },
                { id: 'rooms', label: 'ROOMS', step: 4 },
                { id: 'photos', label: 'PHOTOS', step: 5 },
                { id: 'policies', label: 'POLICIES', step: 6 },
              ].map(t => {
                const isActive = extranetModalTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setExtranetModalTab(t.id as any)}
                    style={{
                      flex: '1 0 auto',
                      minWidth: 75,
                      padding: '12px 12px',
                      background: 'none',
                      border: 'none',
                      borderBottom: isActive ? '3px solid var(--brand-500, #f97316)' : '3px solid transparent',
                      color: isActive ? 'var(--brand-600, #ea580c)' : '#64748b',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: '0.78rem',
                      letterSpacing: '0.04em',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body / Tab Contents */}
            <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              <form onSubmit={(e) => {
                e.preventDefault();
                const roomPhotos = (extranetModal.rooms || []).flatMap((r: any) => Array.isArray(r.images) ? r.images : (typeof r.images === 'string' ? r.images.split('\n').map((s: string) => s.trim()).filter(Boolean) : [])).filter(Boolean);
                let finalImgs = [...(extranetModal.images || [])];
                if (finalImgs.length === 0 && roomPhotos.length > 0) {
                  finalImgs = Array.from(new Set(roomPhotos));
                }
                const updatedPayload = { ...extranetModal, images: finalImgs };
                updateHotelStatus(extranetModal._id, updatedPayload);
                setExtranetModal(null);
                alert('Property updated successfully!');
              }} style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 60 }}>
                
                {/* TAB 1: PROPERTY */}
                {extranetModalTab === 'property' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ background: 'white', padding: 22, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>📝 Property Information</span>
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Property Name *</label>
                          <input type="text" value={extranetModal.name || ''} onChange={e => setExtranetModal({...extranetModal, name: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Property Type</label>
                          <select value={extranetModal.propertyType || 'Hotel'} onChange={e => setExtranetModal({...extranetModal, propertyType: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                            <option value="Hotel">Hotel</option>
                            <option value="Resort">Resort</option>
                            <option value="Villa">Villa</option>
                            <option value="Homestay">Homestay</option>
                            <option value="Service Apartment">Service Apartment</option>
                            <option value="Boutique Hotel">Boutique Hotel</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Star Rating (1 - 5)</label>
                          <select value={extranetModal.starRating || 3} onChange={e => setExtranetModal({...extranetModal, starRating: Number(e.target.value)})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 700, color: '#b45309' }}>
                            <option value={1}>★ 1 Star</option>
                            <option value={2}>★★ 2 Star</option>
                            <option value={3}>★★★ 3 Star</option>
                            <option value={4}>★★★★ 4 Star</option>
                            <option value={5}>★★★★★ 5 Star</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Category</label>
                          <select value={extranetModal.category || 'Standard'} onChange={e => setExtranetModal({...extranetModal, category: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}>
                            <option value="Budget">Budget</option>
                            <option value="Standard">Standard</option>
                            <option value="Premium">Premium</option>
                            <option value="Luxury">Luxury</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Total Rooms</label>
                          <input type="number" value={extranetModal.totalPropertyRooms || 10} onChange={e => setExtranetModal({...extranetModal, totalPropertyRooms: Number(e.target.value)})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>StayBuddy Allocation</label>
                          <input type="number" value={extranetModal.staybuddyAllocation || 5} onChange={e => setExtranetModal({...extranetModal, staybuddyAllocation: Number(e.target.value)})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #fed7aa', background: '#fff7ed', fontSize: '0.9rem', fontWeight: 700, color: '#c2410c' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Total Floors</label>
                          <input type="number" value={extranetModal.totalFloors || 4} onChange={e => setExtranetModal({...extranetModal, totalFloors: Number(e.target.value)})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b' }}>Property Description *</label>
                          <button
                            type="button"
                            onClick={generateExtranetAIDescription}
                            disabled={extranetAiLoading}
                            style={{
                              padding: '4px 10px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe',
                              borderRadius: 6,
                              cursor: extranetAiLoading ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <span>{extranetAiLoading ? '⏳ Generating...' : '✨ AI Enhance Description'}</span>
                          </button>
                        </div>
                        <textarea 
                          value={extranetModal.description || ''} 
                          onChange={e => setExtranetModal({...extranetModal, description: e.target.value})} 
                          rows={4} 
                          placeholder="Describe the property and its unique highlights..."
                          style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.88rem', lineHeight: 1.5 }} 
                        />
                      </div>
                    </div>

                    <div style={{ background: 'white', padding: 22, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>📞 Contact Person</span>
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Contact Name</label>
                          <input type="text" value={extranetModal.contactName || ''} onChange={e => setExtranetModal({...extranetModal, contactName: e.target.value})} placeholder="e.g. Rahul Sharma" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Designation</label>
                          <input type="text" value={extranetModal.contactDesignation || 'General Manager'} onChange={e => setExtranetModal({...extranetModal, contactDesignation: e.target.value})} placeholder="e.g. General Manager" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Contact Phone</label>
                          <input type="text" value={extranetModal.contactPhone || ''} onChange={e => setExtranetModal({...extranetModal, contactPhone: e.target.value})} placeholder="+91 98765 43210" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Partner Email</label>
                          <input type="email" value={extranetModal.partnerEmail || extranetModal.contactEmail || ''} onChange={e => setExtranetModal({...extranetModal, partnerEmail: e.target.value, contactEmail: e.target.value})} placeholder="partner@hotel.com" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #bbf7d0', background: '#f0fdf4', fontSize: '0.9rem', fontWeight: 600, color: '#166534' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: LOCATION */}
                {extranetModalTab === 'location' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ background: 'white', padding: 22, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>📍 Location & Transit Details</span>
                        </h3>
                        <button
                          type="button"
                          onClick={getExtranetLocation}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: '#eff6ff',
                            color: '#2563eb',
                            border: '1px solid #bfdbfe',
                            borderRadius: 8,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6
                          }}
                        >
                          <span>📍 Auto-Detect Current GPS</span>
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>City *</label>
                          <input type="text" value={extranetModal.city || ''} onChange={e => setExtranetModal({...extranetModal, city: e.target.value})} placeholder="e.g. Hyderabad" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} required />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Area / Locality</label>
                          <input type="text" value={extranetModal.area || ''} onChange={e => setExtranetModal({...extranetModal, area: e.target.value})} placeholder="e.g. Shamshabad / Hitec City" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', fontWeight: 700, color: '#64748b', margin: 0 }}>
                              <span>📍 Coordinates (Latitude & Longitude in 1 line)</span>
                              <span style={{ fontSize: '0.72rem', fontWeight: 500, color: '#94a3b8' }}>(Paste from Google Maps)</span>
                            </label>
                            {extranetModal.lat && extranetModal.lng && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '1px 6px', borderRadius: 4, border: '1px solid #a7f3d0' }}>
                                ✓ {extranetModal.lat}, {extranetModal.lng}
                              </span>
                            )}
                          </div>
                          <div style={{ position: 'relative' }}>
                            <input 
                              type="text" 
                              value={extranetModal.lat && extranetModal.lng ? `${extranetModal.lat}, ${extranetModal.lng}` : (extranetModal.lat || extranetModal.lng || '')} 
                              onChange={e => {
                                const val = e.target.value;
                                const parsed = parseCoordinates(val);
                                if (parsed) {
                                  setExtranetModal((p: any) => ({ ...p, lat: parsed.lat, lng: parsed.lng }));
                                } else {
                                  const parts = val.split(/[,\s;/|]+/).map(s => s.trim()).filter(Boolean);
                                  if (parts.length >= 2) {
                                    setExtranetModal((p: any) => ({ ...p, lat: parts[0], lng: parts[1] }));
                                  } else if (parts.length === 1) {
                                    setExtranetModal((p: any) => ({ ...p, lat: parts[0] }));
                                  } else {
                                    setExtranetModal((p: any) => ({ ...p, lat: '', lng: '' }));
                                  }
                                }
                              }} 
                              placeholder="e.g. 17.385044, 78.486671 (Paste from Google Maps)" 
                              style={{ width: '100%', padding: '9px 12px', paddingRight: '75px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 600 }} 
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.readText) {
                                    const text = await navigator.clipboard.readText();
                                    if (text) {
                                      const parsed = parseCoordinates(text);
                                      if (parsed) setExtranetModal((p: any) => ({ ...p, lat: parsed.lat, lng: parsed.lng }));
                                    }
                                  }
                                } catch (e) {}
                              }}
                              style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: 4, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <span>📋</span>
                              <span>Paste</span>
                            </button>
                          </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Full Property Address</label>
                          <input type="text" value={extranetModal.address || ''} onChange={e => setExtranetModal({...extranetModal, address: e.target.value})} placeholder="Plot 12, Main Road..." style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Search String / Landmark Display</label>
                          <input type="text" value={extranetModal.location || ''} onChange={e => setExtranetModal({...extranetModal, location: e.target.value})} placeholder="Near Rajiv Gandhi Airport, Hyderabad" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: AMENITIES */}
                {extranetModalTab === 'amenities' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ background: 'white', padding: 22, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>✨ Property Amenities</span>
                      </h3>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {[
                          'Free WiFi', 'AC', '24-hour Front Desk', 'Restaurant', 'Swimming Pool', 
                          'Parking', 'Elevator', 'Power Backup', 'Gym', 'Spa', 'Bar', 
                          'Room Service', 'CCTV Security', 'Banquet Hall', 'Pet Friendly', 
                          'Daily Housekeeping', 'Conference Room'
                        ].map(am => {
                          const has = (extranetModal.amenities || []).includes(am);
                          return (
                            <div 
                              key={am} 
                              onClick={() => {
                                const newAm = has 
                                  ? extranetModal.amenities.filter((a: string) => a !== am) 
                                  : [...(extranetModal.amenities || []), am];
                                setExtranetModal({...extranetModal, amenities: newAm});
                              }} 
                              style={{ 
                                padding: '8px 14px', 
                                borderRadius: 10, 
                                border: `1.5px solid ${has ? '#2563eb' : '#cbd5e1'}`, 
                                background: has ? '#eff6ff' : 'white', 
                                color: has ? '#1d4ed8' : '#64748b', 
                                cursor: 'pointer', 
                                fontSize: '0.84rem', 
                                fontWeight: has ? 700 : 500,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6
                              }}
                            >
                              <span>{has ? '✓' : '+'}</span>
                              <span>{am}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div style={{ background: 'white', padding: 22, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>🍽️ Food Plans & Timings</span>
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Standard Check-in Time</label>
                          <input type="text" value={extranetModal.checkInTime || '12:00 PM'} onChange={e => setExtranetModal({...extranetModal, checkInTime: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Standard Check-out Time</label>
                          <input type="text" value={extranetModal.checkOutTime || '11:00 AM'} onChange={e => setExtranetModal({...extranetModal, checkOutTime: e.target.value})} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: ROOMS (Matching Photo 1) */}
                {extranetModalTab === 'rooms' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>Room Types & Pricing</h3>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>Configure single, double, triple pricing and room-specific photos for each room type.</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          const newRoom = { 
                            id: 'new_' + Date.now().toString(), 
                            type: 'Deluxe Room', 
                            priceSingle: 1500, 
                            priceDouble: 2000, 
                            priceTriple: 0, 
                            b2bPrice: 1200, 
                            maxGuests: 2, 
                            totalRooms: 10, 
                            staybuddyAllocation: 5, 
                            ratePlan: 'EP',
                            amenities: ['AC', 'Free WiFi', 'Room Service'],
                            description: 'Spacious modern room with premium bedding and amenities.',
                            images: []
                          };
                          setExtranetModal({...extranetModal, rooms: [...(extranetModal.rooms || []), newRoom]});
                        }} 
                        style={{ background: 'var(--brand-500, #f97316)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        + Add Another Room Type
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                      {(extranetModal.rooms || []).map((room: any, rIdx: number) => (
                        <div key={room.id || room._id || rIdx} style={{ padding: 20, border: '1.5px solid #e2e8f0', borderRadius: 16, background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ background: '#f97316', color: 'white', fontSize: '0.75rem', fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>
                                Room {rIdx + 1}
                              </span>
                              <input 
                                type="text" 
                                value={room.type || 'Standard Room'} 
                                onChange={e => {
                                  const updatedRooms = [...extranetModal.rooms];
                                  updatedRooms[rIdx].type = e.target.value;
                                  setExtranetModal({...extranetModal, rooms: updatedRooms});
                                }} 
                                style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a', border: 'none', borderBottom: '1.5px dashed #cbd5e1', padding: '2px 6px', background: 'transparent' }} 
                              />
                            </div>
                            <button 
                              type="button" 
                              onClick={() => {
                                const updatedRooms = extranetModal.rooms.filter((_: any, idx: number) => idx !== rIdx);
                                setExtranetModal({...extranetModal, rooms: updatedRooms});
                              }} 
                              style={{ color: '#ef4444', background: '#fee2e2', border: 'none', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}
                            >
                              ✕ Remove Room
                            </button>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 12, marginBottom: 14 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#c2410c', marginBottom: 4 }}>Single Price (₹) *</label>
                              <input 
                                type="number" 
                                placeholder="e.g. 1500" 
                                value={room.priceSingle !== undefined ? room.priceSingle : ''} 
                                onChange={e => {
                                  const updatedRooms = [...extranetModal.rooms];
                                  updatedRooms[rIdx].priceSingle = Number(e.target.value) || 0;
                                  setExtranetModal({...extranetModal, rooms: updatedRooms});
                                }} 
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #fed7aa', background: '#fff7ed', fontSize: '0.9rem', fontWeight: 700 }} 
                                required 
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#15803d', marginBottom: 4 }}>Double Price (₹) *</label>
                              <input 
                                type="number" 
                                placeholder="e.g. 2000" 
                                value={room.priceDouble || ''} 
                                onChange={e => {
                                  const updatedRooms = [...extranetModal.rooms];
                                  updatedRooms[rIdx].priceDouble = Number(e.target.value) || 0;
                                  setExtranetModal({...extranetModal, rooms: updatedRooms});
                                }} 
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1.5px solid #bbf7d0', background: '#f0fdf4', fontSize: '0.9rem', fontWeight: 700 }} 
                                required 
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', marginBottom: 4 }}>Triple (3 Guests)</label>
                              <input 
                                type="number" 
                                placeholder={room.priceTriple ? "e.g. 2500" : "+ Add 3-Occupancy"} 
                                value={room.priceTriple || ''} 
                                onChange={e => {
                                  const updatedRooms = [...extranetModal.rooms];
                                  const numTrp = Number(e.target.value) || 0;
                                  updatedRooms[rIdx].priceTriple = numTrp;
                                  updatedRooms[rIdx].maxGuests = numTrp > 0 ? 3 : 2;
                                  setExtranetModal({...extranetModal, rooms: updatedRooms});
                                }} 
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: room.priceTriple ? '1.5px solid #bfdbfe' : '1.5px dashed #fdba74', background: room.priceTriple ? '#eff6ff' : 'white', fontSize: '0.9rem', fontWeight: 700, color: '#1e40af' }} 
                              />
                            </div>
                            <div style={{ background: '#f0fdf4', padding: '4px 8px', borderRadius: 8, border: '1.5px solid #86efac' }}>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#166534', marginBottom: 4 }}>B2B Price (₹)</label>
                              <input 
                                type="number" 
                                placeholder="e.g. 1200" 
                                value={room.b2bPrice !== undefined ? room.b2bPrice : ''} 
                                onChange={e => {
                                  const updatedRooms = [...extranetModal.rooms];
                                  updatedRooms[rIdx].b2bPrice = Number(e.target.value);
                                  setExtranetModal({...extranetModal, rooms: updatedRooms});
                                }} 
                                style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #16a34a', background: '#ffffff', fontSize: '0.9rem', fontWeight: 800, color: '#166534' }} 
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Rate Plan</label>
                              <select 
                                value={room.ratePlan || 'EP'} 
                                onChange={e => {
                                  const updatedRooms = [...extranetModal.rooms];
                                  updatedRooms[rIdx].ratePlan = e.target.value;
                                  setExtranetModal({...extranetModal, rooms: updatedRooms});
                                }} 
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem', fontWeight: 600 }}
                              >
                                <option value="EP">EP (Room Only)</option>
                                <option value="CP">CP (Room + Breakfast)</option>
                                <option value="MAP">MAP (Room + 2 Meals)</option>
                                <option value="AP">AP (Room + All Meals)</option>
                              </select>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', padding: '6px 10px', borderRadius: 6, marginBottom: 14, border: '1px solid #f1f5f9' }}>
                            ℹ️ {room.priceTriple ? 'This room accommodates up to 3 guests.' : 'This room accommodates up to 2 guests only. If guests search for 3 adults in 1 room, this room cannot be booked. Enter Triple price to allow 3 guests.'}
                          </div>

                          <div style={{ marginBottom: 14 }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                              Room Amenities
                            </label>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              {['AC', 'Free WiFi', 'Room Service', 'Mini Bar', 'TV', 'Balcony', 'Bathtub', 'Coffee Maker', 'Safe'].map(am => {
                                const roomAms = Array.isArray(room.amenities) ? room.amenities : ['AC', 'Free WiFi'];
                                const hasAm = roomAms.includes(am);
                                return (
                                  <label 
                                    key={am} 
                                    style={{ 
                                      display: 'inline-flex', 
                                      alignItems: 'center', 
                                      gap: 6, 
                                      padding: '6px 12px', 
                                      borderRadius: 8, 
                                      border: `1px solid ${hasAm ? '#f97316' : '#cbd5e1'}`, 
                                      background: hasAm ? '#fff7ed' : '#ffffff', 
                                      color: hasAm ? '#ea580c' : '#64748b', 
                                      fontSize: '0.8rem', 
                                      fontWeight: hasAm ? 700 : 500,
                                      cursor: 'pointer' 
                                    }}
                                  >
                                    <input 
                                      type="checkbox" 
                                      checked={hasAm} 
                                      onChange={e => {
                                        const updatedRooms = [...extranetModal.rooms];
                                        const newAms = e.target.checked 
                                          ? [...roomAms, am] 
                                          : roomAms.filter((a: string) => a !== am);
                                        updatedRooms[rIdx].amenities = newAms;
                                        setExtranetModal({...extranetModal, rooms: updatedRooms});
                                      }} 
                                      style={{ accentColor: '#f97316' }} 
                                    />
                                    <span>{am}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#475569', marginBottom: 6 }}>
                                Room Description
                              </label>
                              <textarea 
                                value={room.description || ''} 
                                onChange={e => {
                                  const updatedRooms = [...extranetModal.rooms];
                                  updatedRooms[rIdx].description = e.target.value;
                                  setExtranetModal({...extranetModal, rooms: updatedRooms});
                                }} 
                                rows={3} 
                                placeholder="Spacious room with a king bed and ocean views..." 
                                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }} 
                              />
                            </div>

                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569' }}>
                                  Room Images (Room Photos Only)
                                </label>
                                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                  {(room.images || []).length} photos
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 10, border: '1px solid #cbd5e1', borderRadius: 8, background: '#f8fafc', minHeight: 74 }}>
                                {Array.isArray(room.images) && room.images.map((url: string, pIdx: number) => (
                                  <div key={pIdx} style={{ position: 'relative', width: 70, height: 56, borderRadius: 6, overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0 }}>
                                    <img src={url} alt={`Room ${rIdx} Photo ${pIdx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const updatedRooms = [...extranetModal.rooms];
                                        updatedRooms[rIdx].images = updatedRooms[rIdx].images.filter((_: any, idx: number) => idx !== pIdx);
                                        setExtranetModal({ ...extranetModal, rooms: updatedRooms });
                                      }}
                                      style={{
                                        position: 'absolute',
                                        top: 2,
                                        right: 2,
                                        background: 'rgba(239, 68, 68, 0.85)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: 18,
                                        height: 18,
                                        cursor: 'pointer',
                                        fontSize: '0.7rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                      }}
                                      title="Delete Photo"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}

                                <label style={{
                                  width: 70,
                                  height: 56,
                                  border: '2px dashed #f97316',
                                  borderRadius: 6,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  background: '#fff7ed',
                                  color: '#ea580c',
                                  flexShrink: 0
                                }}>
                                  <span style={{ fontSize: '18px', lineHeight: 1 }}>+</span>
                                  <span style={{ fontSize: '9px', marginTop: 2, fontWeight: 700 }}>Upload</span>
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    disabled={uploadingImage}
                                    onChange={e => handleMultipleImageUpload(e, (urls) => {
                                      const updatedRooms = [...extranetModal.rooms];
                                      const currRoomImgs = updatedRooms[rIdx].images || [];
                                      updatedRooms[rIdx].images = [...currRoomImgs, ...urls];
                                      setExtranetModal({
                                        ...extranetModal,
                                        rooms: updatedRooms
                                      });
                                    })}
                                  />
                                </label>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(!extranetModal.rooms || extranetModal.rooms.length === 0) && (
                        <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', margin: '20px 0' }}>No rooms added yet. Click "+ Add Another Room Type" to create one.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 5: PHOTOS */}
                {extranetModalTab === 'photos' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ background: 'white', padding: 22, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', margin: '0 0 4px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span>📸 Property Photos & Hero Landing Spaces</span>
                            <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 12, fontWeight: 700 }}>
                              {(extranetModal.images || []).length} / 30 Photos
                            </span>
                          </h3>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>
                            Photos added here land directly into the Hero Gallery Spaces on your hotel page and search card. Up to 30 photos supported.
                          </p>
                        </div>

                        <label className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <span>{uploadingImage ? 'Uploading...' : '+ Upload Photos (Up to 30)'}</span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            style={{ display: 'none' }}
                            disabled={uploadingImage}
                            onChange={e => handleMultipleImageUpload(e, (urls) => {
                              const current = [...(extranetModal.images || [])];
                              const combined = [...current, ...urls].slice(0, 30);
                              setExtranetModal({ ...extranetModal, images: combined });
                            })}
                          />
                        </label>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12, marginBottom: 16 }}>
                        <div style={{ position: 'relative', minHeight: 220, borderRadius: 12, overflow: 'hidden', background: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          {extranetModal.images?.[0] ? (
                            <>
                              <img src={extranetModal.images[0]} alt="Space 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(15,23,42,0.85)', color: 'white', padding: '4px 10px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, backdropFilter: 'blur(4px)' }}>
                                ⭐ Space 1 (Main Cover & Card Thumbnail)
                              </div>
                              <button
                                type="button"
                                onClick={() => setExtranetModal({ ...extranetModal, images: extranetModal.images.filter((_: any, idx: number) => idx !== 0) })}
                                style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', fontWeight: 700 }}
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '100%', height: '100%', padding: 16 }}>
                              <span style={{ fontSize: '2.5rem' }}>🏨</span>
                              <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '0.9rem', marginTop: 6 }}>+ Add Space 1 (Main Cover)</span>
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={e => handleMultipleImageUpload(e, (urls) => {
                                  const current = [...(extranetModal.images || [])];
                                  current[0] = urls[0];
                                  setExtranetModal({ ...extranetModal, images: current.filter(Boolean) });
                                })}
                              />
                            </label>
                          )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 12 }}>
                          <div style={{ position: 'relative', minHeight: 104, borderRadius: 12, overflow: 'hidden', background: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {extranetModal.images?.[1] ? (
                              <>
                                <img src={extranetModal.images[1]} alt="Space 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(15,23,42,0.85)', color: 'white', padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>
                                  📷 Space 2 (Top Right)
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setExtranetModal({ ...extranetModal, images: extranetModal.images.filter((_: any, idx: number) => idx !== 1) })}
                                  style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '100%', height: '100%', padding: 8 }}>
                                <span style={{ fontSize: '1.4rem' }}>📷</span>
                                <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.75rem' }}>+ Space 2 (Top Right)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={e => handleMultipleImageUpload(e, (urls) => {
                                    const current = [...(extranetModal.images || [])];
                                    if (current.length === 0) current[0] = urls[0];
                                    else current[1] = urls[0];
                                    setExtranetModal({ ...extranetModal, images: current.filter(Boolean) });
                                  })}
                                />
                              </label>
                            )}
                          </div>

                          <div style={{ position: 'relative', minHeight: 104, borderRadius: 12, overflow: 'hidden', background: '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {extranetModal.images?.[2] ? (
                              <>
                                <img src={extranetModal.images[2]} alt="Space 3" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(15,23,42,0.85)', color: 'white', padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 700 }}>
                                  📷 Space 3 (Bottom Right)
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setExtranetModal({ ...extranetModal, images: extranetModal.images.filter((_: any, idx: number) => idx !== 2) })}
                                  style={{ position: 'absolute', top: 6, right: 6, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', width: '100%', height: '100%', padding: 8 }}>
                                <span style={{ fontSize: '1.4rem' }}>📷</span>
                                <span style={{ fontWeight: 600, color: '#2563eb', fontSize: '0.75rem' }}>+ Space 3 (Bottom Right)</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={e => handleMultipleImageUpload(e, (urls) => {
                                    const current = [...(extranetModal.images || [])];
                                    while (current.length < 2) current.push(urls[0]);
                                    current[2] = urls[0];
                                    setExtranetModal({ ...extranetModal, images: current.filter(Boolean) });
                                  })}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>

                      {(extranetModal.images || []).length > 3 && (
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                            🖼️ Additional Gallery Photos:
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {(extranetModal.images || []).slice(3).map((img: string, subIdx: number) => {
                              const actualIdx = subIdx + 3;
                              return (
                                <div key={actualIdx} style={{ position: 'relative', width: 100, height: 80, borderRadius: 8, overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                                  <img src={img} alt={`Gallery ${actualIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const arr = [...extranetModal.images];
                                      const temp = arr[0];
                                      arr[0] = arr[actualIdx];
                                      arr[actualIdx] = temp;
                                      setExtranetModal({ ...extranetModal, images: arr });
                                    }}
                                    style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none', borderRadius: 4, padding: '2px 4px', fontSize: '0.62rem', cursor: 'pointer', fontWeight: 600 }}
                                  >
                                    Set Cover ⭐
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setExtranetModal({ ...extranetModal, images: extranetModal.images.filter((_: any, idx: number) => idx !== actualIdx) })}
                                    style={{ position: 'absolute', top: 4, right: 4, background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <input
                          type="text"
                          placeholder="Or paste photo URL(s) (comma or enter separated)"
                          id="adminExtranetImagePasteInput"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val) {
                                const urls = val.split(/[,\s\n]+/).map((u: string) => u.trim()).filter(Boolean);
                                setExtranetModal({ ...extranetModal, images: [...(extranetModal.images || []), ...urls].slice(0, 30) });
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                        />
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                          onClick={() => {
                            const input = document.getElementById('adminExtranetImagePasteInput') as HTMLInputElement;
                            if (input && input.value.trim()) {
                              const urls = input.value.trim().split(/[,\s\n]+/).map((u: string) => u.trim()).filter(Boolean);
                              setExtranetModal({ ...extranetModal, images: [...(extranetModal.images || []), ...urls].slice(0, 30) });
                              input.value = '';
                            }
                          }}
                        >
                          + Add URL
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 6: POLICIES */}
                {extranetModalTab === 'policies' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div style={{ background: 'white', padding: 22, borderRadius: 16, border: '1px solid #e2e8f0' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 14, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>📜 Property Policies & Guest Rules</span>
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Cancellation Policy</label>
                          <select 
                            value={extranetModal.cancellationPolicy || 'free_24h'} 
                            onChange={e => setExtranetModal({...extranetModal, cancellationPolicy: e.target.value})} 
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                          >
                            <option value="free_24h">Free Cancellation before 24 hours</option>
                            <option value="non_refundable">Non-Refundable (100% Charge)</option>
                            <option value="flexible_same_day">Flexible (Cancel anytime until 2 PM)</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Couple Friendly</label>
                          <select 
                            value={extranetModal.coupleFriendly !== false ? 'yes' : 'no'} 
                            onChange={e => setExtranetModal({...extranetModal, coupleFriendly: e.target.value === 'yes'})} 
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                          >
                            <option value="yes">Yes (Couples & Unmarried Couples Welcome)</option>
                            <option value="no">Families Only</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Local IDs Accepted</label>
                          <select 
                            value={extranetModal.localIdsAccepted !== false ? 'yes' : 'no'} 
                            onChange={e => setExtranetModal({...extranetModal, localIdsAccepted: e.target.value === 'yes'})} 
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                          >
                            <option value="yes">Yes (Local City IDs Allowed)</option>
                            <option value="no">Outstation Guests Only</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: 4 }}>Pets Policy</label>
                          <select 
                            value={extranetModal.petsAllowed ? 'yes' : 'no'} 
                            onChange={e => setExtranetModal({...extranetModal, petsAllowed: e.target.value === 'yes'})} 
                            style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                          >
                            <option value="no">Pets Not Allowed</option>
                            <option value="yes">Pets Allowed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sticky Footer */}
                <div style={{ position: 'sticky', bottom: 0, background: '#f8fafc', padding: '16px 0', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (confirm(`Permanently delete ${extranetModal.name}?`)) {
                        deleteHotel(extranetModal._id);
                        setExtranetModal(null);
                      }
                    }} 
                    className="btn" 
                    style={{ background: '#fff1f2', color: '#e11d48', border: '1px solid #fecdd3', fontWeight: 700, fontSize: '0.82rem', padding: '8px 14px' }}
                  >
                    🗑️ Delete Property
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {extranetModalTab !== 'property' && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const tabOrder = ['property', 'location', 'amenities', 'rooms', 'photos', 'policies'];
                          const currIdx = tabOrder.indexOf(extranetModalTab);
                          if (currIdx > 0) setExtranetModalTab(tabOrder[currIdx - 1] as any);
                        }} 
                        className="btn btn-outline" 
                        style={{ background: 'white', fontSize: '0.82rem', padding: '8px 14px' }}
                      >
                        ← Prev Tab
                      </button>
                    )}

                    {extranetModalTab !== 'policies' && (
                      <button 
                        type="button" 
                        onClick={() => {
                          const tabOrder = ['property', 'location', 'amenities', 'rooms', 'photos', 'policies'];
                          const currIdx = tabOrder.indexOf(extranetModalTab);
                          if (currIdx < tabOrder.length - 1) setExtranetModalTab(tabOrder[currIdx + 1] as any);
                        }} 
                        className="btn" 
                        style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.82rem', padding: '8px 14px' }}
                      >
                        Next Tab →
                      </button>
                    )}

                    <button type="button" onClick={() => setExtranetModal(null)} className="btn btn-outline" style={{ background: 'white', fontSize: '0.82rem', padding: '8px 16px' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px', fontSize: '0.88rem', fontWeight: 800 }}>Save Changes</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
