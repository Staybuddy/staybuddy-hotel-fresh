"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import DateRangePicker from "@/components/DateRangePicker";
import Image from "next/image";
import {
  calculateBookingPricing,
  calculateMultiRoomPricing,
  adjustRoomsAndAdults,
  getRoomPriceForOccupancy,
  MAX_ADULTS_PER_ROOM,
} from "@/lib/occupancyPricing";

const formatDate = (dateString: string | null) => {
  if (!dateString) return "Select date";
  return new Date(dateString).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const AMENITY_ICONS: Record<string, string> = {
  "Free WiFi": "📶",
  Pool: "🏊",
  Spa: "💆",
  Gym: "💪",
  Restaurant: "🍽️",
  Parking: "🅿️",
  AC: "❄️",
  Bar: "🍸",
  Breakfast: "🍳",
  "Pet Friendly": "🐾",
  Laundry: "👕",
  "Room Service": "🛎️",
};

export default function HotelDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [hotel, setHotel] = useState<any>(null);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [galleryActiveIndex, setGalleryActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [galleryFitMode, setGalleryFitMode] = useState<"contain" | "cover">("contain");
  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedRoomsMap, setSelectedRoomsMap] = useState<Record<string, number>>({});
  const [bookingData, setBookingData] = useState({
    checkIn: searchParams.get("checkIn") || "",
    checkOut: searchParams.get("checkOut") || "",
    guests: "1",
    rooms: parseInt(searchParams.get("rooms") || "1", 10),
    adults: parseInt(searchParams.get("adults") || "2", 10),
    children: parseInt(searchParams.get("children") || "0", 10),
    guestFirstName: "",
    guestLastName: "",
    guestEmail: "",
    guestPhone: "",
    specialRequests: "",
  });
  const [bookingStep, setBookingStep] = useState(0); // 0 = view, 1 = booking form, 2 = success
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [attemptedCheckout, setAttemptedCheckout] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeDateSelection, setActiveDateSelection] = useState<
    "checkIn" | "checkOut"
  >("checkIn");
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showGst, setShowGst] = useState(false);
  const [roomDetailsModal, setRoomDetailsModal] = useState<any>(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const [occupancy, setOccupancy] = useState<"single" | "double" | "triple">(
    "double",
  );
  const [reviewData, setReviewData] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>("");

  useEffect(() => {
    if (id) fetchHotelData();
  }, [id, bookingData.checkIn, bookingData.checkOut]);

  useEffect(() => {
    const checkInParam = searchParams.get("checkIn");
    const checkOutParam = searchParams.get("checkOut");
    if (checkInParam && !bookingData.checkIn) {
      setBookingData(p => ({
        ...p,
        checkIn: checkInParam,
        checkOut: checkOutParam || p.checkOut,
        adults: searchParams.has("adults") ? parseInt(searchParams.get("adults") as string, 10) : p.adults,
        rooms: searchParams.has("rooms") ? parseInt(searchParams.get("rooms") as string, 10) : p.rooms,
        children: searchParams.has("children") ? parseInt(searchParams.get("children") as string, 10) : p.children,
      }));
    }
  }, [searchParams, bookingData.checkIn]);

  useEffect(() => {
    if (session?.user) {
      const nameParts = (session.user?.name || "").split(" ");
      setBookingData((p) => ({
        ...p,
        guestFirstName: nameParts[0] || "",
        guestLastName: nameParts.slice(1).join(" ") || "",
        guestEmail: session.user?.email || "",
        guestPhone: (session.user as any)?.phone || "",
      }));
    }
  }, [session]);

  async function fetchHotelData(cIn?: string, cOut?: string) {
    try {
      const inDate = cIn !== undefined ? cIn : bookingData.checkIn;
      const outDate = cOut !== undefined ? cOut : bookingData.checkOut;
      const query = (inDate && outDate) 
        ? `?checkIn=${encodeURIComponent(inDate)}&checkOut=${encodeURIComponent(outDate)}` 
        : '';
      const res = await fetch(`/api/hotels/${id}${query}`);
      const data = await res.json();
      setHotel(data.hotel);
      setRooms(data.rooms || []);
      setReviews(data.reviews || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const allPhotos = useMemo(() => {
    const list: Array<{ url: string; label: string }> = [
      ...(Array.isArray(hotel?.images) ? hotel.images.map((url: string) => ({ url, label: 'Property Hero Photo' })) : []),
      ...rooms.flatMap((r: any) => 
        Array.isArray(r.images) 
          ? r.images.map((url: string) => ({ url, label: r.type || 'Room Photo' }))
          : []
      )
    ].filter((p: any) => typeof p.url === 'string' && p.url.trim().length > 0);

    const map = new Map<string, { url: string; label: string }>();
    list.forEach(p => {
      if (!map.has(p.url)) map.set(p.url, p);
    });
    return Array.from(map.values());
  }, [hotel?.images, rooms]);

  const openPhotoViewer = (index: number) => {
    if (allPhotos.length === 0) return;
    setGalleryActiveIndex(Math.max(0, Math.min(index, allPhotos.length - 1)));
    setShowGalleryModal(true);
  };

  // Lock body scroll when photo modal or room details is open
  useEffect(() => {
    if (showGalleryModal || roomDetailsModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showGalleryModal, roomDetailsModal]);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setTouchEndX(null);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 45;
    if (distance > minSwipeDistance) {
      // Swiped left -> next photo
      setGalleryActiveIndex((prev) => (prev + 1) % (allPhotos.length || 1));
    } else if (distance < -minSwipeDistance) {
      // Swiped right -> previous photo
      setGalleryActiveIndex((prev) => (prev - 1 + allPhotos.length) % (allPhotos.length || 1));
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  useEffect(() => {
    if (!showGalleryModal) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowGalleryModal(false);
      if (e.key === "ArrowRight") {
        setGalleryActiveIndex((prev) => (prev + 1) % (allPhotos.length || 1));
      }
      if (e.key === "ArrowLeft") {
        setGalleryActiveIndex((prev) => (prev - 1 + allPhotos.length) % (allPhotos.length || 1));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showGalleryModal, allPhotos.length]);

  useEffect(() => {
    if (!showGalleryModal || !isAutoPlaying || allPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setGalleryActiveIndex((prev) => (prev + 1) % allPhotos.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [showGalleryModal, isAutoPlaying, allPhotos.length]);

  const totalSelectedRoomsCount = useMemo(() => {
    return Object.values(selectedRoomsMap).reduce((sum, count) => sum + (count || 0), 0);
  }, [selectedRoomsMap]);

  const selectedRoomsList = useMemo(() => {
    return rooms
      .filter((r) => (selectedRoomsMap[r._id] || 0) > 0)
      .map((r) => ({
        room: r,
        quantity: selectedRoomsMap[r._id] || 0,
        pricePerNight: getRoomPriceForOccupancy(
          r,
          Math.min(3, Math.max(1, Math.round(bookingData.adults / Math.max(1, bookingData.rooms))))
        ),
      }));
  }, [rooms, selectedRoomsMap, bookingData.adults, bookingData.rooms]);

  // Keep selectedRoom in sync with the first selected room
  useEffect(() => {
    if (selectedRoomsList.length > 0) {
      setSelectedRoom(selectedRoomsList[0].room);
    }
  }, [selectedRoomsList]);

  // If bookingData.rooms decreases, cap total selected rooms
  useEffect(() => {
    setSelectedRoomsMap((prev) => {
      const total = Object.values(prev).reduce((a, b) => a + (b || 0), 0);
      if (total <= bookingData.rooms) return prev;
      const next: Record<string, number> = {};
      let remaining = bookingData.rooms;
      for (const [rId, qty] of Object.entries(prev)) {
        if (remaining <= 0) break;
        const keep = Math.min(qty, remaining);
        if (keep > 0) next[rId] = keep;
        remaining -= keep;
      }
      return next;
    });
  }, [bookingData.rooms]);

  const handleAddRoom = (room: any) => {
    if (!room) return;
    if (bookingData.rooms === 1) {
      setSelectedRoomsMap({ [room._id]: 1 });
      setSelectedRoom(room);
      return;
    }

    if (totalSelectedRoomsCount >= bookingData.rooms) return;

    setSelectedRoomsMap((prev) => ({
      ...prev,
      [room._id]: (prev[room._id] || 0) + 1,
    }));
    if (!selectedRoom) setSelectedRoom(room);
  };

  const handleRemoveRoom = (room: any) => {
    if (!room) return;
    setSelectedRoomsMap((prev) => {
      const cur = prev[room._id] || 0;
      if (cur <= 1) {
        const next = { ...prev };
        delete next[room._id];
        return next;
      }
      return { ...prev, [room._id]: cur - 1 };
    });
  };

  const handleSelectAllOfRoom = (room: any) => {
    if (!room) return;
    setSelectedRoomsMap({ [room._id]: bookingData.rooms });
    setSelectedRoom(room);
  };

  const getRoomPrice = (room: any) => {
    if (!room) return 0;
    const occPerRoom = Math.min(3, Math.max(1, Math.round(bookingData.adults / Math.max(1, bookingData.rooms))));
    return getRoomPriceForOccupancy(room, occPerRoom);
  };

  async function handleBooking() {
    if (!session) {
      router.push("/login");
      return;
    }
    setAttemptedCheckout(true);
    setBookingError("");
    setBookingLoading(true);

    const nights = Math.ceil(
      (new Date(bookingData.checkOut).getTime() -
        new Date(bookingData.checkIn).getTime()) /
        86400000,
    );
    if (nights < 1) {
      setBookingError("Check-out must be after check-in");
      setBookingLoading(false);
      return;
    }

    if (
      !bookingData.guestFirstName ||
      !bookingData.guestLastName ||
      !bookingData.guestEmail ||
      !bookingData.guestPhone
    ) {
      setBookingError(
        "Please fill in all required Guest Details (First Name, Last Name, Email, and Mobile Number).",
      );
      setBookingLoading(false);
      return;
    }

    const calculatedPricing = selectedRoomsList.length > 0
      ? calculateMultiRoomPricing(selectedRoomsList, bookingData.adults, nights)
      : calculateBookingPricing(
          selectedRoom,
          bookingData.adults,
          bookingData.rooms,
          nights
        );

    if (!calculatedPricing.canBook) {
      setBookingError(
        calculatedPricing.validationError ||
        "The selected room configuration cannot accommodate the requested number of guests. Please adjust your room selection."
      );
      setBookingLoading(false);
      return;
    }

    const primaryRoom = selectedRoomsList[0]?.room || selectedRoom;
    const selectedRoomsPayload = selectedRoomsList.length > 0
      ? selectedRoomsList.map((sr) => ({
          roomId: sr.room._id,
          roomType: sr.room.type,
          quantity: sr.quantity,
        }))
      : [{
          roomId: primaryRoom?._id,
          roomType: primaryRoom?.type,
          quantity: bookingData.rooms,
        }];

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: (session.user as any).id,
        hotelId: id,
        roomId: primaryRoom._id,
        rooms: bookingData.rooms,
        adults: bookingData.adults,
        guests: bookingData.adults + (bookingData.children || 0),
        occupancy: bookingData.adults === 1 ? 'single' : (bookingData.adults === 3 ? 'triple' : 'double'),
        selectedRooms: selectedRoomsPayload,
        roomBreakdowns: calculatedPricing.roomBreakdowns,
        occupancySummary: calculatedPricing.summaryText,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guestName: `${bookingData.guestFirstName} ${bookingData.guestLastName}`.trim(),
        guestEmail: bookingData.guestEmail,
        guestPhone: bookingData.guestPhone,
        specialRequests: bookingData.specialRequests,
        status: 'pending',
        paymentStatus: 'pending',
        gstRegistrationNo: (bookingData as any).gstRegistrationNo,
        gstCompanyName: (bookingData as any).gstCompanyName,
        gstCompanyAddress: (bookingData as any).gstCompanyAddress,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setBookingError(data.error || "Booking failed");
      setBookingLoading(false);
      return;
    }

    const orderRes = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: data.booking._id }),
    });
    
    const orderData = await orderRes.json();
    if (!orderRes.ok) {
      setBookingError(orderData.error || "Failed to initiate payment");
      setBookingLoading(false);
      return;
    }

    const actualOrder = orderData.order || orderData;

    const hotelIdDisplay = orderData.hotelId || hotel.hotelId || hotel._id?.slice(-8) || hotel._id;
    const bookingCode = orderData.bookingCode || data.booking?.bookingId || data.booking?._id;
    const formattedAmount = orderData.formattedAmount || `₹${Math.round(actualOrder.amount / 100).toLocaleString('en-IN')}`;
    const auditDescription = orderData.auditDescription || `Hotel ID: ${hotelIdDisplay} | Booking: ${bookingCode} | ${formattedAmount}`;

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tjoj98t74vGXMx', 
      amount: actualOrder.amount,
      currency: "INR",
      name: "StayBuddy",
      description: auditDescription,
      order_id: actualOrder.id,
      notes: orderData.notes || {
        "Hotel ID": String(hotelIdDisplay),
        "Booking ID": String(bookingCode),
        "Amount": formattedAmount,
        "Hotel Name": String(hotel.name || '').slice(0, 50),
        "Audit Note": auditDescription,
        bookingId: String(data.booking._id),
        hotelId: String(hotel._id)
      },
      handler: async function (response: any) {
        const verifyRes = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id || actualOrder.id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature || '',
            bookingId: data.booking._id
          })
        });
        const verifyData = await verifyRes.json();
        if(verifyRes.ok) {
           setConfirmedBookingId(data.booking._id);
           setBookingStep(2);
        } else {
           setBookingError(verifyData.error || "Payment verification failed");
        }
        setBookingLoading(false);
      },
      prefill: {
        name: `${bookingData.guestFirstName} ${bookingData.guestLastName}`.trim(),
        email: bookingData.guestEmail,
        contact: bookingData.guestPhone
      },
      modal: {
        ondismiss: async function () {
          // If customer paid on PhonePe/UPI and pressed back or closed modal,
          // immediately recheck with Razorpay API in the background!
          try {
            const recheckRes = await fetch('/api/payments/recheck', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bookingId: data.booking._id })
            });
            const recheckData = await recheckRes.json();
            if (recheckData.verified) {
              setConfirmedBookingId(data.booking._id);
              setBookingStep(2);
              return;
            }
          } catch (e) {
            console.warn('Auto-recheck on modal dismiss:', e);
          }
          setBookingLoading(false);
        }
      },
      theme: { color: "#2563eb" }
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (response: any){
      setBookingError(response.error.description);
      setBookingLoading(false);
    });
    rzp.open();
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      setReviewError("Please sign in to leave a review.");
      return;
    }
    setSubmittingReview(true);
    setReviewError("");
    setReviewSuccess("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId: id,
          rating: reviewData.rating,
          title: reviewData.title,
          comment: reviewData.comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit review");

      setReviewSuccess("Thank you! Your review has been published and the hotel rating has been updated.");
      setReviewData({ rating: 5, title: "", comment: "" });
      fetchHotelData();
      setTimeout(() => {
        setShowReviewModal(false);
        setReviewSuccess("");
      }, 2000);
    } catch (err: any) {
      setReviewError(err.message);
    } finally {
      setSubmittingReview(false);
    }
  }



  useEffect(() => {
    const handlePopState = () => {
      if (window.location.hash !== "#review") {
        setBookingStep(0);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const openReview = (room?: any) => {
    if (!bookingData.checkIn || !bookingData.checkOut) {
      const bar = document.getElementById("availability-bar");
      if (bar) {
        bar.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setShowDatePicker(true), 500);
      }
      return;
    }
    if (room) {
      if (bookingData.rooms === 1 || totalSelectedRoomsCount === 0) {
        setSelectedRoomsMap({ [room._id]: bookingData.rooms });
        setSelectedRoom(room);
      }
    }
    if (bookingData.rooms > 1 && totalSelectedRoomsCount < bookingData.rooms && !room) {
      const roomSection = document.getElementById("rooms-section");
      if (roomSection) roomSection.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setBookingStep(1);
    setTimeout(() => window.scrollTo(0, 0), 10);
    window.history.pushState(
      null,
      "",
      window.location.pathname + window.location.search + "#review",
    );
  };

  const closeReview = () => {
    if (window.location.hash === "#review") {
      window.history.back();
    } else {
      setBookingStep(0);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const nights =
    bookingData.checkIn && bookingData.checkOut
      ? Math.max(
          1,
          Math.ceil(
            (new Date(bookingData.checkOut).getTime() -
              new Date(bookingData.checkIn).getTime()) /
              86400000,
          ),
        )
      : 1;

  const currentPricing = useMemo(() => {
    if (selectedRoomsList.length > 0) {
      return calculateMultiRoomPricing(
        selectedRoomsList,
        bookingData.adults,
        nights
      );
    }
    return calculateBookingPricing(
      selectedRoom,
      bookingData.adults,
      bookingData.rooms,
      nights
    );
  }, [selectedRoomsList, selectedRoom, bookingData.adults, bookingData.rooms, nights]);

  if (loading)
    return (
      <div>
        <Navbar />
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "60vh",
          }}
        >
          <div className="spinner" style={{ width: 48, height: 48 }} />
        </div>
      </div>
    );

  if (!hotel)
    return (
      <div>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 20px" }}>
          <h2>Hotel not found</h2>
          <Link
            href="/hotels"
            className="btn btn-primary"
            style={{ marginTop: 16, display: "inline-flex" }}
          >
            Browse Hotels
          </Link>
        </div>
      </div>
    );

  return (
    <div>
      <Navbar />

      <div style={{ display: bookingStep === 0 ? "block" : "none" }}>
        {/* Breadcrumb */}
        <div className="container" style={{ paddingTop: "var(--space-3)" }}>
          <div
            className="breadcrumb"
            style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
          >
            <Link
              href="/"
              style={{ color: "var(--brand-600)", textDecoration: "none" }}
            >
              Home
            </Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <Link
              href="/hotels"
              style={{ color: "var(--brand-600)", textDecoration: "none" }}
            >
              Hotels
            </Link>
            <span style={{ margin: "0 6px" }}>/</span>
            <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
              {hotel.name}
            </span>
          </div>
        </div>

        {/* NEW Top Title Bar */}
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "var(--space-4)",
            paddingBottom: "var(--space-4)",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
              {hotel.name}
            </h1>
            <div style={{ color: "#f59e0b", fontSize: "1rem" }}>
              {"⭐".repeat(hotel.starRating || 4)}
            </div>
            {hotel.avgRating > 0 ? (
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--brand-50)", color: "var(--brand-700)", padding: "4px 10px", borderRadius: "12px", border: "1px solid var(--brand-200)", fontSize: "0.85rem", fontWeight: 700 }}>
                <span>★ {hotel.avgRating.toFixed(1)}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 500 }}>({hotel.totalReviews || reviews.length} {((hotel.totalReviews || reviews.length) === 1 ? 'review' : 'reviews')})</span>
              </div>
            ) : (
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", background: "#f8fafc", padding: "4px 8px", borderRadius: "12px", border: "1px solid #e2e8f0", fontWeight: 600 }}>
                ⭐ New Property
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              style={{
                padding: "8px 16px",
                background: "white",
                border: "1px solid #cbd5e1",
                borderRadius: 24,
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "#0f172a",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f8fafc")
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
              </svg>
              Add to Wishlist
            </button>
          </div>
        </div>

        {/* Main Grid Wrapper */}
        <div
          className="container hotel-details-grid"
          style={{
            gap: 20,
            alignItems: "flex-start",
            paddingBottom: "var(--space-8)",
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Left Column */}
          <div style={{ minWidth: 0, width: "100%", maxWidth: "100%", boxSizing: "border-box" }}>
            {/* Hero Images Gallery */}
            <div style={{ marginBottom: 16 }}>
              {(() => {
                const displayPhotos = [
                  ...(Array.isArray(hotel.images) ? hotel.images : []),
                  ...rooms.flatMap((r: any) => Array.isArray(r.images) ? r.images : [])
                ].filter((url: any) => typeof url === 'string' && url.trim().length > 0);

                const currentHeroPhoto = displayPhotos[activeHeroIndex % (displayPhotos.length || 1)] || displayPhotos[0] || null;
                const photo1 = displayPhotos[1] || displayPhotos[0] || null;
                const photo2 = displayPhotos[2] || displayPhotos[1] || displayPhotos[0] || null;

                return (
                  <div
                    className="hotel-gallery-grid"
                    style={{
                      gap: "16px",
                      borderRadius: "24px",
                      overflow: "hidden",
                      height: 400,
                      position: "relative",
                    }}
                  >
                    {/* Space 1: Main Hero Photo with Click to View & Live Carousel Arrows */}
                    <div
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        cursor: "pointer",
                      }}
                      onClick={() => openPhotoViewer(activeHeroIndex % (displayPhotos.length || 1))}
                    >
                      {currentHeroPhoto ? (
                        <>
                          <Image
                            src={currentHeroPhoto}
                            alt={hotel.name}
                            fill
                            sizes="(max-width: 768px) 100vw, 66vw"
                            style={{ objectFit: "cover" }}
                            unoptimized
                            priority
                          />
                          {displayPhotos.length > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveHeroIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
                                }}
                                style={{
                                  position: "absolute",
                                  left: 12,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  background: "rgba(15, 23, 42, 0.75)",
                                  backdropFilter: "blur(6px)",
                                  color: "white",
                                  border: "1px solid rgba(255,255,255,0.2)",
                                  borderRadius: "50%",
                                  width: 40,
                                  height: 40,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "1.4rem",
                                  zIndex: 4,
                                  transition: "all 0.2s",
                                }}
                                title="Previous Photo"
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveHeroIndex((prev) => (prev + 1) % displayPhotos.length);
                                }}
                                style={{
                                  position: "absolute",
                                  right: 12,
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  background: "rgba(15, 23, 42, 0.75)",
                                  backdropFilter: "blur(6px)",
                                  color: "white",
                                  border: "1px solid rgba(255,255,255,0.2)",
                                  borderRadius: "50%",
                                  width: 40,
                                  height: 40,
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontSize: "1.4rem",
                                  zIndex: 4,
                                  transition: "all 0.2s",
                                }}
                                title="Next Photo"
                              >
                                ›
                              </button>
                              <div
                                style={{
                                  position: "absolute",
                                  bottom: 12,
                                  left: 12,
                                  background: "rgba(15, 23, 42, 0.75)",
                                  backdropFilter: "blur(6px)",
                                  color: "white",
                                  padding: "4px 10px",
                                  borderRadius: 20,
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  zIndex: 3,
                                }}
                              >
                                📷 {(activeHeroIndex % displayPhotos.length) + 1} / {displayPhotos.length}
                              </div>
                            </>
                          )}
                        </>
                      ) : (
                        <div style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                          <span style={{ fontSize: "3.5rem" }}>🏨</span>
                          <span style={{ color: "#64748b", fontWeight: 700, fontSize: "0.95rem" }}>{hotel.name}</span>
                          <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>Hero Main Photo Space</span>
                        </div>
                      )}
                    </div>

                    {/* Right Column: Space 2 & 3 */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateRows: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      {[photo1, photo2].map((imgSrc, idx) => (
                        <div
                          key={idx}
                          style={{ position: "relative", overflow: "hidden", cursor: "pointer" }}
                          onClick={() => openPhotoViewer(idx + 1)}
                        >
                          {imgSrc ? (
                            <Image
                              src={imgSrc}
                              alt={`${hotel.name} ${idx + 2}`}
                              fill
                              sizes="(max-width: 768px) 100vw, 33vw"
                              style={{ objectFit: "cover" }}
                              unoptimized
                            />
                          ) : (
                            <div style={{ background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)", width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              <span style={{ fontSize: "2rem" }}>📷</span>
                              <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>Photo Space {idx + 2}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {displayPhotos.length > 0 && (
                      <button
                        type="button"
                        className="hotel-gallery-view-btn"
                        onClick={() => openPhotoViewer(0)}
                        style={{
                          position: "absolute",
                          bottom: 16,
                          right: 16,
                          background: "rgba(15, 23, 42, 0.8)",
                          backdropFilter: "blur(8px)",
                          color: "white",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: "12px",
                          padding: "8px 16px",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                          zIndex: 5,
                        }}
                      >
                        📷 View All Photos ({displayPhotos.length})
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Description */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>About Property</h3>
              </div>
              <div className="card-body">
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem", margin: 0 }}>
                  {hotel.description || "Experience a wonderful stay at our property, offering premium amenities and excellent service. Perfectly located for both business and leisure travelers."}
                </p>
              </div>
            </div>

            {/* Amenities */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Amenities</h3>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {hotel.amenities?.map((amenity: string, idx: number) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: "1.2rem" }}>{AMENITY_ICONS[amenity] || "✨"}</span>
                      <span style={{ fontSize: "0.95rem", color: "var(--text-primary)", fontWeight: 500 }}>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* House Rules */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>House Rules</h3>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>Check-in</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>From 12:00 PM</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>Check-out</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Until 11:00 AM</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>Cancellation</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>Free before 24 hours</span>
                </div>
              </div>
            </div>
            {/* Location / Map */}
            {hotel.coordinates?.lat && hotel.coordinates?.lng && (
              <div className="card" style={{ marginBottom: 16, overflow: "hidden" }}>
                <div className="card-header" style={{ padding: "12px 16px" }}>
                  <h3 style={{ fontSize: "1rem", margin: 0, fontWeight: 700 }}>Location & Map</h3>
                </div>
                <div
                  className="card-body"
                  style={{
                    padding: 0,
                    overflow: "hidden",
                    height: 280,
                    position: "relative",
                  }}
                >
                  <iframe
                    width="100%"
                    height="100%"
                    style={{
                      border: 0,
                      width: "100%",
                      height: "100%",
                      minHeight: 280,
                      display: "block",
                    }}
                    loading="lazy"
                    allowFullScreen
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://maps.google.com/maps?q=${hotel.coordinates.lat},${hotel.coordinates.lng}&hl=es;z=14&output=embed`}
                  ></iframe>
                </div>
              </div>
            )}

            {/* Date & Guest Selection Bar */}
            <div
              className="card availability-selection-bar"
              id="availability-bar"
              style={{
                marginBottom: 16,
                padding: "14px 16px",
                display: "flex",
                gap: 12,
                alignItems: "center",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  flex: 1,
                  background: "white",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 16px",
                  cursor: "pointer",
                  border: "1px solid var(--border)",
                  position: "relative",
                }}
              >
                <div
                  onClick={() => {
                    setShowDatePicker(!showDatePicker);
                    setActiveDateSelection("checkIn");
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--text-secondary)",
                      textTransform: "uppercase",
                    }}
                  >
                    Dates
                  </div>
                  <div
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color:
                        bookingData.checkIn || bookingData.checkOut
                          ? "var(--text-primary)"
                          : "var(--text-muted)",
                    }}
                  >
                    {bookingData.checkIn
                      ? formatDate(bookingData.checkIn)
                      : "Check In"}{" "}
                    -{" "}
                    {bookingData.checkOut
                      ? formatDate(bookingData.checkOut)
                      : "Check Out"}
                  </div>
                </div>

                {showDatePicker && (
                  <>
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 90 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDatePicker(false);
                      }}
                    />
                    <div
                      className="responsive-popup"
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: 12,
                        zIndex: 100,
                        background: "white",
                        borderRadius: "var(--radius-xl)",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                        padding: "16px",
                        border: "1px solid var(--border)",
                        width: "max-content",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DateRangePicker
                        checkIn={bookingData.checkIn}
                        checkOut={bookingData.checkOut}
                        onChange={(inDate, outDate) =>
                          setBookingData((p) => ({
                            ...p,
                            checkIn: inDate,
                            checkOut: outDate,
                          }))
                        }
                        onClose={() => setShowDatePicker(false)}
                        activeSelection={activeDateSelection}
                        setActiveSelection={setActiveDateSelection}
                      />
                    </div>
                  </>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  background: "white",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 16px",
                  cursor: "pointer",
                  border: "1px solid var(--border)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--text-secondary)",
                    textTransform: "uppercase",
                  }}
                >
                  Guests
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                  onClick={() => setShowGuestPicker(!showGuestPicker)}
                >
                  {bookingData.rooms} Room, {bookingData.adults} Adults
                </div>

                {showGuestPicker && (
                  <>
                    <div
                      style={{ position: "fixed", inset: 0, zIndex: 90 }}
                      onClick={() => setShowGuestPicker(false)}
                    />
                    <div
                      className="responsive-popup"
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        marginTop: 12,
                        zIndex: 100,
                        background: "white",
                        borderRadius: "var(--radius-lg)",
                        boxShadow: "var(--shadow-xl)",
                        border: "1px solid var(--border)",
                        padding: "var(--space-5)",
                        width: 320,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--space-4)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--text-primary)",
                              }}
                            >
                              Rooms
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              Max 3 adults / room
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-md)",
                              padding: "4px 8px",
                            }}
                          >
                            <button
                              className="btn-ghost"
                              style={{
                                padding: "4px 8px",
                                fontSize: "1.2rem",
                                lineHeight: 1,
                              }}
                              onClick={() =>
                                setBookingData((p) => {
                                  const adj = adjustRoomsAndAdults(p.rooms, p.adults, 'rooms', p.rooms - 1);
                                  return { ...p, rooms: adj.rooms, adults: adj.adults };
                                })
                              }
                            >
                              −
                            </button>
                            <span
                              style={{
                                fontWeight: 700,
                                width: 20,
                                textAlign: "center",
                              }}
                            >
                              {bookingData.rooms}
                            </span>
                            <button
                              className="btn-ghost"
                              style={{
                                padding: "4px 8px",
                                fontSize: "1.2rem",
                                lineHeight: 1,
                              }}
                              onClick={() =>
                                setBookingData((p) => {
                                  const adj = adjustRoomsAndAdults(p.rooms, p.adults, 'rooms', Math.min(10, p.rooms + 1));
                                  return { ...p, rooms: adj.rooms, adults: adj.adults };
                                })
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--text-primary)",
                              }}
                            >
                              Adults
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                              Max {bookingData.rooms * MAX_ADULTS_PER_ROOM} for {bookingData.rooms} room{bookingData.rooms > 1 ? "s" : ""}
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              border: "1px solid var(--border)",
                              borderRadius: "var(--radius-md)",
                              padding: "4px 8px",
                            }}
                          >
                            <button
                              className="btn-ghost"
                              style={{
                                padding: "4px 8px",
                                fontSize: "1.2rem",
                                lineHeight: 1,
                              }}
                              onClick={() =>
                                setBookingData((p) => {
                                  const adj = adjustRoomsAndAdults(p.rooms, p.adults, 'adults', Math.max(1, p.adults - 1));
                                  return { ...p, rooms: adj.rooms, adults: adj.adults };
                                })
                              }
                            >
                              −
                            </button>
                            <span
                              style={{
                                fontWeight: 700,
                                width: 20,
                                textAlign: "center",
                              }}
                            >
                              {bookingData.adults}
                            </span>
                            <button
                              className="btn-ghost"
                              style={{
                                padding: "4px 8px",
                                fontSize: "1.2rem",
                                lineHeight: 1,
                              }}
                              onClick={() =>
                                setBookingData((p) => {
                                  const adj = adjustRoomsAndAdults(p.rooms, p.adults, 'adults', Math.min(30, p.adults + 1));
                                  return { ...p, rooms: adj.rooms, adults: adj.adults };
                                })
                              }
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: '#1e40af',
                          fontSize: '0.75rem',
                          lineHeight: 1.3
                        }}>
                          💡 <strong>Max 3 adults per room.</strong> Adding 4 or more adults automatically calculates rooms and occupancy pricing.
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Rooms */}
            <div
              className="card"
              id="rooms-section"
              style={{ marginBottom: 16 }}
            >
              <div className="card-header">
                <h3 style={{ fontSize: "1rem" }}>Available Rooms</h3>
              </div>
              <div
                className="card-body"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-4)",
                }}
              >
                {bookingData.rooms > 1 && (
                  <div
                    style={{
                      background: totalSelectedRoomsCount === bookingData.rooms ? "#ecfdf5" : "#eff6ff",
                      border: `1px solid ${totalSelectedRoomsCount === bookingData.rooms ? "#a7f3d0" : "#bfdbfe"}`,
                      borderRadius: "var(--radius-md)",
                      padding: "14px 16px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 6,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "1.2rem" }}>
                          {totalSelectedRoomsCount === bookingData.rooms ? "🎉" : "🛏️"}
                        </span>
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: "0.95rem",
                            color: totalSelectedRoomsCount === bookingData.rooms ? "#065f46" : "#1e40af",
                          }}
                        >
                          {totalSelectedRoomsCount === bookingData.rooms
                            ? `All ${bookingData.rooms} Rooms Selected (${currentPricing.roomSummaryText})`
                            : `Select ${bookingData.rooms} Rooms: ${totalSelectedRoomsCount} of ${bookingData.rooms} Selected`}
                        </span>
                      </div>

                      <div
                        style={{
                          background: totalSelectedRoomsCount === bookingData.rooms ? "#059669" : "#2563eb",
                          color: "white",
                          padding: "3px 10px",
                          borderRadius: "var(--radius-full)",
                          fontWeight: 700,
                          fontSize: "0.8rem",
                        }}
                      >
                        {totalSelectedRoomsCount} / {bookingData.rooms} Chosen
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: totalSelectedRoomsCount === bookingData.rooms ? "#047857" : "#3b82f6",
                      }}
                    >
                      {totalSelectedRoomsCount === bookingData.rooms ? (
                        <span>
                          ✓ Perfect! You can proceed to booking with this room combination, or modify below.
                        </span>
                      ) : (
                        <span>
                          You can choose mixed room types (e.g., 1 Standard + 1 Deluxe) or choose both in the same room category.
                          {" "}
                          <strong>({bookingData.rooms - totalSelectedRoomsCount} more room{bookingData.rooms - totalSelectedRoomsCount > 1 ? "s" : ""} needed)</strong>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {rooms.length === 0 ? (
                  <p
                    style={{
                      color: "var(--text-muted)",
                      textAlign: "center",
                      padding: "20px 0",
                    }}
                  >
                    No rooms available
                  </p>
                ) : (
                  rooms.map((room) => {
                    const allocatedCount = selectedRoomsMap[room._id] || 0;
                    const unitPrice = getRoomPrice(room);
                    const isCardSelected = allocatedCount > 0 || (bookingData.rooms === 1 && selectedRoom?._id === room._id);

                    return (
                      <div
                        key={room._id}
                        className="room-card"
                        style={{
                          border: `2px solid ${isCardSelected ? "var(--brand-500)" : "var(--border)"}`,
                          borderRadius: "var(--radius-lg)",
                          padding: "var(--space-4)",
                          transition: "all 0.3s ease",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          gap: "var(--space-4)",
                          background: isCardSelected ? "var(--brand-50)" : "transparent",
                        }}
                        onClick={() => {
                          setRoomDetailsModal(room);
                          setModalImageIndex(0);
                        }}
                      >
                        <div className="room-card-grid">
                          {room.images?.[0] ? (
                            <div
                              className="room-card-thumbnail"
                              onClick={(e) => {
                                e.stopPropagation();
                                const foundIdx = allPhotos.findIndex(p => p.url === room.images[0]);
                                openPhotoViewer(foundIdx >= 0 ? foundIdx : 0);
                              }}
                              title="Click to view full photo gallery"
                            >
                              <Image
                                src={room.images[0]}
                                alt={room.type}
                                fill
                                style={{
                                  objectFit: "cover",
                                }}
                                unoptimized
                              />
                              {room.images.length > 1 && (
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: 8,
                                    right: 8,
                                    background: "rgba(15, 23, 42, 0.85)",
                                    color: "white",
                                    fontSize: "0.72rem",
                                    fontWeight: 700,
                                    padding: "3px 8px",
                                    borderRadius: 6,
                                    backdropFilter: "blur(4px)",
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
                                  }}
                                >
                                  📷 {room.images.length} Photos
                                </div>
                              )}
                            </div>
                          ) : null}
                          <div className="room-card-info" style={{ minWidth: 0 }}>
                            {allocatedCount > 0 && (
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6,
                                  background: "#eff6ff",
                                  color: "#1d4ed8",
                                  border: "1px solid #bfdbfe",
                                  padding: "2px 8px",
                                  borderRadius: 4,
                                  fontWeight: 700,
                                  fontSize: "0.75rem",
                                  marginBottom: 6,
                                  width: "fit-content",
                                }}
                              >
                                <span>✓</span> {allocatedCount} {allocatedCount > 1 ? "Rooms" : "Room"} Selected
                              </div>
                            )}
                            <h4 style={{ marginBottom: 4 }}>{room.type}</h4>
                            <p
                              style={{
                                color: "var(--text-muted)",
                                fontSize: "0.875rem",
                                marginBottom: 8,
                              }}
                            >
                              {room.description}
                            </p>
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                                fontSize: "0.8rem",
                                color: "var(--text-secondary)",
                              }}
                            >
                              <span>🛏️ {room.bedType}</span>
                              {(() => {
                                const hasTriple = Boolean(room.priceTriple && Number(room.priceTriple) > 0);
                                const maxCap = hasTriple ? 3 : 2;
                                return (
                                  <span style={{ fontWeight: 600 }}>
                                    👥 Max {maxCap} guests {hasTriple ? '(1-3 Guests)' : '(1-2 Guests Only)'}
                                  </span>
                                );
                              })()}
                              {room.size && <span>📐 {room.size} m²</span>}
                              {Boolean(bookingData.rooms === 1 && bookingData.adults === 3 && !(Number(room.priceTriple) > 0)) && (
                                <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  ⚠️ 3-Occupancy Not Available (Max 2 Guests)
                                </span>
                              )}
                              {room.ratePlan === 'CP' ? (
                                <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  🍳 Free Breakfast Included
                                </span>
                              ) : room.ratePlan === 'MAP' ? (
                                <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  🍽️ Breakfast & Dinner Included
                                </span>
                              ) : room.ratePlan === 'AP' ? (
                                <span style={{ backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  🍴 All Meals Included
                                </span>
                              ) : (
                                <span style={{ backgroundColor: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: 4, fontWeight: 600, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  ☕ Room Only (No Breakfast)
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="room-card-action" style={{ textAlign: "right", flexShrink: 0 }}>
                            <div>
                              <div
                                style={{
                                  fontSize: "1.3rem",
                                  fontWeight: 800,
                                  color: "var(--brand-600)",
                                }}
                              >
                                ₹{unitPrice.toLocaleString()}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "var(--text-muted)",
                                }}
                              >
                                {bookingData.rooms > 1
                                  ? allocatedCount > 1
                                    ? `₹${(unitPrice * allocatedCount).toLocaleString()} for ${allocatedCount} rooms`
                                    : "per room / night"
                                  : "per night"}
                              </div>
                            </div>

                            {bookingData.rooms === 1 ? (
                              Boolean(bookingData.adults === 3 && !(Number(room.priceTriple) > 0)) ? (
                                <button
                                  type="button"
                                  disabled={true}
                                  className="btn btn-sm"
                                  style={{ marginTop: 8, background: '#e2e8f0', color: '#64748b', cursor: 'not-allowed', border: 'none', fontWeight: 700 }}
                                  title="3-occupancy is not offered for this room. Max 2 guests allowed."
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  Max 2 Guests Only
                                </button>
                              ) : (
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{ marginTop: 8 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedRoom(room);
                                    setSelectedRoomsMap({ [room._id]: 1 });
                                  }}
                                >
                                  {selectedRoom?._id === room._id ? "Selected ✓" : "Select"}
                                </button>
                              )
                            ) : (
                              <div style={{ marginTop: 8, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                                {allocatedCount > 0 ? (
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                      background: "white",
                                      border: "2px solid var(--brand-500)",
                                      borderRadius: "var(--radius-md)",
                                      padding: "2px 4px",
                                    }}
                                  >
                                    <button
                                      type="button"
                                      className="btn-ghost"
                                      style={{
                                        width: 28,
                                        height: 28,
                                        padding: 0,
                                        fontSize: "1.1rem",
                                        fontWeight: 800,
                                        color: "var(--brand-600)",
                                        cursor: "pointer",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveRoom(room);
                                      }}
                                      title="Remove 1 room"
                                    >
                                      −
                                    </button>
                                    <span
                                      style={{
                                        fontWeight: 800,
                                        fontSize: "0.9rem",
                                        minWidth: 20,
                                        textAlign: "center",
                                        color: "var(--brand-700)",
                                      }}
                                    >
                                      {allocatedCount}
                                    </span>
                                    <button
                                      type="button"
                                      className="btn-ghost"
                                      style={{
                                        width: 28,
                                        height: 28,
                                        padding: 0,
                                        fontSize: "1.1rem",
                                        fontWeight: 800,
                                        color:
                                          totalSelectedRoomsCount >= bookingData.rooms
                                            ? "#94a3b8"
                                            : "var(--brand-600)",
                                        cursor:
                                          totalSelectedRoomsCount >= bookingData.rooms
                                            ? "not-allowed"
                                            : "pointer",
                                      }}
                                      disabled={totalSelectedRoomsCount >= bookingData.rooms}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddRoom(room);
                                      }}
                                      title={
                                        totalSelectedRoomsCount >= bookingData.rooms
                                          ? `All ${bookingData.rooms} rooms selected`
                                          : "Add 1 room"
                                      }
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    disabled={totalSelectedRoomsCount >= bookingData.rooms}
                                    style={{
                                      opacity: totalSelectedRoomsCount >= bookingData.rooms ? 0.6 : 1,
                                      cursor:
                                        totalSelectedRoomsCount >= bookingData.rooms
                                          ? "not-allowed"
                                          : "pointer",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddRoom(room);
                                    }}
                                    title={
                                      totalSelectedRoomsCount >= bookingData.rooms
                                        ? `All ${bookingData.rooms} rooms already selected`
                                        : "Select this room"
                                    }
                                  >
                                    + Add Room
                                  </button>
                                )}

                                {bookingData.rooms > 1 &&
                                  allocatedCount < bookingData.rooms &&
                                  totalSelectedRoomsCount < bookingData.rooms && (
                                    <button
                                      type="button"
                                      style={{
                                        background: "none",
                                        border: "none",
                                        padding: 0,
                                        color: "var(--brand-600)",
                                        fontSize: "0.72rem",
                                        fontWeight: 700,
                                        textDecoration: "underline",
                                        cursor: "pointer",
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectAllOfRoom(room);
                                      }}
                                    >
                                      Select all {bookingData.rooms} here
                                    </button>
                                  )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Reviews */}
            <div className="card" id="reviews-section" style={{ marginTop: 24 }}>
              <div
                className="card-header"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "1.1rem", margin: 0, fontWeight: 800 }}>Guest Reviews</h3>
                  {hotel.avgRating > 0 ? (
                    <span
                      style={{
                        background: "var(--brand-500)",
                        color: "white",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.85rem",
                      }}
                    >
                      ★ {hotel.avgRating.toFixed(1)} / 5 ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        background: "#f1f5f9",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontWeight: 600,
                      }}
                    >
                      ⭐ New Property (0 reviews)
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => {
                    if (!session) {
                      router.push('/login?callbackUrl=' + encodeURIComponent(window.location.pathname));
                      return;
                    }
                    setShowReviewModal(true);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontWeight: 700,
                    padding: "6px 14px",
                    borderRadius: "20px",
                  }}
                >
                  ⭐ Write a Review
                </button>
              </div>

              <div
                className="card-body"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-5)",
                }}
              >
                {reviews.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "32px 16px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📝</div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", color: "#0f172a" }}>
                      No reviews yet for {hotel.name}
                    </div>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 6, maxWidth: 450, margin: "6px auto 0 auto" }}>
                      StayBuddy calculates property ratings strictly from verified guest reviews. Guests can share their genuine feedback after check-in or checkout!
                    </div>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div
                      key={review._id}
                      style={{
                        paddingBottom: "var(--space-5)",
                        borderBottom: "1px solid var(--border-light)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: "50%",
                              background:
                                "linear-gradient(135deg, var(--brand-400), var(--brand-600))",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: 700,
                              fontSize: "0.875rem",
                            }}
                          >
                            {(review.customerId?.name || "G")[0]}
                          </div>
                          <div>
                            <div
                              style={{ fontWeight: 600, fontSize: "0.9rem" }}
                            >
                              {review.customerId?.name || "Guest"}
                            </div>
                            <div
                              style={{
                                fontSize: "0.75rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              {new Date(review.createdAt).toLocaleDateString(
                                "en-IN",
                                { month: "long", year: "numeric" },
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            background: "var(--brand-500)",
                            color: "white",
                            fontWeight: 700,
                            padding: "2px 10px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "0.875rem",
                            height: "fit-content",
                          }}
                        >
                          {"⭐".repeat(review.rating)}
                        </div>
                      </div>
                      <p
                        style={{
                          fontWeight: 600,
                          marginBottom: 4,
                          fontSize: "0.9rem",
                        }}
                      >
                        {review.title}
                      </p>
                      <p
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.875rem",
                          lineHeight: 1.6,
                        }}
                      >
                        {review.comment}
                      </p>
                      {review.reply && (
                        <div
                          style={{
                            marginTop: 10,
                            padding: "10px 14px",
                            background: "var(--bg-secondary)",
                            borderRadius: "var(--radius-md)",
                            borderLeft: "3px solid var(--brand-400)",
                          }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: "0.8rem",
                              color: "var(--brand-700)",
                              marginBottom: 4,
                            }}
                          >
                            🏨 Management Response
                          </div>
                          <p
                            style={{
                              fontSize: "0.85rem",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {review.reply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Write Review Modal */}
            {showReviewModal && (
              <>
                <div
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    zIndex: 9999,
                  }}
                  onClick={() => setShowReviewModal(false)}
                />
                <div
                  style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "white",
                    padding: "28px",
                    borderRadius: "16px",
                    zIndex: 10000,
                    width: "90%",
                    maxWidth: 500,
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <h2 style={{ fontSize: "1.25rem", margin: 0, fontWeight: 800 }}>Review {hotel.name}</h2>
                    <button
                      type="button"
                      onClick={() => setShowReviewModal(false)}
                      style={{
                        background: "none",
                        border: "none",
                        fontSize: "1.3rem",
                        cursor: "pointer",
                        color: "#64748b",
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {reviewSuccess && (
                    <div className="alert alert-success" style={{ marginBottom: 16 }}>
                      {reviewSuccess}
                    </div>
                  )}
                  {reviewError && (
                    <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                      {reviewError}
                    </div>
                  )}

                  <form onSubmit={submitReview} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 6, display: "block" }}>
                        Rating (1 to 5 Stars)
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            type="button"
                            key={num}
                            onClick={() => setReviewData((p) => ({ ...p, rating: num }))}
                            style={{
                              background: "none",
                              border: "none",
                              fontSize: "2rem",
                              cursor: "pointer",
                              opacity: reviewData.rating >= num ? 1 : 0.25,
                              transition: "opacity 0.15s ease",
                            }}
                          >
                            ⭐
                          </button>
                        ))}
                        <span style={{ alignSelf: "center", marginLeft: 8, fontWeight: 700, color: "var(--brand-600)" }}>
                          {reviewData.rating}.0 / 5.0
                        </span>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 6, display: "block" }}>
                        Title
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="e.g. Wonderful stay, courteous staff!"
                        value={reviewData.title}
                        onChange={(e) => setReviewData((p) => ({ ...p, title: e.target.value }))}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" style={{ fontWeight: 700, fontSize: "0.85rem", marginBottom: 6, display: "block" }}>
                        Your Review
                      </label>
                      <textarea
                        className="form-input"
                        rows={4}
                        required
                        placeholder="Share details about your room, cleanliness, amenities, and hospitality..."
                        value={reviewData.comment}
                        onChange={(e) => setReviewData((p) => ({ ...p, comment: e.target.value }))}
                      />
                    </div>

                    <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setShowReviewModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={submittingReview}
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>


          {/* Right: Booking Panel */}
          <div style={{ position: "sticky", top: 80 }}>
            {/* Location Card (Moved from left) */}
            <div
              className="card"
              style={{
                marginBottom: 16,
                padding: "16px 20px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-xl)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 4,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--brand-600)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span
                  style={{ fontSize: "1.25rem", color: "var(--text-primary)" }}
                >
                  {hotel.city}
                </span>
              </div>
              <div
                style={{
                  fontSize: "1.05rem",
                  color: "var(--text-secondary)",
                  marginLeft: 32,
                  marginBottom: 16,
                }}
              >
                {hotel.address}
              </div>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(`${hotel.name}, ${hotel.address}, ${hotel.city}`)}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "1rem",
                  padding: "14px",
                  borderRadius: "var(--radius-md)",
                  textDecoration: "none",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                Get Directions
              </a>
            </div>

            {bookingStep === 0 &&
              (() => {
                if (totalSelectedRoomsCount === 0 && !selectedRoom) {
                  return (
                    <div
                      className="card"
                      style={{
                        padding: "32px 24px",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 16,
                      }}
                    >
                      <div style={{ fontSize: "3rem" }}>🛏️</div>
                      <h3
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: 800,
                          margin: 0,
                        }}
                      >
                        {bookingData.rooms > 1 ? `Select ${bookingData.rooms} Rooms` : "Select a Room"}
                      </h3>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-secondary)",
                          margin: 0,
                        }}
                      >
                        {bookingData.rooms > 1
                          ? `Please choose ${bookingData.rooms} rooms from the available options (you can mix categories like Standard and Deluxe or choose both the same).`
                          : "Please choose a room category from the available options to view pricing and continue with your booking."}
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          const el = document.getElementById("rooms-section");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Browse Rooms ↓
                      </button>
                    </div>
                  );
                }

                const displayRoom = selectedRoomsList[0]?.room || selectedRoom;

                return (
                  <div className="card" style={{ padding: "var(--space-5)" }}>
                    <div
                      style={{
                        color: "var(--success)",
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        marginBottom: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#dcfce7",
                        padding: "6px 10px",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          background: "var(--success)",
                          display: "inline-block",
                        }}
                      />
                      {displayRoom.availableRooms !== undefined ? displayRoom.availableRooms : displayRoom.staybuddyAllocation || 1} Rooms Available • Live Instant API Confirmation
                    </div>

                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        fontWeight: 600,
                        marginBottom: 8,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        style={{ marginRight: 6, verticalAlign: "middle" }}
                      >
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      {bookingData.rooms > 1 ? "Multi-Room Occupancy Breakdown:" : "Select Room Occupancy:"}
                    </div>

                    {bookingData.rooms > 1 ? (
                      <div
                        style={{
                          background: "#eff6ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: "var(--radius-md)",
                          padding: "12px 14px",
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1d4ed8" }}>
                            {bookingData.rooms} Rooms for {bookingData.adults} Adults
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowGuestPicker(true)}
                            style={{
                              background: "white",
                              border: "1px solid #93c5fd",
                              color: "#2563eb",
                              padding: "3px 10px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.75rem",
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            ✏️ Edit Guests/Rooms
                          </button>
                        </div>

                        {selectedRoomsList.length > 0 && (
                          <div
                            style={{
                              borderBottom: "1px dashed #bfdbfe",
                              paddingBottom: 8,
                              marginBottom: 8,
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                            }}
                          >
                            {selectedRoomsList.map((item, idx) => {
                              const roomTypeTotal = currentPricing.roomBreakdowns
                                ?.filter((rb) => rb.roomId === item.room._id)
                                .reduce((sum, rb) => sum + rb.pricePerNight, 0) || (item.pricePerNight * item.quantity);
                              return (
                                <div
                                  key={idx}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "0.85rem",
                                    fontWeight: 600,
                                    color: "#1e293b",
                                  }}
                                >
                                  <span>
                                    {item.quantity} × {item.room.type}
                                  </span>
                                  <span style={{ color: "var(--brand-600)", fontWeight: 700 }}>
                                    ₹{roomTypeTotal.toLocaleString()}/night
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <div
                          style={{
                            fontSize: "0.82rem",
                            color: "#1e40af",
                            fontWeight: 600,
                            marginBottom: 6,
                          }}
                        >
                          Allocation: {currentPricing.summaryText || `${bookingData.rooms} Rooms`}
                        </div>

                        {totalSelectedRoomsCount < bookingData.rooms ? (
                          <div
                            style={{
                              fontSize: "0.78rem",
                              color: "#b45309",
                              background: "#fef3c7",
                              padding: "6px 8px",
                              borderRadius: 4,
                              fontWeight: 700,
                              marginTop: 6,
                            }}
                          >
                            ⚠️ Select {bookingData.rooms - totalSelectedRoomsCount} more room(s) from the room list to complete booking.
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              borderTop: "1px dashed #bfdbfe",
                              paddingTop: 6,
                            }}
                          >
                            Rule: Max 3 adults per room. Price automatically accounts for all {bookingData.rooms} rooms and {bookingData.adults} guests.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 8,
                          marginBottom: 20,
                        }}
                      >
                        {["single", "double", "triple"].map((occ) => {
                          const p =
                            occ === "single"
                              ? displayRoom.priceSingle
                              : occ === "triple"
                                ? displayRoom.priceTriple
                                : displayRoom.priceDouble ||
                                  displayRoom.priceSingle;
                          if (!p) return null;
                          return (
                            <div
                              key={occ}
                              onClick={() => {
                                setOccupancy(occ as any);
                                const adultCount = occ === "single" ? 1 : occ === "triple" ? 3 : 2;
                                setBookingData((prev) => ({ ...prev, adults: adultCount }));
                              }}
                              style={{
                                border:
                                  occupancy === occ
                                    ? "2px solid #2563eb"
                                    : "1px solid var(--border)",
                                borderRadius: "var(--radius-md)",
                                padding: "8px 4px",
                                textAlign: "center",
                                cursor: "pointer",
                                background:
                                  occupancy === occ ? "#eff6ff" : "white",
                                transition: "all 0.2s",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                  color:
                                    occupancy === occ
                                      ? "#1d4ed8"
                                      : "var(--text-primary)",
                                  textTransform: "capitalize",
                                }}
                              >
                                {occ} Room {occ === "double" && "⭐"}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  fontWeight: 700,
                                  marginTop: 4,
                                }}
                              >
                                ₹{p.toLocaleString()}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "2.5rem",
                          fontWeight: 900,
                          lineHeight: 1,
                        }}
                      >
                        ₹{currentPricing.basePricePerNight.toLocaleString()}
                      </div>
                      <div
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.9rem",
                          paddingBottom: 4,
                        }}
                      >
                        Per Night {bookingData.rooms > 1 ? `(${bookingData.rooms} Rooms, ${bookingData.adults} Adults)` : `(${occupancy.toUpperCase()} OCCUPANCY)`}
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        marginBottom: 20,
                      }}
                    >
                      + Verified Live B2B Guaranteed Rate (18% Margin Applied)
                    </p>

                    <div
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        marginBottom: 20,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      Free Cancellation till 24 hrs before check in
                    </div>

                    {!currentPricing.canBook && (
                      <div
                        style={{
                          background: "#fef2f2",
                          border: "1px solid #fecaca",
                          color: "#991b1b",
                          padding: "10px 14px",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          marginBottom: 16,
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>⚠️</span>
                        <span>{currentPricing.validationError || "Room capacity exceeded for requested guests."}</span>
                      </div>
                    )}

                    {bookingData.rooms > 1 && totalSelectedRoomsCount < bookingData.rooms ? (
                      <button
                        className="btn"
                        style={{
                          width: "100%",
                          fontSize: "1rem",
                          padding: "14px",
                          background: "#94a3b8",
                          color: "white",
                          border: "none",
                          marginBottom: 20,
                          textTransform: "uppercase",
                          fontWeight: 800,
                          cursor: "pointer",
                          borderRadius: "var(--radius-md)",
                        }}
                        onClick={() => {
                          const el = document.getElementById("rooms-section");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Select {bookingData.rooms - totalSelectedRoomsCount} More Room{bookingData.rooms - totalSelectedRoomsCount > 1 ? "s" : ""}
                      </button>
                    ) : !currentPricing.canBook ? (
                      <button
                        className="btn"
                        disabled={true}
                        style={{
                          width: "100%",
                          fontSize: "0.95rem",
                          padding: "14px",
                          background: "#e2e8f0",
                          color: "#64748b",
                          border: "none",
                          marginBottom: 20,
                          fontWeight: 800,
                          cursor: "not-allowed",
                          borderRadius: "var(--radius-md)",
                        }}
                      >
                        🚫 Cannot Book: Capacity Exceeded
                      </button>
                    ) : (
                      <button
                        className="btn"
                        style={{
                          width: "100%",
                          fontSize: "1.1rem",
                          padding: "14px",
                          background: "#f97316",
                          color: "white",
                          border: "none",
                          marginBottom: 20,
                          textTransform: "uppercase",
                          fontWeight: 800,
                          cursor: "pointer",
                          borderRadius: "var(--radius-md)",
                          boxShadow: "0 4px 12px rgba(249, 115, 22, 0.3)",
                        }}
                        onClick={() => {
                          openReview(displayRoom);
                        }}
                      >
                        🚀 Book {bookingData.rooms > 1 ? `${bookingData.rooms} Rooms Now` : "This Now"}
                      </button>
                    )}

                    <div
                      style={{
                        border: "1px dashed #f59e0b",
                        borderRadius: "var(--radius-md)",
                        padding: "16px",
                        display: "flex",
                        gap: 16,
                        alignItems: "center",
                        background: "#fffbeb",
                      }}
                    >
                      <div
                        style={{
                          background: "#f59e0b",
                          color: "white",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          padding: "6px 12px",
                          borderRadius: "var(--radius-sm)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Live Confirmed Inventory
                      </div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "#92400e",
                          fontWeight: 600,
                        }}
                      >
                        Your room is reserved instantly through our direct B2B
                        inventory channel.
                      </div>
                    </div>
                  </div>
                );
              })()}
          </div>
        </div>
      </div>
    {bookingStep === 1 && selectedRoom && (
      <div
              id="review-section"
              style={{
                background: "#f1f5f9",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                width: "100%",
                height: "100%",
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  width: "100%",
                  background: "white",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "center",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                }}
              >
                <div
                  className="review-header-inner container"
                  style={{
                    width: "100%",
                    maxWidth: "1100px",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <button
                      onClick={closeReview}
                      className="btn btn-outline"
                      style={{
                        padding: "6px 16px",
                        fontSize: "0.9rem",
                        borderRadius: "var(--radius-md)",
                        background: "#f8fafc",
                        border: "1px solid var(--border)",
                      }}
                    >
                      ← Back
                    </button>
                    <h2
                      style={{ fontSize: "1.4rem", margin: 0, fontWeight: 800 }}
                    >
                      Review your Booking
                    </h2>
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <div
                      style={{
                        background: "#ecfdf5",
                        color: "var(--success)",
                        padding: "6px 16px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      ✓ 100% Refundable & Secure StayBuddy Guarantee
                    </div>
                  </div>
                </div>
              </div>

              {/* BODY CONTAINER */}
              <div
                className="review-booking-grid container"
                style={{
                  width: "100%",
                  maxWidth: "1100px",
                }}
              >
                {/* LEFT COLUMN */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div
                    className="card"
                    style={{
                      padding: "20px",
                      display: "flex",
                      justifyContent: "space-between",
                      borderRadius: "var(--radius-lg)",
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontSize: "1.5rem",
                          marginBottom: 4,
                          fontWeight: 800,
                        }}
                      >
                        {hotel.name}
                      </h3>
                      <div
                        style={{
                          color: "var(--brand-500)",
                          fontSize: "0.9rem",
                          marginBottom: 8,
                        }}
                      >
                        {"⭐".repeat(hotel.starRating)}
                      </div>
                      <div
                        style={{
                          color: "var(--text-muted)",
                          fontSize: "0.85rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          fontWeight: 600,
                        }}
                      >
                        {hotel.city}
                      </div>
                    </div>
                    {hotel.images?.[0] && (
                      <Image
                        src={hotel.images[0]}
                        alt={hotel.name}
                        width={140}
                        height={90}
                        style={{
                          objectFit: "cover",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                        }}
                      />
                    )}
                  </div>

                  <div
                    className="card review-booking-dates-card"
                    style={{
                      padding: "20px",
                      borderRadius: "var(--radius-lg)",
                    }}
                  >
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              color: "var(--brand-600)",
                              textTransform: "uppercase",
                              marginBottom: 4,
                            }}
                          >
                            CHECK IN ✏️
                          </div>
                          <div
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: 800,
                              color: "var(--text-primary)",
                            }}
                          >
                            {bookingData.checkIn
                              ? new Date(
                                  bookingData.checkIn,
                                ).toLocaleDateString("en-GB", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "var(--text-secondary)",
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            {hotel.checkInTime || "12:00 PM"}
                          </div>
                        </div>

                        <div
                          style={{
                            background: "#eff6ff",
                            border: "1px solid #bfdbfe",
                            padding: "6px 16px",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.8rem",
                            fontWeight: 800,
                            color: "#1e40af",
                            alignSelf: "center",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                          }}
                        >
                          {nights} NIGHT{nights > 1 ? "S" : ""}
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              color: "var(--brand-600)",
                              textTransform: "uppercase",
                              marginBottom: 4,
                            }}
                          >
                            CHECK OUT ✏️
                          </div>
                          <div
                            style={{
                              fontSize: "1.2rem",
                              fontWeight: 800,
                              color: "var(--text-primary)",
                            }}
                          >
                            {bookingData.checkOut
                              ? new Date(
                                  bookingData.checkOut,
                                ).toLocaleDateString("en-GB", {
                                  weekday: "short",
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "-"}
                          </div>
                          <div
                            style={{
                              fontSize: "0.9rem",
                              color: "var(--text-secondary)",
                              fontWeight: 600,
                              marginTop: 2,
                            }}
                          >
                            {hotel.checkOutTime || "11:00 AM"}
                          </div>
                        </div>
                      </div>

                      <hr
                        style={{
                          border: "none",
                          borderTop: "1px dashed var(--border)",
                          margin: "4px 0",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                          {nights} Night{nights > 1 ? "s" : ""} |{" "}
                          {bookingData.adults} Adult
                          {bookingData.adults > 1 ? "s" : ""} |{" "}
                          {bookingData.rooms} Room
                          {bookingData.rooms > 1 ? "s" : ""}
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => {
                              closeReview();
                              setShowDatePicker(true);
                            }}
                            style={{
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              color: "var(--success)",
                              padding: "4px 12px",
                              borderRadius: "var(--radius-full)",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            ✏️ Edit Dates
                          </button>
                          <button
                            onClick={() => {
                              closeReview();
                              setShowGuestPicker(true);
                            }}
                            style={{
                              background: "#eff6ff",
                              border: "1px solid #bfdbfe",
                              color: "var(--brand-600)",
                              padding: "4px 12px",
                              borderRadius: "var(--radius-full)",
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            ✏️ Edit Guests
                          </button>
                        </div>
                      </div>
                    </div>

                    <div
                      className="review-booking-dates-addon"
                      style={{
                        background: "#eff6ff",
                        borderRadius: "var(--radius-md)",
                        padding: "16px",
                        border: "1px solid #bfdbfe",
                      }}
                    >
                      <h4
                        style={{
                          color: "var(--brand-700)",
                          fontSize: "0.95rem",
                          fontWeight: 800,
                          margin: 0,
                        }}
                      >
                        Guaranteed Early Check-in/Late Check-out
                      </h4>
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--brand-600)",
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        Opt for guaranteed early check-in/late check-out at an
                        extra cost
                      </p>
                      <button
                        style={{
                          marginTop: "auto",
                          background: "white",
                          border: "1px solid var(--brand-400)",
                          color: "var(--brand-600)",
                          padding: "6px",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Add Time Slot
                      </button>
                    </div>
                  </div>

                  <div
                    className="card"
                    style={{
                      padding: "20px",
                      borderRadius: "var(--radius-lg)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: "1.25rem",
                            fontWeight: 800,
                            marginBottom: 4,
                          }}
                        >
                          {currentPricing.roomSummaryText || selectedRoom?.type || "Rooms"} {bookingData.rooms > 1 && !currentPricing.roomSummaryText ? `(${bookingData.rooms} Rooms)` : ""}
                        </h3>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {bookingData.adults} Adult{bookingData.adults > 1 ? "s" : ""}
                          {bookingData.rooms > 1 && currentPricing.summaryText
                            ? ` • ${currentPricing.summaryText}`
                            : ` • ${occupancy.toUpperCase()} OCCUPANCY`}
                        </div>
                      </div>
                      <a
                        href="#"
                        style={{
                          color: "var(--brand-600)",
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        See Inclusions
                      </a>
                    </div>

                    {selectedRoomsList.length > 1 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          padding: "10px 14px",
                          background: "#f8fafc",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid var(--border)",
                          marginBottom: 14,
                        }}
                      >
                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                          Room Breakdown:
                        </div>
                        {selectedRoomsList.map((item, idx) => {
                          const roomTypeTotal = currentPricing.roomBreakdowns
                            ?.filter((rb) => rb.roomId === item.room._id)
                            .reduce((sum, rb) => sum + rb.pricePerNight, 0) || (item.pricePerNight * item.quantity);
                          return (
                            <div
                              key={idx}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.88rem",
                              }}
                            >
                              <span style={{ fontWeight: 700 }}>
                                {item.quantity} × {item.room.type}
                              </span>
                              <span style={{ color: "var(--brand-600)", fontWeight: 700 }}>
                                ₹{roomTypeTotal.toLocaleString()}/night
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        margin: 0,
                        fontSize: "0.9rem",
                        color: "var(--text-secondary)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <li
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>•</span> Room With Free Cancellation |{" "}
                        <strong style={{ color: "var(--text-primary)" }}>
                          {selectedRoom.ratePlan || "EP"}
                        </strong>
                      </li>
                      <li
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>⏱️</span> Early Check-In upto 2 hours (subject to
                        availability)
                      </li>
                      <li
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>☕</span> 5% off on Food & Beverages with
                        a-la-carte selection
                      </li>
                    </ul>
                  </div>

                  {/* REFUND TIMELINE */}
                  <div
                    className="card"
                    style={{
                      padding: "20px",
                      borderRadius: "var(--radius-lg)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ color: "var(--success)" }}>
                        100% Refund
                      </span>
                      <span style={{ color: "#d97706" }}>Non Refundable</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        height: "8px",
                        borderRadius: "4px",
                        overflow: "hidden",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{ flex: 1, background: "var(--success)" }}
                      ></div>
                      <div
                        style={{ width: "40px", background: "#fef08a" }}
                      ></div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      <div>
                        <strong style={{ color: "var(--text-primary)" }}>
                          NOW
                        </strong>
                        <br />
                        Pay ₹0
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <strong style={{ color: "var(--text-primary)" }}>
                          {bookingData.checkIn
                            ? new Date(
                                new Date(bookingData.checkIn).getTime() -
                                  2 * 24 * 60 * 60 * 1000,
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })
                            : "21 Jul"}
                        </strong>
                        <br />
                        11:59 PM (Pay remaining amount)
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <strong style={{ color: "var(--text-primary)" }}>
                          {bookingData.checkIn
                            ? new Date(
                                new Date(bookingData.checkIn).getTime() -
                                  24 * 60 * 60 * 1000,
                              ).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })
                            : "22 Jul"}
                        </strong>
                        <br />
                        12:59 PM
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <strong style={{ color: "var(--text-primary)" }}>
                          {bookingData.checkIn
                            ? new Date(bookingData.checkIn).toLocaleDateString(
                                "en-GB",
                                { day: "numeric", month: "short" },
                              )
                            : "23 Jul"}
                        </strong>
                        <br />
                        12:59 PM Check-in
                      </div>
                    </div>
                  </div>

                  {/* GUEST DETAILS CARD */}
                  <div
                    className="card"
                    style={{
                      padding: "24px",
                      borderRadius: "var(--radius-lg)",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.5rem",
                        fontWeight: 800,
                        color: "#1e293b",
                        marginBottom: 24,
                      }}
                    >
                      Guest Details
                    </h3>

                    <div className="guest-form-row" style={{ marginBottom: 20 }}>
                      <div style={{ width: "90px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            marginBottom: 8,
                          }}
                        >
                          Title
                        </label>
                        <select
                          style={{
                            width: "100%",
                            padding: "12px 10px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: "1rem",
                            color: "#334155",
                            backgroundColor: "#fff",
                            outline: "none",
                            appearance: "none",
                            backgroundImage:
                              "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23334155%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "right 8px center",
                            backgroundSize: "16px",
                          }}
                        >
                          <option>Mr</option>
                          <option>Mrs</option>
                          <option>Ms</option>
                        </select>
                      </div>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            marginBottom: 8,
                          }}
                        >
                          First Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="First Name"
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: "1rem",
                            color: "#334155",
                            outline: "none",
                            borderColor:
                              attemptedCheckout && !bookingData.guestFirstName
                                ? "#ef4444"
                                : "#cbd5e1",
                          }}
                          value={bookingData.guestFirstName}
                          onChange={(e) =>
                            setBookingData((p) => ({
                              ...p,
                              guestFirstName: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            marginBottom: 8,
                          }}
                        >
                          Last Name <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Last Name"
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: "1rem",
                            color: "#334155",
                            outline: "none",
                            borderColor:
                              attemptedCheckout && !bookingData.guestLastName
                                ? "#ef4444"
                                : "#cbd5e1",
                          }}
                          value={bookingData.guestLastName}
                          onChange={(e) =>
                            setBookingData((p) => ({
                              ...p,
                              guestLastName: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="guest-form-row" style={{ marginBottom: 24 }}>
                      <div style={{ flex: 1.1 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            marginBottom: 8,
                          }}
                        >
                          Email Address{" "}
                          <span style={{ color: "#ef4444" }}>*</span>{" "}
                          <span
                            style={{
                              textTransform: "none",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              color: "#64748b",
                            }}
                          >
                            (Booking voucher will be sent to this email ID)
                          </span>
                        </label>
                        <input
                          type="email"
                          placeholder="Email"
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            borderRadius: 8,
                            border: "1px solid #cbd5e1",
                            fontSize: "1rem",
                            color: "#334155",
                            outline: "none",
                            borderColor:
                              attemptedCheckout && !bookingData.guestEmail
                                ? "#ef4444"
                                : "#cbd5e1",
                          }}
                          value={
                            bookingData.guestEmail || session?.user?.email || ""
                          }
                          onChange={(e) =>
                            setBookingData((p) => ({
                              ...p,
                              guestEmail: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div style={{ flex: 0.9 }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            marginBottom: 8,
                          }}
                        >
                          Mobile Number{" "}
                          <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            borderRadius: 8,
                            border: `1px solid ${
                              attemptedCheckout && !bookingData.guestPhone
                                ? "#ef4444"
                                : "#cbd5e1"
                            }`,
                            backgroundColor: "#fff",
                            overflow: "hidden",
                          }}
                        >
                          <select
                            style={{
                              width: "70px",
                              padding: "12px 8px 12px 12px",
                              border: "none",
                              borderRight: "1px solid #cbd5e1",
                              fontSize: "1rem",
                              color: "#334155",
                              backgroundColor: "transparent",
                              outline: "none",
                              appearance: "none",
                              backgroundImage:
                                "url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23334155%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')",
                              backgroundRepeat: "no-repeat",
                              backgroundPosition: "right 4px center",
                              backgroundSize: "14px",
                            }}
                          >
                            <option>+91</option>
                          </select>
                          <input
                            type="tel"
                            placeholder="Contact Number"
                            style={{
                              flex: 1,
                              padding: "12px 16px",
                              border: "none",
                              fontSize: "1rem",
                              color: "#334155",
                              outline: "none",
                              backgroundColor: "transparent",
                            }}
                            value={bookingData.guestPhone}
                            onChange={(e) =>
                              setBookingData((p) => ({
                                ...p,
                                guestPhone: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginBottom: showGst ? 16 : 24,
                      }}
                    >
                      <input
                        type="checkbox"
                        id="gst-checkbox"
                        checked={showGst}
                        onChange={(e) => setShowGst(e.target.checked)}
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          accentColor: "#0284c7",
                          cursor: "pointer",
                        }}
                      />
                      <label
                        htmlFor="gst-checkbox"
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#1e293b",
                          cursor: "pointer",
                          userSelect: "none",
                        }}
                      >
                        Enter GST Details{" "}
                        <span
                          style={{
                            color: "#94a3b8",
                            fontWeight: 500,
                          }}
                        >
                          (Optional)
                        </span>
                      </label>
                    </div>

                    {showGst && (
                      <div className="guest-form-row" style={{ marginBottom: 24 }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>
                            REGISTRATION NUMBER
                          </label>
                          <input
                            type="text"
                            placeholder="Enter Registration No."
                            style={{
                              width: "100%", padding: "12px 16px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: "1rem", color: "#334155", outline: "none",
                            }}
                            value={(bookingData as any).gstRegistrationNo || ""}
                            onChange={(e) => setBookingData(p => ({ ...p, gstRegistrationNo: e.target.value }))}
                          />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>
                            REGISTERED COMPANY NAME
                          </label>
                          <input
                            type="text"
                            placeholder="Enter Company Name"
                            style={{
                              width: "100%", padding: "12px 16px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: "1rem", color: "#334155", outline: "none",
                            }}
                            value={(bookingData as any).gstCompanyName || ""}
                            onChange={(e) => setBookingData(p => ({ ...p, gstCompanyName: e.target.value }))}
                          />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                          <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 8 }}>
                            REGISTERED COMPANY ADDRESS
                          </label>
                          <input
                            type="text"
                            placeholder="Enter Company Address"
                            style={{
                              width: "100%", padding: "12px 16px", borderRadius: 4, border: "1px solid #cbd5e1", fontSize: "1rem", color: "#334155", outline: "none",
                            }}
                            value={(bookingData as any).gstCompanyAddress || ""}
                            onChange={(e) => setBookingData(p => ({ ...p, gstCompanyAddress: e.target.value }))}
                          />
                        </div>
                      </div>
                    )}

                    <button
                      style={{
                        color: "#0284c7",
                        background: "none",
                        border: "none",
                        fontWeight: 700,
                        fontSize: "1.05rem",
                        cursor: "pointer",
                        padding: 0,
                        marginBottom: 24,
                      }}
                    >
                      + Add Guest
                    </button>

                    {session && (
                      <div
                        style={{
                          background: "#ecfdf5",
                          color: "#065f46",
                          padding: "12px 16px",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.9rem",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 8,
                          wordBreak: "break-word",
                        }}
                      >
                        <span style={{ flexShrink: 0 }}>✅</span> 
                        <div style={{ minWidth: 0 }}>
                          Logged in as {session?.user?.email || (session?.user as any)?.phone || session?.user?.name}.
                          Traveller details prefilled & secret deals active!
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div
                    className="card price-breakup-card"
                    style={{
                      borderRadius: "var(--radius-lg)",
                      maxWidth: "100%",
                      overflow: "hidden",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "1.3rem",
                        marginBottom: 20,
                        fontWeight: 800,
                      }}
                    >
                      Price Breakup
                    </h3>

                    <div
                      className="price-breakup-rows"
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 16,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "0.95rem",
                              color: "var(--text-primary)",
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            Base Price
                            <span
                              style={{
                                fontSize: "0.7rem",
                                background: "#fef08a",
                                color: "#854d0e",
                                padding: "2px 8px",
                                borderRadius: "var(--radius-full)",
                                fontWeight: 600,
                              }}
                            >
                              Limited Time Sale
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                              marginTop: 4,
                            }}
                          >
                            {bookingData.rooms} Room{bookingData.rooms > 1 ? "s" : ""} x {nights} Night
                            {nights > 1 ? "s" : ""}
                            {currentPricing.summaryText && (
                              <div
                                style={{
                                  color: "#2563eb",
                                  marginTop: 3,
                                  fontSize: "0.75rem",
                                  fontWeight: 600,
                                }}
                              >
                                {currentPricing.summaryText}
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                          ₹{currentPricing.originalPriceBeforeDiscount.toLocaleString()}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          color: "var(--success)",
                          fontWeight: 700,
                          fontSize: "0.95rem",
                        }}
                      >
                        <div>Discount by Property (15%)</div>
                        <div>
                          - ₹{currentPricing.discountAmount.toLocaleString()}
                        </div>
                      </div>

                      <hr
                        style={{
                          border: "none",
                          borderTop: "1px dashed var(--border)",
                          margin: "4px 0",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          fontWeight: 800,
                          fontSize: "1.1rem",
                        }}
                      >
                        <div>Price after Discount</div>
                        <div>
                          ₹{currentPricing.priceAfterDiscount.toLocaleString()}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          color: "var(--text-muted)",
                          fontSize: "0.9rem",
                        }}
                      >
                        <div>Taxes & Service Fees (5% GST) ℹ️</div>
                        <div>
                          ₹{currentPricing.gstAmount.toLocaleString()}
                        </div>
                      </div>

                      <hr
                        style={{
                          border: "none",
                          borderTop: "1px solid var(--border)",
                          margin: "4px 0",
                        }}
                      />

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>
                          Total Amount to be paid
                        </div>
                        <div
                          style={{
                            fontSize: "1.5rem",
                            fontWeight: 800,
                            color: "var(--text-primary)",
                          }}
                        >
                          ₹{currentPricing.totalAmount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        background: "#ecfdf5",
                        color: "var(--success)",
                        padding: "12px",
                        borderRadius: "var(--radius-md)",
                        textAlign: "center",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        marginTop: 16,
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      🎉 You save ₹{currentPricing.savingsAmount.toLocaleString()}{" "}
                      on this booking!
                    </div>

                    {bookingError && (
                      <div
                        className="alert alert-error"
                        style={{ marginTop: 16 }}
                      >
                        <span>⚠️</span> {bookingError}
                      </div>
                    )}
                  </div>

                  {/* COUPON CODES CARD */}
                  <div
                    className="card price-breakup-card"
                    style={{
                      borderRadius: "var(--radius-lg)",
                      maxWidth: "100%",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: "1.1rem",
                          fontWeight: 800,
                          margin: 0,
                        }}
                      >
                        Coupon Codes
                      </h3>
                      <a
                        href="#"
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--brand-600)",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        View All
                      </a>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="HAVE A COUPON CODE?"
                        style={{
                          flex: 1,
                          minWidth: 0,
                          textTransform: "uppercase",
                          fontSize: "0.85rem",
                        }}
                      />
                      <button
                        className="btn"
                        style={{
                          background: "#e2e8f0",
                          color: "#475569",
                          fontWeight: 700,
                          border: "none",
                        }}
                      >
                        APPLY
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "var(--radius-lg)",
                      padding: "20px",
                    }}
                  >
                    <h4
                      style={{
                        color: "#b91c1c",
                        fontSize: "1.1rem",
                        fontWeight: 800,
                        marginBottom: 12,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      Cancellation & Refund Policy
                    </h4>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        fontSize: "0.85rem",
                        color: "#991b1b",
                        lineHeight: 1.5,
                      }}
                    >
                      <div>
                        <strong style={{ fontWeight: 800 }}>
                          100% Refund:
                        </strong>{" "}
                        If cancelled at least <strong>48 hours</strong> prior to
                        check-in.
                      </div>
                      <div>
                        <strong style={{ fontWeight: 800 }}>50% Refund:</strong>{" "}
                        If cancelled between <strong>24 to 48 hours</strong>{" "}
                        prior to check-in.
                      </div>
                      <div>
                        <strong style={{ fontWeight: 800 }}>
                          Non-Refundable:
                        </strong>{" "}
                        If cancelled within <strong>24 hours</strong> of
                        check-in time.
                      </div>
                    </div>
                  </div>

                  {/* PROCEED TO PAY BUTTON */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      marginTop: 8,
                    }}
                  >
                    <button
                      className="btn btn-primary btn-lg"
                      style={{
                        width: "100%",
                        padding: "16px",
                        fontSize: "1.2rem",
                        borderRadius: "var(--radius-lg)",
                        background: "#2563eb",
                        border: "none",
                        boxShadow: "0 8px 16px rgba(37,99,235,0.3)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 8,
                      }}
                      onClick={handleBooking}
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? (
                        <>
                          <div
                            className="spinner"
                            style={{
                              width: 18,
                              height: 18,
                              borderColor: "rgba(255,255,255,0.3)",
                              borderTopColor: "white",
                            }}
                          />{" "}
                          Processing...
                        </>
                      ) : (
                        <>
                          🚀 PROCEED TO PAY{" "}
                          <span
                            style={{
                              background: "rgba(255,255,255,0.2)",
                              padding: "2px 8px",
                              borderRadius: "var(--radius-sm)",
                            }}
                          >
                            ₹{currentPricing.totalAmount.toLocaleString()}
                          </span>
                        </>
                      )}
                    </button>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        textAlign: "center",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>🔒</span> Safe & Secure Checkout • End-to-End
                      Encrypted
                    </div>
                    {!session && (
                      <p
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--text-muted)",
                          textAlign: "center",
                          marginTop: 4,
                        }}
                      >
                        You'll be asked to sign in first
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {bookingStep === 2 && (
            <div className="card fade-in" style={{ textAlign: "center" }}>
              <div className="card-body">
                <div style={{ fontSize: "4rem", marginBottom: 16 }}>🎉</div>
                <h3 style={{ color: "var(--success)", marginBottom: 8 }}>
                  Booking Confirmed!
                </h3>
                <p style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
                  Your reservation at <strong>{hotel.name}</strong> is
                  confirmed. A confirmation email will be sent shortly.
                </p>
                <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                  <Link
                    href="/my-bookings"
                    className="btn btn-primary"
                  >
                    View My Bookings →
                  </Link>
                  {confirmedBookingId && (
                    <Link
                      href={`/invoice/${confirmedBookingId}`}
                      className="btn btn-secondary"
                      style={{ backgroundColor: 'var(--brand-500)', color: 'white', borderColor: 'var(--brand-500)' }}
                    >
                      📄 Tax Invoice
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
      {/* Room Details Modal */}
      {roomDetailsModal && (
        <>
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)",
              zIndex: 1000,
            }}
            onClick={() => setRoomDetailsModal(null)}
          />
          <div
            className="fade-in"
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              borderRadius: "var(--radius-xl)",
              width: "92%",
              maxWidth: 820,
              maxHeight: "92vh",
              overflowY: "auto",
              zIndex: 1001,
              boxShadow: "var(--shadow-xl)",
              padding: "var(--space-6)",
            }}
          >
            <button
              onClick={() => setRoomDetailsModal(null)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "var(--bg-secondary)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 2,
              }}
            >
              ✕
            </button>

            {roomDetailsModal.images && roomDetailsModal.images.length > 0 && (
              <div
                style={{
                  margin: "calc(-1 * var(--space-6, 24px)) calc(-1 * var(--space-6, 24px)) var(--space-4, 16px)",
                  position: "relative",
                }}
              >
                <div
                  style={{ width: "100%", height: 440, position: "relative", cursor: "zoom-in" }}
                  onClick={() => {
                    const currentImg = roomDetailsModal.images[modalImageIndex];
                    const foundIdx = allPhotos.findIndex((p) => p.url === currentImg);
                    setRoomDetailsModal(null);
                    openPhotoViewer(foundIdx >= 0 ? foundIdx : 0);
                  }}
                  title="Click to view full screen"
                >
                  <Image
                    src={roomDetailsModal.images[modalImageIndex]}
                    alt={roomDetailsModal.type}
                    fill
                    sizes="(max-width: 768px) 100vw, 900px"
                    style={{
                      objectFit: "cover",
                      borderTopLeftRadius: "var(--radius-xl)",
                      borderTopRightRadius: "var(--radius-xl)",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      background: "rgba(15, 23, 42, 0.75)",
                      backdropFilter: "blur(6px)",
                      color: "white",
                      padding: "6px 14px",
                      borderRadius: 20,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      border: "1px solid rgba(255,255,255,0.25)",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    }}
                  >
                    <span>⤢ View Full Screen</span>
                  </div>
                </div>

                {roomDetailsModal.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalImageIndex((prev) =>
                          prev === 0
                            ? roomDetailsModal.images.length - 1
                            : prev - 1,
                        );
                      }}
                      style={{
                        position: "absolute",
                        left: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "rgba(255,255,255,0.8)",
                        border: "none",
                        borderRadius: "50%",
                        width: 40,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        fontSize: "1.2rem",
                        color: "#0f172a",
                        zIndex: 2,
                      }}
                    >
                      ←
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalImageIndex((prev) =>
                          prev === roomDetailsModal.images.length - 1
                            ? 0
                            : prev + 1,
                        );
                      }}
                      style={{
                        position: "absolute",
                        right: 16,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "rgba(255,255,255,0.8)",
                        border: "none",
                        borderRadius: "50%",
                        width: 40,
                        height: 40,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        fontSize: "1.2rem",
                        color: "#0f172a",
                        zIndex: 2,
                      }}
                    >
                      →
                    </button>
                    <div
                      style={{
                        position: "absolute",
                        bottom: 16,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "rgba(0,0,0,0.6)",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: "0.8rem",
                        fontWeight: 600,
                      }}
                    >
                      {modalImageIndex + 1} / {roomDetailsModal.images.length}
                    </div>
                  </>
                )}
              </div>
            )}

            <h2 style={{ fontSize: "1.5rem", marginBottom: 8 }}>
              {roomDetailsModal.type}
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>
              {roomDetailsModal.description}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                gap: 12,
                marginBottom: 24,
                padding: "16px",
                background: "var(--bg-secondary)",
                borderRadius: "var(--radius-lg)",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  BED TYPE
                </span>
                <span style={{ fontWeight: 600 }}>
                  🛏️ {roomDetailsModal.bedType}
                </span>
              </div>
              <div>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  CAPACITY
                </span>
                <span style={{ fontWeight: 600 }}>
                  👥 {roomDetailsModal.maxGuests} Guests
                </span>
              </div>
              {roomDetailsModal.size && (
                <div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    ROOM SIZE
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    📐 {roomDetailsModal.size} m²
                  </span>
                </div>
              )}
              {roomDetailsModal.ratePlan && (
                <div>
                  <span
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      display: "block",
                      marginBottom: 4,
                    }}
                  >
                    MEAL PLAN
                  </span>
                  <span style={{ fontWeight: 600, color: roomDetailsModal.ratePlan === 'EP' ? 'var(--text-secondary)' : 'var(--success)' }}>
                    {roomDetailsModal.ratePlan === 'CP' ? '🍳 Free Breakfast Included (CP)' : roomDetailsModal.ratePlan === 'MAP' ? '🍽️ Breakfast & Dinner Included (MAP)' : roomDetailsModal.ratePlan === 'AP' ? '🍴 All Meals Included (AP)' : '☕ Room Only - No Breakfast (EP)'}
                  </span>
                </div>
              )}
            </div>

            <h3 style={{ fontSize: "1.1rem", marginBottom: 12 }}>
              Room Amenities
            </h3>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginBottom: 32,
              }}
            >
              {roomDetailsModal.amenities &&
                roomDetailsModal.amenities.map((am: string) => (
                  <span
                    key={am}
                    style={{
                      border: "1px solid var(--border)",
                      padding: "6px 12px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.85rem",
                      fontWeight: 500,
                    }}
                  >
                    ✓ {am}
                  </span>
                ))}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid var(--border)",
                paddingTop: 20,
                marginTop: "auto",
              }}
            >
              <div>
                <span
                  style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                >
                  Price per night {bookingData.rooms > 1 ? `(${bookingData.rooms} Rooms, ${bookingData.adults} Adults)` : ""}
                </span>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 800,
                    color: "var(--brand-600)",
                  }}
                >
                  ₹{getRoomPrice(roomDetailsModal).toLocaleString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setRoomDetailsModal(null)}
                >
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const room = roomDetailsModal;
                    setRoomDetailsModal(null);
                    if (bookingData.rooms === 1) {
                      setTimeout(() => openReview(room), 100);
                    } else {
                      handleAddRoom(room);
                    }
                  }}
                >
                  {bookingData.rooms > 1 ? "+ Add this Room" : "Select this Room"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Full-Screen Client Photo Viewer / Lightbox ("All photos appear one by one") */}
      {showGalleryModal && allPhotos.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            height: "100vh",
            height: "100dvh",
            zIndex: 99999,
            background: "#080c16",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            userSelect: "none",
            touchAction: "pan-y",
          }}
          onClick={() => setShowGalleryModal(false)}
        >
          {/* Floating Top Bar Overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 50,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 16px",
              background: "linear-gradient(180deg, rgba(8, 12, 22, 0.95) 0%, rgba(8, 12, 22, 0.7) 60%, rgba(8, 12, 22, 0) 100%)",
              pointerEvents: "none",
            }}
          >
            <div style={{ pointerEvents: "auto", display: "flex", flexDirection: "column", gap: 3, maxWidth: "60%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  🏨 {hotel?.name}
                </h3>
                <span style={{ fontSize: "0.7rem", background: "rgba(255,255,255,0.18)", color: "#f1f5f9", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  {allPhotos[galleryActiveIndex]?.label}
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "#94a3b8", fontWeight: 600 }}>
                Photo {galleryActiveIndex + 1} of {allPhotos.length} • Swipe or tap arrows
              </div>
            </div>

            <div style={{ pointerEvents: "auto", display: "flex", alignItems: "center", gap: 8 }}>
              {/* Fill Screen vs Fit Photo Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setGalleryFitMode((prev) => (prev === "contain" ? "cover" : "contain"));
                }}
                style={{
                  background: galleryFitMode === "cover" ? "var(--brand-600)" : "rgba(255,255,255,0.18)",
                  backdropFilter: "blur(8px)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
                title={galleryFitMode === "contain" ? "Fill Screen (Edge-to-Edge)" : "Fit Entire Photo"}
              >
                <span>{galleryFitMode === "cover" ? "⤡ Fit Photo" : "⤢ Fill Screen"}</span>
              </button>

              {/* Toggle Thumbnails (Desktop/Tablet) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilmstrip((prev) => !prev);
                }}
                className="desktop-only-btn"
                style={{
                  background: showFilmstrip ? "rgba(255,255,255,0.15)" : "var(--brand-600)",
                  backdropFilter: "blur(8px)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
                title="Toggle Thumbnails"
              >
                <span>🖼️ {showFilmstrip ? "Hide Thumbnails" : "Show Thumbnails"}</span>
              </button>

              {/* Fullscreen Button (Desktop/Tablet) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  } else {
                    document.exitFullscreen().catch(() => {});
                  }
                }}
                className="desktop-only-btn"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.25)",
                  borderRadius: 20,
                  padding: "6px 12px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.2s",
                }}
                title="Fullscreen"
              >
                <span>⛶ Fullscreen</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGalleryModal(false);
                }}
                style={{
                  background: "rgba(255,255,255,0.25)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  cursor: "pointer",
                  fontSize: "1.3rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                title="Close (Esc)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Main Photo Display Canvas (Full-Screen, Zero Restraints) */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: galleryFitMode === "cover" ? 0 : (showFilmstrip ? "64px 8px 84px 8px" : "64px 8px 16px 8px"),
              overflow: "hidden",
              boxSizing: "border-box",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Previous Arrow Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setGalleryActiveIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
              }}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(8, 12, 22, 0.75)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                color: "white",
                width: 48,
                height: 48,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 35,
                boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                transition: "all 0.2s",
              }}
              aria-label="Previous Photo"
            >
              ‹
            </button>

            {/* Active Main Image Container */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              onClick={() => setGalleryFitMode((prev) => (prev === "contain" ? "cover" : "contain"))}
              title="Click photo to toggle Fit / Fill Screen"
            >
              <img
                src={allPhotos[galleryActiveIndex]?.url}
                alt={`${hotel?.name} photo ${galleryActiveIndex + 1}`}
                style={{
                  width: galleryFitMode === "cover" ? "100%" : "auto",
                  height: galleryFitMode === "cover" ? "100%" : "auto",
                  maxWidth: galleryFitMode === "cover" ? "100%" : "100%",
                  maxHeight: galleryFitMode === "cover" ? "100%" : "100%",
                  objectFit: galleryFitMode === "cover" ? "cover" : "contain",
                  borderRadius: galleryFitMode === "cover" ? 0 : 12,
                  boxShadow: galleryFitMode === "cover" ? "none" : "0 25px 60px rgba(0,0,0,0.9)",
                  transition: "all 0.25s ease-out",
                  cursor: galleryFitMode === "cover" ? "zoom-out" : "zoom-in",
                }}
              />
            </div>

            {/* Next Arrow Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setGalleryActiveIndex((prev) => (prev + 1) % allPhotos.length);
              }}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(8, 12, 22, 0.75)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255, 255, 255, 0.35)",
                color: "white",
                width: 48,
                height: 48,
                borderRadius: "50%",
                cursor: "pointer",
                fontSize: "2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 35,
                boxShadow: "0 10px 25px rgba(0,0,0,0.6)",
                transition: "all 0.2s",
              }}
              aria-label="Next Photo"
            >
              ›
            </button>
          </div>

          {/* Floating Bottom Thumbnails Filmstrip */}
          {showFilmstrip && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 50,
                background: "linear-gradient(0deg, rgba(8, 12, 22, 0.95) 0%, rgba(8, 12, 22, 0.65) 70%, rgba(8, 12, 22, 0) 100%)",
                padding: "16px 16px 14px 16px",
                display: "flex",
                gap: 10,
                overflowX: "auto",
                alignItems: "center",
                justifyContent: allPhotos.length > 8 ? "flex-start" : "center",
                pointerEvents: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {allPhotos.map((photo: any, pIdx: number) => {
                const isActive = pIdx === galleryActiveIndex;
                return (
                  <div
                    key={pIdx}
                    onClick={() => setGalleryActiveIndex(pIdx)}
                    style={{
                      position: "relative",
                      flexShrink: 0,
                      width: 68,
                      height: 46,
                      borderRadius: 8,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: isActive ? "2.5px solid var(--brand-500)" : "1.5px solid rgba(255,255,255,0.25)",
                      transform: isActive ? "scale(1.12)" : "scale(1)",
                      opacity: isActive ? 1 : 0.65,
                      transition: "all 0.2s",
                      boxShadow: isActive ? "0 0 14px rgba(249, 115, 22, 0.6)" : "none",
                    }}
                    title={photo.label}
                  >
                    <img
                      src={photo.url}
                      alt={`Thumbnail ${pIdx + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                        background: "rgba(0,0,0,0.75)",
                        color: "white",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        padding: "1px 4px",
                        borderRadius: 3,
                      }}
                    >
                      {pIdx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
