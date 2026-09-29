"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";
import DateRangePicker from "@/components/DateRangePicker";
import ReviewSection from "./ReviewSection";
import Image from "next/image";

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
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [bookingData, setBookingData] = useState({
    checkIn: "",
    checkOut: "",
    guests: "1",
    rooms: 1,
    adults: 2,
    children: 0,
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
  const [confirmedBookingId, setConfirmedBookingId] = useState<string>("");

  useEffect(() => {
    if (id) fetchHotelData();
  }, [id]);

  const searchParamsInitialized = useRef(false);
  useEffect(() => {
    if (!searchParamsInitialized.current) {
      setBookingData((p) => ({
        ...p,
        checkIn: searchParams.get("checkIn") || "",
        checkOut: searchParams.get("checkOut") || "",
        adults: parseInt(searchParams.get("adults") || "2"),
        rooms: parseInt(searchParams.get("rooms") || "1"),
      }));
      searchParamsInitialized.current = true;
    }
  }, [searchParams]);

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

  async function fetchHotelData() {
    try {
      const res = await fetch(`/api/hotels/${id}`);
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

  const getRoomPrice = (room: any) => {
    let basePartnerPrice = room.priceDouble || room.priceSingle || room.priceTriple || 0;
    if (bookingData.adults >= 3 && room.priceTriple) {
      basePartnerPrice = room.priceTriple;
    } else if (bookingData.adults === 1 && room.priceSingle) {
      basePartnerPrice = room.priceSingle;
    }
    
    // Apply B2C margin percentage if available
    const margin = hotel?.marginPercentage || 0;
    const clientPrice = basePartnerPrice * (1 + margin / 100);
    
    return Math.round(clientPrice);
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

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: (session.user as any).id,
        hotelId: id,
        roomId: selectedRoom._id,
        checkIn: bookingData.checkIn,
        checkOut: bookingData.checkOut,
        guests: parseInt(bookingData.guests),
        guestName:
          `${bookingData.guestFirstName} ${bookingData.guestLastName}`.trim(),
        guestEmail: bookingData.guestEmail,
        guestPhone: bookingData.guestPhone,
        specialRequests: bookingData.specialRequests,
        status: 'confirmed',
        paymentStatus: 'paid',
        gstRegistrationNo: (bookingData as any).gstRegistrationNo,
        gstCompanyName: (bookingData as any).gstCompanyName,
        gstCompanyAddress: (bookingData as any).gstCompanyAddress,
      }),
    });

    const data = await res.json();
    setBookingLoading(false);

    if (!res.ok) {
      setBookingError(data.error || "Booking failed");
      return;
    }
    setConfirmedBookingId(data.booking._id);
    setBookingStep(2);
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

      setReviewSuccess("Thank you! Your review has been published.");
      setReviewData({ rating: 5, title: "", comment: "" });
      fetchHotelData();
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

  const openReview = (room: any) => {
    if (!bookingData.checkIn || !bookingData.checkOut) {
      const bar = document.getElementById("availability-bar");
      if (bar) {
        bar.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setShowDatePicker(true), 500);
      }
      return;
    }
    setSelectedRoom(room);
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <h1 style={{ fontSize: "1.8rem", fontWeight: 900, color: "#0f172a", margin: 0 }}>
              {hotel.name}
            </h1>
            <div style={{ color: "#f59e0b", fontSize: "1rem" }}>
              {"⭐".repeat(hotel.starRating || 4)}
            </div>
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
          className="container"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 360px",
            gap: "var(--space-8)",
            alignItems: "flex-start",
            paddingBottom: "var(--space-16)",
          }}
        >
          {/* Left Column */}
          <div>
            {/* Hero Images Gallery */}
            <div style={{ marginBottom: "var(--space-6)" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "16px",
                  borderRadius: "24px",
                  overflow: "hidden",
                  height: 400,
                }}
              >
                <div
                  style={{
                    position: "relative",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  onClick={() => setActiveImg(0)}
                >
                  {hotel.images?.[0] ? (
                    <Image
                      src={hotel.images[0]}
                      alt={hotel.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 66vw"
                      style={{ objectFit: "cover" }}
                    />
                  ) : (
                    <div style={{ background: "#e2e8f0", width: "100%", height: "100%" }} />
                  )}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateRows: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  {[1, 2].map((idx) => (
                    <div
                      key={idx}
                      style={{ position: "relative", overflow: "hidden", cursor: "pointer" }}
                      onClick={() => setActiveImg(idx)}
                    >
                      {hotel.images?.[idx] ? (
                        <Image
                          src={hotel.images[idx]}
                          alt={`${hotel.name} ${idx + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          style={{ objectFit: "cover" }}
                        />
                      ) : (
                        <div style={{ background: "#e2e8f0", width: "100%", height: "100%" }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
              <div className="card-header">
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>About Property</h3>
              </div>
              <div className="card-body">
                <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "0.95rem" }}>
                  {hotel.description || "Experience a wonderful stay at our property, offering premium amenities and excellent service. Perfectly located for both business and leisure travelers."}
                </p>
              </div>
            </div>

            {/* Amenities */}
            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
              <div className="card-header">
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>Amenities</h3>
              </div>
              <div className="card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
            <div className="card" style={{ marginBottom: "var(--space-5)" }}>
              <div className="card-header">
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800 }}>House Rules</h3>
              </div>
              <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>Check-in</span>
                  <span style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>From 12:00 PM</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
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
              <div className="card" style={{ marginBottom: "var(--space-5)" }}>
                <div className="card-header">
                  <h3 style={{ fontSize: "1rem" }}>Location</h3>
                </div>
                <div
                  className="card-body"
                  style={{
                    padding: 0,
                    overflow: "hidden",
                    height: 300,
                    position: "relative",
                  }}
                >
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
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
              className="card"
              id="availability-bar"
              style={{
                marginBottom: "var(--space-5)",
                padding: "16px",
                display: "flex",
                gap: 16,
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
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            Rooms
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
                                setBookingData((p) => ({
                                  ...p,
                                  rooms: Math.max(1, p.rooms - 1),
                                }))
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
                                setBookingData((p) => ({
                                  ...p,
                                  rooms: Math.min(10, p.rooms + 1),
                                }))
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
                          <div
                            style={{
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            Adults
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
                                setBookingData((p) => ({
                                  ...p,
                                  adults: Math.max(1, p.adults - 1),
                                }))
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
                                setBookingData((p) => ({
                                  ...p,
                                  adults: Math.min(20, p.adults + 1),
                                }))
                              }
                            >
                              +
                            </button>
                          </div>
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
              style={{ marginBottom: "var(--space-5)" }}
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
                  rooms.map((room) => (
                    <div
                      key={room._id}
                      style={{
                        border: `2px solid ${selectedRoom?._id === room._id ? "var(--brand-500)" : "var(--border)"}`,
                        borderRadius: "var(--radius-lg)",
                        padding: "var(--space-4)",
                        transition: "all 0.3s ease",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        gap: "var(--space-4)",
                        background:
                          selectedRoom?._id === room._id
                            ? "var(--brand-50)"
                            : "transparent",
                      }}
                      onClick={() => {
                        setRoomDetailsModal(room);
                        setModalImageIndex(0);
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: room.images?.[0]
                            ? "140px 1fr auto"
                            : "1fr auto",
                          gap: "var(--space-4)",
                          alignItems: "center",
                        }}
                      >
                        {room.images?.[0] && (
                          <Image
                            src={room.images[0]}
                            alt={room.type}
                            width={140}
                            height={100}
                            style={{
                              objectFit: "cover",
                              borderRadius: "var(--radius-md)",
                            }}
                          />
                        )}
                        <div>
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
                            <span>👥 Max {room.maxGuests} guests</span>
                            {room.size && <span>📐 {room.size} m²</span>}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div
                            style={{
                              fontSize: "1.3rem",
                              fontWeight: 800,
                              color: "var(--brand-600)",
                            }}
                          >
                            ₹{getRoomPrice(room).toLocaleString()}
                          </div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            per night
                          </div>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ marginTop: 8 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRoom(room);
                            }}
                          >
                            {selectedRoom?._id === room._id
                              ? "Selected"
                              : "Select"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reviews */}
            {reviews.length > 0 && (
              <div className="card">
                <div
                  className="card-header"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <h3 style={{ fontSize: "1rem" }}>Guest Reviews</h3>
                  <span
                    style={{
                      background: "var(--brand-500)",
                      color: "white",
                      fontWeight: 700,
                      padding: "2px 10px",
                      borderRadius: "var(--radius-sm)",
                    }}
                  >
                    {hotel.avgRating?.toFixed(1)}
                  </span>
                </div>
                <div
                  className="card-body"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-5)",
                  }}
                >
                  {reviews.map((review) => (
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
                  ))}
                </div>
              </div>
            )}
          </div>


          {/* Right: Booking Panel */}
          <div style={{ position: "sticky", top: 90 }}>
            {/* Location Card (Moved from left) */}
            <div
              className="card"
              style={{
                marginBottom: "var(--space-5)",
                padding: "var(--space-5)",
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
                if (!selectedRoom) {
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
                        Select a Room
                      </h3>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-secondary)",
                          margin: 0,
                        }}
                      >
                        Please choose a room category from the available options
                        to view pricing and continue with your booking.
                      </p>
                    </div>
                  );
                }

                const displayRoom = selectedRoom;

                const currentPrice =
                  occupancy === "single"
                    ? displayRoom.priceSingle
                    : occupancy === "triple"
                      ? displayRoom.priceTriple
                      : displayRoom.priceDouble || displayRoom.priceSingle;

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
                      12 Rooms Available • Live Instant API Confirmation
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
                      Select Room Occupancy:
                    </div>

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
                            onClick={() => setOccupancy(occ as any)}
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
                        ₹{currentPrice.toLocaleString()}
                      </div>
                      <div
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.9rem",
                          paddingBottom: 4,
                        }}
                      >
                        Per Night ({occupancy.toUpperCase()} OCCUPANCY)
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
                      🚀 Book This Now
                    </button>

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
                minHeight: "calc(100vh - 68px)",
                width: "100%",
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
                  top: 66,
                  zIndex: 10,
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    maxWidth: "1100px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px 24px",
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
                style={{
                  width: "100%",
                  maxWidth: "1100px",
                  padding: "32px 24px",
                  display: "grid",
                  gridTemplateColumns: "1fr 380px",
                  gap: "32px",
                  alignItems: "start",
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
                    className="card"
                    style={{
                      padding: "20px",
                      borderRadius: "var(--radius-lg)",
                      display: "flex",
                      gap: "24px",
                      alignItems: "stretch",
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
                            onClick={() => closeReview()}
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
                            onClick={() => closeReview()}
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
                      style={{
                        width: "240px",
                        background: "#eff6ff",
                        borderRadius: "var(--radius-md)",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
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
                          {selectedRoom.type}
                        </h3>
                        <div
                          style={{
                            fontSize: "0.85rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {bookingData.adults} Adult
                          {bookingData.adults > 1 ? "s" : ""}
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

                    <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
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

                    <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
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
                      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
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
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span>✅</span> Logged in as {session.user.email || (session.user as any)?.phone || session.user.name}.
                        Traveller details prefilled & secret deals active!
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
                    className="card"
                    style={{
                      padding: "24px",
                      borderRadius: "var(--radius-lg)",
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
                            {bookingData.rooms} Room x {nights} Night
                            {nights > 1 ? "s" : ""}
                          </div>
                        </div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>
                          ₹
                          {Math.round(
                            (getRoomPrice(selectedRoom) * nights) / 0.85,
                          ).toLocaleString()}
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
                        <div>Discount by Property</div>
                        <div>
                          - ₹
                          {Math.round(
                            ((getRoomPrice(selectedRoom) * nights) / 0.85) *
                              0.15,
                          ).toLocaleString()}
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
                          ₹
                          {(
                            getRoomPrice(selectedRoom) * nights
                          ).toLocaleString()}
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
                          ₹
                          {Math.round(
                            getRoomPrice(selectedRoom) * nights * 0.05,
                          ).toLocaleString()}
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
                          ₹
                          {Math.round(
                            getRoomPrice(selectedRoom) * nights * 1.05,
                          ).toLocaleString()}
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
                      🎉 You save ₹
                      {Math.round(
                        ((getRoomPrice(selectedRoom) * nights) / 0.85) * 0.15,
                      ).toLocaleString()}{" "}
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
                    className="card"
                    style={{
                      padding: "24px",
                      borderRadius: "var(--radius-lg)",
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
                            ₹
                            {Math.round(
                              getRoomPrice(selectedRoom) * nights * 1.05,
                            ).toLocaleString()}
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
              width: "90%",
              maxWidth: 600,
              maxHeight: "90vh",
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
                  margin: "-var(--space-6) -var(--space-6) var(--space-4)",
                  position: "relative",
                }}
              >
                <div
                  style={{ width: "100%", height: 350, position: "relative" }}
                >
                  <Image
                    src={roomDetailsModal.images[modalImageIndex]}
                    alt={roomDetailsModal.type}
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    style={{
                      objectFit: "cover",
                      borderTopLeftRadius: "var(--radius-xl)",
                      borderTopRightRadius: "var(--radius-xl)",
                    }}
                  />
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
                  <span style={{ fontWeight: 600, color: "var(--success)" }}>
                    🍽️ {roomDetailsModal.ratePlan}
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
                  Price per night
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
                    setTimeout(() => openReview(room), 100);
                  }}
                >
                  Select this Room
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
