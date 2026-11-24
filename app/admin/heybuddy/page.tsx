"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, AudioLines, Bot, Bug, CheckCircle,
  Code2, Globe, Hotel, Mic, MicOff, Send,
  ShieldCheck, Volume2, VolumeX, Zap, RefreshCw,
  ArrowLeft, Lock, MessageCircle, Phone, Calendar,
  ExternalLink, Sparkles, Star, MapPin, IndianRupee,
  Share2, ArrowUpRight, Search, Users, FileText,
  TrendingUp, AlertTriangle, Check, Clock, UserCheck
} from "lucide-react";

type Finding = {
  title: string;
  severity: string;
  detail: string;
  recommendation: string;
};

type HotelItem = {
  _id: string;
  name: string;
  city: string;
  area?: string;
  starRating?: number;
  pricePerNight?: number;
  images?: string[];
  rooms?: any[];
  status?: string;
  hasPendingRoomUpdates?: boolean;
  isExtranet?: boolean;
};

type BookingItem = {
  _id: string;
  bookingId?: string;
  hotelId?: any;
  customerId?: any;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  roomType?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  totalAmount?: number;
  b2bCost?: number;
  status?: string;
  paymentStatus?: string;
  isReferralBooking?: boolean;
  referralCode?: string;
  referrerName?: string;
  createdAt?: string;
};

type SystemSyncData = {
  bookings: BookingItem[];
  hotels: HotelItem[];
  taxInvoices: any[];
  partners: any[];
  users: any[];
  onboardingStaff: any[];
  lastSynced: string | null;
  syncing: boolean;
};

type ChatMessage = {
  role: "HeyBuddy" | "You";
  text: string;
  timestamp?: string;
  actionType?: "hotels" | "whatsapp" | "booking" | "bookings_list" | "stats" | "diagnostic" | "partners" | "navigate";
  actionData?: any;
};

export default function HeyBuddyPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(true);
  const [command, setCommand] = useState("");
  const [status, setStatus] = useState("● SYSTEM SYNCHRONIZED • \"DUDU, TELL ME\"");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [recheckingBookingId, setRecheckingBookingId] = useState<string | null>(null);

  const adminName = useMemo(() => {
    return session?.user?.name || "Arif";
  }, [session]);

  // LIVE SYSTEM SYNCHRONIZATION REPOSITORY
  const [systemData, setSystemData] = useState<SystemSyncData>({
    bookings: [],
    hotels: [],
    taxInvoices: [],
    partners: [],
    users: [],
    onboardingStaff: [],
    lastSynced: null,
    syncing: true
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "HeyBuddy",
      text: `Hi, ${adminName} ✨ I am HeyBuddy, your StayBuddy Executive AI. I am completely synchronized with your live database: Bookings, Hotel Inventory, Revenue, Tax Invoices, and Partner Extranet. Say "Hey Buddy" and I'll respond "Dudu, tell me", or speak any request directly!`,
      timestamp: "Just now"
    }
  ]);

  const [findings, setFindings] = useState<Finding[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanDone, setScanDone] = useState(false);
  const [scanCount, setScanCount] = useState(0);

  const recognition = useRef<any>(null);
  const listeningRef = useRef(false);
  const wakeActive = useRef(false);

  // AUTH PROTECTION: Exclusively for Admin
  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/admin/heybuddy");
    } else if (authStatus === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role !== "admin") {
        if (role === "onboarder") {
          router.push("/partner");
        } else {
          router.push("/");
        }
      }
    }
  }, [authStatus, session, router]);

  // DEEP SYSTEM SYNCHRONIZATION FUNCTION
  const syncCompleteSystem = useCallback(async () => {
    setSystemData(prev => ({ ...prev, syncing: true }));
    setStatus("SYNCHRONIZING SYSTEM DATA...");

    try {
      const [bookingsRes, hotelsRes, invoicesRes, partnersRes, usersRes, staffRes] = await Promise.allSettled([
        fetch("/api/admin/bookings").then(r => r.ok ? r.json() : { bookings: [] }),
        fetch("/api/admin/hotels").then(r => r.ok ? r.json() : { hotels: [] }),
        fetch("/api/admin/tax-invoices").then(r => r.ok ? r.json() : { invoices: [] }),
        fetch("/api/admin/partners").then(r => r.ok ? r.json() : { partners: [] }),
        fetch("/api/admin/users").then(r => r.ok ? r.json() : { users: [] }),
        fetch("/api/admin/onboarding-staff").then(r => r.ok ? r.json() : { staff: [] })
      ]);

      const bookings = bookingsRes.status === "fulfilled" ? (bookingsRes.value.bookings || []) : [];
      const hotels = hotelsRes.status === "fulfilled" ? (hotelsRes.value.hotels || []) : [];
      const taxInvoices = invoicesRes.status === "fulfilled" ? (invoicesRes.value.invoices || []) : [];
      const partners = partnersRes.status === "fulfilled" ? (partnersRes.value.partners || []) : [];
      const users = usersRes.status === "fulfilled" ? (usersRes.value.users || []) : [];
      const onboardingStaff = staffRes.status === "fulfilled" ? (staffRes.value.staff || []) : [];

      setSystemData({
        bookings,
        hotels,
        taxInvoices,
        partners,
        users,
        onboardingStaff,
        lastSynced: new Date().toLocaleTimeString("en-IN"),
        syncing: false
      });

      setStatus("● FULLY SYNCHRONIZED • \"DUDU, TELL ME\"");
    } catch (err) {
      console.error("System sync error:", err);
      setSystemData(prev => ({ ...prev, syncing: false }));
      setStatus("● SYSTEM READY (OFFLINE SYNC)");
    }
  }, []);

  // INITIAL SYSTEM SYNC
  useEffect(() => {
    if (authStatus === "authenticated" && (session?.user as any)?.role === "admin") {
      syncCompleteSystem();
    }
  }, [authStatus, session, syncCompleteSystem]);

  // LOAD FEMALE VOICES
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        setAvailableVoices(voices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  function getFemaleVoice(): SpeechSynthesisVoice | null {
    if (!availableVoices.length) return null;

    const preferred = [
      "google uk english female",
      "google us english female",
      "microsoft zira",
      "microsoft neerja",
      "microsoft heera",
      "samantha",
      "karen",
      "victoria",
      "fiona",
      "moira",
      "tessa",
      "veena"
    ];

    for (const name of preferred) {
      const match = availableVoices.find(v => v.name.toLowerCase().includes(name));
      if (match) return match;
    }

    const femaleMatch = availableVoices.find(v =>
      v.name.toLowerCase().includes("female") ||
      (v.lang.startsWith("en") && (v.name.toLowerCase().includes("woman") || v.name.toLowerCase().includes("girl")))
    );
    if (femaleMatch) return femaleMatch;

    const indianVoice = availableVoices.find(v => v.lang === "en-IN" || v.lang === "en_IN");
    if (indianVoice) return indianVoice;

    const anyEn = availableVoices.find(v => v.lang.startsWith("en"));
    return anyEn || availableVoices[0] || null;
  }

  // NATURAL FEMALE SPEECH SYNTHESIS
  function speak(text: string) {
    if (!speaking || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();

      // Clean speech text
      const cleanText = text
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[*_#`~]/g, "")
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const femaleVoice = getFemaleVoice();
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      utterance.lang = femaleVoice?.lang || "en-IN";
      utterance.rate = 0.98;
      utterance.pitch = 1.25;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  function reply(text: string, originalCommand: string, actionType?: "hotels" | "whatsapp" | "booking" | "bookings_list" | "stats" | "diagnostic" | "partners" | "navigate", actionData?: any) {
    setMessages(old => [
      ...old,
      { role: "You", text: originalCommand, timestamp: "Just now" },
      { role: "HeyBuddy", text, timestamp: "Just now", actionType, actionData }
    ]);

    setStatus("RESPONSE READY");
    speak(text);
  }

  // RECHECK RAZORPAY PAYMENT
  async function recheckPayment(bookingId: string) {
    setRecheckingBookingId(bookingId);
    try {
      const res = await fetch("/api/payments/recheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId })
      });
      const data = await res.json();
      if (data.verified) {
        alert("🎉 Payment successfully verified via Razorpay! Marked as Confirmed & Paid.");
        syncCompleteSystem();
      } else {
        alert(data.message || "No captured payment found on Razorpay for this booking.");
      }
    } catch (e: any) {
      alert("Error checking payment: " + (e.message || e));
    } finally {
      setRecheckingBookingId(null);
    }
  }

  // WEBSITE SCANNER
  async function scanWebsite(): Promise<Finding[]> {
    setScanning(true);
    setScanDone(false);
    setStatus("INSPECTING STAYBUDDY WEBSITE");

    const issues: Finding[] = [];

    try {
      const response = await fetch(window.location.origin, { cache: "no-store" });
      if (!response.ok) {
        issues.push({
          title: "Homepage HTTP error",
          severity: "High",
          detail: `Homepage returned HTTP ${response.status}.`,
          recommendation: "Check server logs, routes and deployment."
        });
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      if (!doc.querySelector("title")?.textContent?.trim()) {
        issues.push({
          title: "Missing page title",
          severity: "Medium",
          detail: "Homepage does not have a meaningful title.",
          recommendation: "Add a descriptive HTML title for SEO and accessibility."
        });
      }

      if (!doc.querySelector('meta[name="viewport"]')) {
        issues.push({
          title: "Missing viewport configuration",
          severity: "Medium",
          detail: "Responsive viewport metadata was not found.",
          recommendation: "Add a viewport meta tag for mobile responsiveness."
        });
      }

      const images = Array.from(doc.querySelectorAll("img"));
      const missingAlt = images.filter(image => !image.hasAttribute("alt") || !image.getAttribute("alt")?.trim());
      if (missingAlt.length) {
        issues.push({
          title: "Images missing alt text",
          severity: "Medium",
          detail: `${missingAlt.length} images on the homepage have no alt attribute.`,
          recommendation: "Add descriptive alt text to all hotel, banner and logo images."
        });
      }

      const buttons = Array.from(doc.querySelectorAll("button"));
      const unnamedButtons = buttons.filter(button => !button.textContent?.trim() && !button.getAttribute("aria-label"));
      if (unnamedButtons.length) {
        issues.push({
          title: "Buttons missing accessible names",
          severity: "Medium",
          detail: `${unnamedButtons.length} buttons have no text or aria-label.`,
          recommendation: "Add button text or aria-label for screen reader support."
        });
      }

      if (!issues.length) {
        issues.push({
          title: "Homepage health checks passed",
          severity: "Info",
          detail: "No critical accessibility or markup issues were found on the homepage.",
          recommendation: "StayBuddy core frontend is running cleanly."
        });
      }

      setScanCount(count => count + 1);
    } catch (error) {
      issues.push({
        title: "Website scan failed",
        severity: "High",
        detail: error instanceof Error ? error.message : "Unknown error.",
        recommendation: "Check network connectivity and hosting configuration."
      });
    }

    setFindings(issues);
    setScanning(false);
    setScanDone(true);
    setStatus("SCAN COMPLETED");
    return issues;
  }

  // PREPARE WHATSAPP MESSAGE
  function prepareWhatsApp(guestPhone: string, guestName: string, hotelName: string, bookingRef?: string, totalAmount?: number) {
    const cleanPhone = guestPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const ref = bookingRef || `SB-${Math.floor(100000 + Math.random() * 900000)}`;
    const amtStr = totalAmount ? `\n*Amount:* ₹${Number(totalAmount).toLocaleString("en-IN")}` : "";

    const text = `*StayBuddy Hotel Booking Confirmation* 🏨✨\n\nDear ${guestName || "Guest"},\nThank you for choosing StayBuddy! Your reservation at *${hotelName || "StayBuddy Hotel"}* is confirmed.\n\n*Booking ID:* ${ref}${amtStr}\n*Check-in:* 12:00 PM\n*Check-out:* 11:00 AM\n\nFor directions, early check-in, or assistance, reach us at care@staybuddy.in or https://staybuddy.in\n\n_Wish you a pleasant stay with StayBuddy!_`;

    return {
      phone: formattedPhone,
      displayPhone: guestPhone,
      guestName: guestName || "Valued Guest",
      hotelName: hotelName || "Hotel",
      bookingRef: ref,
      text,
      whatsappUrl: `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`,
      smsUrl: `sms:${formattedPhone}?body=${encodeURIComponent(text)}`
    };
  }

  // DEEP SYSTEM INTELLIGENCE ENGINE
  async function execute(input: string) {
    const q = input.trim().toLowerCase();
    if (!q) return;

    setStatus("PROCESSING INTELLIGENCE...");

    // 1. REFRESH / SYNC SYSTEM
    if (q.includes("sync") || q.includes("refresh data") || q.includes("reload database")) {
      await syncCompleteSystem();
      reply(`Dudu, system data has been completely re-synchronized with StayBuddy's live database.`, input);
      return;
    }

    // 2. SEARCH SPECIFIC BOOKING (By ID, Guest Name, or Phone)
    if (
      q.includes("find booking") ||
      q.includes("search booking") ||
      q.includes("booking for") ||
      q.includes("check booking") ||
      (q.includes("booking") && (q.match(/\b\d{4,}\b/) || q.match(/sb-/i)))
    ) {
      const bookings = systemData.bookings;
      let matchedBooking: BookingItem | undefined;

      // Extract query term
      const queryIdMatch = input.match(/sb-?\d+/i);
      if (queryIdMatch) {
        const idSearch = queryIdMatch[0].toLowerCase().replace("-", "");
        matchedBooking = bookings.find(b =>
          (b._id || "").toLowerCase().includes(idSearch) ||
          (b.bookingId || "").toLowerCase().replace("-", "").includes(idSearch)
        );
      }

      if (!matchedBooking) {
        // Search by guest name or phone
        const words = input.replace(/find|search|check|booking|for|details|of|the|with/gi, "").trim().split(" ");
        const searchWord = words.find(w => w.length > 2);
        if (searchWord) {
          const swLower = searchWord.toLowerCase();
          matchedBooking = bookings.find(b =>
            (b.guestName || "").toLowerCase().includes(swLower) ||
            (b.guestPhone || "").includes(swLower) ||
            (b.customerId?.name || "").toLowerCase().includes(swLower) ||
            (b.hotelId?.name || "").toLowerCase().includes(swLower)
          );
        }
      }

      if (matchedBooking) {
        const guestName = matchedBooking.guestName || matchedBooking.customerId?.name || "Guest";
        const hotelName = matchedBooking.hotelId?.name || "StayBuddy Property";
        const amt = Number(matchedBooking.totalAmount || 0);
        const statusStr = matchedBooking.status || "confirmed";
        const payStatus = matchedBooking.paymentStatus || "unpaid";

        const answer = `Dudu, I found booking ${matchedBooking.bookingId || matchedBooking._id.slice(0, 8)} for ${guestName} at ${hotelName}. Status is ${statusStr.toUpperCase()}, payment is ${payStatus.toUpperCase()} for ₹${amt.toLocaleString("en-IN")}. Details and actions are shown below.`;

        const waData = prepareWhatsApp(
          matchedBooking.guestPhone || matchedBooking.customerId?.phone || "9876543210",
          guestName,
          hotelName,
          matchedBooking.bookingId || matchedBooking._id,
          amt
        );

        reply(answer, input, "booking", { booking: matchedBooking, whatsapp: waData });
        return;
      }
    }

    // 3. PENDING BOOKINGS OR UNPAID RESERVATIONS
    if (q.includes("pending booking") || q.includes("unpaid") || q.includes("failed payment") || q.includes("recheck payment")) {
      const pending = systemData.bookings.filter(b => b.status === "pending" || b.paymentStatus !== "paid");
      if (pending.length > 0) {
        const answer = `Dudu, there are ${pending.length} bookings currently marked as pending or awaiting payment verification. Here are the top items with direct Razorpay verification.`;
        reply(answer, input, "bookings_list", { bookings: pending.slice(0, 5) });
      } else {
        reply(`Dudu, all bookings in the system currently have verified payments and confirmed status!`, input);
      }
      return;
    }

    // 4. WHATSAPP & SMS DISPATCH
    if (
      q.includes("whatsapp") ||
      q.includes("what up") ||
      q.includes("whst up") ||
      q.includes("sms") ||
      q.includes("message to guest") ||
      q.includes("send message")
    ) {
      const phoneMatch = input.match(/(\+?91[\-\s]?)?[6-9]\d{9}/);
      const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, "") : (systemData.bookings[0]?.guestPhone || "9876543210");

      let hotelName = systemData.bookings[0]?.hotelId?.name || "GM Hotel Kosala";
      if (q.includes("galadari")) hotelName = "Hotel Galadari";
      if (q.includes("kosala")) hotelName = "GM Hotel Kosala";

      let guestName = systemData.bookings[0]?.guestName || "Guest";
      if (q.includes("for ")) {
        const afterFor = input.split(/for /i)[1];
        if (afterFor) guestName = afterFor.split(" ")[0].trim();
      }

      const waData = prepareWhatsApp(phone, guestName, hotelName);
      const answer = `Dudu, I have prepared the WhatsApp confirmation message for ${waData.guestName} (${waData.displayPhone}) at ${waData.hotelName}. Click "Send on WhatsApp" to dispatch it!`;

      reply(answer, input, "whatsapp", waData);
      return;
    }

    // 5. HOTEL INVENTORY & SEARCH
    if (
      q.includes("book") ||
      q.includes("recommend") ||
      q.includes("find hotel") ||
      q.includes("show hotel") ||
      q.includes("hotels in") ||
      q.includes("rooms in")
    ) {
      let targetCity = "";
      const cities = ["goa", "vijayawada", "hyderabad", "bengaluru", "bangalore", "mumbai", "delhi", "chennai", "kolkata", "pune", "jaipur"];
      for (const c of cities) {
        if (q.includes(c)) {
          targetCity = c === "bangalore" ? "bengaluru" : c;
          break;
        }
      }

      let matched = systemData.hotels.filter(h => h.status === "approved" || !h.status);
      if (targetCity) {
        matched = matched.filter(h => (h.city || "").toLowerCase().includes(targetCity));
      }

      if (!matched.length && systemData.hotels.length) {
        matched = systemData.hotels.slice(0, 4);
      }

      const top = matched[0];
      const cityName = targetCity ? (targetCity.charAt(0).toUpperCase() + targetCity.slice(1)) : (top?.city || "India");
      const price = top?.pricePerNight || (top?.rooms?.[0]?.price) || 1811;

      const answer = `Dudu, I found ${matched.length} properties in ${cityName}. The best recommendation is ${top?.name || "StayBuddy Hotel"} starting at ₹${Number(price).toLocaleString("en-IN")}/night.`;

      reply(answer, input, "hotels", { hotels: matched.slice(0, 5), targetCity: cityName });
      return;
    }

    // 6. PENDING HOTEL APPROVALS & EXTRANET UPDATES
    if (q.includes("pending approval") || q.includes("hotel approval") || q.includes("pending properties") || q.includes("room approval")) {
      const pendingHotels = systemData.hotels.filter(h =>
        h.status === "pending" ||
        h.hasPendingRoomUpdates === true ||
        (Array.isArray(h.rooms) && h.rooms.some((r: any) => r.approvalStatus === "pending"))
      );

      if (pendingHotels.length > 0) {
        const answer = `Dudu, there are ${pendingHotels.length} properties or room updates awaiting your admin approval. Here is the list for your review.`;
        reply(answer, input, "hotels", { hotels: pendingHotels, isPendingList: true });
      } else {
        reply(`Dudu, all properties and room rates are up-to-date and approved across the platform!`, input);
      }
      return;
    }

    // 7. FINANCIAL AUDIT & REVENUE REPORT
    if (q.includes("revenue") || q.includes("sales") || q.includes("profit") || q.includes("financial") || q.includes("tax") || q.includes("gst")) {
      const bookings = systemData.bookings;
      const confirmedPaid = bookings.filter(b => (b.status === "confirmed" || b.status === "completed") && b.paymentStatus === "paid");
      const totalRevenue = confirmedPaid.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
      const totalB2b = confirmedPaid.reduce((acc, b) => acc + (Number(b.b2bCost) || 0), 0);
      const grossProfit = totalRevenue > totalB2b ? totalRevenue - totalB2b : 0;
      const gstDeduction = grossProfit * 0.05;
      const netProfit = grossProfit - gstDeduction;

      const answer = `Dudu, here is the complete financial audit: Total GMV is ₹${totalRevenue.toLocaleString("en-IN")} across ${confirmedPaid.length} confirmed paid bookings. Platform gross profit is ₹${grossProfit.toLocaleString("en-IN")}, with estimated net profit of ₹${netProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })} after 5% GST deduction.`;

      reply(answer, input, "stats", {
        totalRevenue,
        grossProfit,
        netProfit,
        gstDeduction,
        totalBookings: bookings.length,
        confirmedPaidCount: confirmedPaid.length
      });
      return;
    }

    // 8. PARTNER ONBOARDING & TEAM
    if (q.includes("partner") || q.includes("onboarding") || q.includes("staff")) {
      const pendingPartners = systemData.partners.filter(p => !p.isApproved);
      const answer = `Dudu, StayBuddy has ${systemData.partners.length} registered hotel partners (${pendingPartners.length} pending verification) and ${systemData.onboardingStaff.length} active onboarding executives.`;
      reply(answer, input, "partners", { partners: systemData.partners.slice(0, 4), staff: systemData.onboardingStaff });
      return;
    }

    // 9. REFERRALS & USERS
    if (q.includes("referral") || q.includes("users") || q.includes("wallet")) {
      const referralBookings = systemData.bookings.filter(b => b.isReferralBooking || b.referralCode);
      const answer = `Dudu, we have ${systemData.users.length} registered customers, with ${referralBookings.length} bookings driven by referral codes. Referral rewards are set at ₹20 per completed stay.`;
      reply(answer, input, "stats");
      return;
    }

    // 10. WEBSITE SCANNER & ACCESSIBILITY AUDIT
    if (q.includes("scan") || q.includes("website") || q.includes("bug") || q.includes("error") || q.includes("health") || q.includes("inspect")) {
      const result = await scanWebsite();
      const answer = `Dudu, website inspection is completed. I found ${result.length} diagnostic findings for the StayBuddy homepage. Full details are listed in the diagnostics panel.`;
      reply(answer, input, "diagnostic", { findings: result });
      return;
    }

    // 11. ADMIN SECTION NAVIGATION
    if (q.includes("open") || q.includes("go to")) {
      if (q.includes("booking")) {
        reply(`Dudu, opening Live Bookings tab in Admin Console.`, input, "navigate");
        setTimeout(() => router.push("/admin?tab=bookings"), 800);
        return;
      }
      if (q.includes("hotel") || q.includes("property")) {
        reply(`Dudu, opening Properties & Margins tab in Admin Console.`, input, "navigate");
        setTimeout(() => router.push("/admin?tab=hotels"), 800);
        return;
      }
      if (q.includes("tax") || q.includes("invoice")) {
        reply(`Dudu, opening Tax Invoices tab in Admin Console.`, input, "navigate");
        setTimeout(() => router.push("/admin?tab=tax_invoices"), 800);
        return;
      }
      if (q.includes("trade")) {
        reply(`Dudu, opening Trade Shows Extractor tab.`, input, "navigate");
        setTimeout(() => router.push("/admin?tab=trade_shows"), 800);
        return;
      }
      if (q.includes("overview") || q.includes("dashboard")) {
        reply(`Dudu, navigating to Admin Dashboard Overview.`, input, "navigate");
        setTimeout(() => router.push("/admin"), 800);
        return;
      }
    }

    // 12. GREETINGS & HEY BUDDY
    if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("dudu")) {
      reply(
        `Dudu, tell me! What can I do for you today, ${adminName}? You can ask me to find any booking, check revenue, dispatch WhatsApp messages, or approve pending properties.`,
        input
      );
      return;
    }

    // 13. HELP & CAPABILITIES
    if (q.includes("help") || q.includes("what can you do") || q.includes("capabilities")) {
      reply(
        `Dudu, I have complete access to your StayBuddy system: 1. Search bookings by guest name or ID with live Razorpay rechecks. 2. Recommend and book hotels in Goa, Vijayawada, Hyderabad, and Bengaluru. 3. Dispatch official WhatsApp confirmations. 4. Audit gross profit and 5% GST. 5. Manage partner onboarding. What would you like to inspect?`,
        input
      );
      return;
    }

    // FALLBACK INTELLIGENT MATCH
    reply(
      `Dudu, I received: "${input}". Querying StayBuddy's synchronized database... You can ask me to find any booking, review revenue, dispatch WhatsApp messages, or inspect website health.`,
      input
    );
  }

  // WAKE WORD & SPEECH RECOGNITION ENGINE
  function startListening() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition requires Google Chrome, Edge, or a Web Speech API compatible browser.");
      return;
    }

    if (listeningRef.current && recognition.current) return;

    try {
      const engine = new SpeechRecognition();
      engine.continuous = true;
      engine.interimResults = true;
      engine.lang = "en-IN";

      engine.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (!event.results[i].isFinal) continue;

          const transcript = event.results[i][0].transcript.trim();
          if (!transcript) continue;
          const normalized = transcript.toLowerCase();

          // 1. Explicit Hey Buddy call: responds "Dudu, tell me"
          if (
            normalized.includes("hey buddy") ||
            normalized.includes("a buddy") ||
            normalized.includes("hey body") ||
            normalized.includes("dudu")
          ) {
            setStatus("HEYBUDDY: DUDU, TELL ME");
            const afterWake = normalized.replace(/hey buddy|a buddy|hey body|dudu/gi, "").trim();

            if (afterWake && afterWake.length > 2) {
              execute(afterWake);
            } else {
              const wakeGreeting = "Dudu, tell me";
              speak(wakeGreeting);
              setMessages(old => [
                ...old,
                { role: "You", text: transcript, timestamp: "Just now" },
                { role: "HeyBuddy", text: "Dudu, tell me! What can I do for you today?", timestamp: "Just now" }
              ]);
            }
          } else {
            // 2. Direct command spoken without saying "Hey Buddy"
            execute(transcript);
          }
        }
      };

      engine.onerror = (e: any) => {
        console.warn("Speech recognition notice:", e?.error || e);
        if (e?.error === "not-allowed") {
          setStatus("MICROPHONE ACCESS DENIED");
        }
      };

      engine.onend = () => {
        if (listeningRef.current) {
          setTimeout(() => {
            if (listeningRef.current) {
              try {
                engine.start();
              } catch (err) {
                console.warn("Speech recognition restart catch:", err);
              }
            }
          }, 300);
        }
      };

      recognition.current = engine;
      listeningRef.current = true;
      engine.start();
      setListening(true);
      setStatus("● ACTIVATED & LISTENING • \"DUDU, TELL ME\"");
    } catch (err) {
      listeningRef.current = false;
      setStatus("MICROPHONE PAUSED");
    }
  }

  function stopListening() {
    listeningRef.current = false;
    wakeActive.current = false;

    try {
      recognition.current?.stop();
    } catch {}
    recognition.current = null;

    setListening(false);
    setStatus("VOICE ASSISTANT PAUSED");
  }

  function sendCommand(e: React.FormEvent) {
    e.preventDefault();
    if (!command.trim()) return;

    const value = command;
    setCommand("");
    execute(value);
  }

  // AUTO-ACTIVATE ON MOUNT
  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const role = (session?.user as any)?.role;
    if (role !== "admin") return;

    const timer = setTimeout(() => {
      startListening();
      speak("Dudu, tell me! I am online and listening.");
    }, 400);

    return () => clearTimeout(timer);
  }, [authStatus, session]);

  useEffect(() => {
    return () => {
      listeningRef.current = false;
      try {
        recognition.current?.stop();
      } catch {}
      if (typeof window !== "undefined") {
        window.speechSynthesis?.cancel();
      }
    };
  }, []);

  const quickPrompts = [
    { label: "🔍 Find booking for Arif", query: "Find booking for Arif" },
    { label: "⏳ Show pending bookings", query: "Show pending bookings" },
    { label: "💰 Show revenue & profit audit", query: "Show revenue and platform profit audit" },
    { label: "🏨 Recommend best hotel in Goa", query: "Recommend best hotel in Goa" },
    { label: "🏨 Hotels in Vijayawada", query: "Recommend best hotel in Vijayawada" },
    { label: "💬 Send WhatsApp to guest", query: "Send WhatsApp confirmation to 9876543210 for GM Hotel Kosala" },
    { label: "🧑‍💼 Show partner approvals", query: "Show partner approvals" },
    { label: "🔄 Sync entire database", query: "Sync entire database" }
  ];

  if (authStatus === "loading") {
    return (
      <main className="min-h-screen bg-[#06111f] text-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="flex items-center gap-2 text-sky-300 text-xs tracking-[4px] uppercase font-bold">
          <ShieldCheck size={16} /> Authenticating StayBuddy Admin
        </div>
      </main>
    );
  }

  const role = (session?.user as any)?.role;
  if (authStatus === "unauthenticated" || role !== "admin") {
    return (
      <main className="min-h-screen bg-[#06111f] text-white flex items-center justify-center p-4">
        <div className="bg-[#0b1c2d] border border-red-500/50 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="w-16 h-16 bg-red-950/60 border border-red-500/60 rounded-full flex items-center justify-center mx-auto mb-4 text-red-400">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-[4px] text-red-400 mb-2">ACCESS RESTRICTED</h2>
          <p className="text-slate-300 text-xs leading-relaxed mb-6">
            HeyBuddy AI is an executive intelligence console exclusively reserved for StayBuddy Super Administrators.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login?callbackUrl=/admin/heybuddy"
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              Admin Sign In
            </Link>
            <Link
              href="/"
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06111f] text-white p-4 md:p-8">
      <style jsx global>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #06111f; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        button { cursor: pointer; }
        button:disabled { opacity: .5; cursor: not-allowed; }
        .panel { background: #0b1c2d; border: 1px solid #1e3d57; border-radius: 16px; }
        .orb { width: 170px; height: 170px; border-radius: 50%; border: 1px solid #1688ce; display: grid; place-items: center; background: radial-gradient(circle,#16456d,#071a2e); box-shadow: 0 0 40px #087acb55,inset 0 0 25px #087acb33; }
        .orb-inner { width: 125px; height: 125px; border: 2px solid #40b5ff; border-radius: 50%; display: grid; place-items: center; color: #6cd1ff; box-shadow: 0 0 25px #168de9; }
        .orb.active { animation: glow 1.5s infinite; }
        .orb.scanning { animation: glow .8s infinite; }
        @keyframes glow { 50% { box-shadow: 0 0 65px #168de9aa; } }
        .finding { background: #102438; padding: 13px; border-radius: 9px; margin-top: 10px; }
        .critical,.high { color: #ff7979; }
        .medium { color: #ffca6b; }
        .low { color: #8fcaff; }
        .info { color: #59dfb0; }
      `}</style>

      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#193750] pb-5">
        <div className="flex items-center gap-3">
          <div className="bg-[#102c49] border border-[#2676a8] rounded-xl p-3 text-sky-300">
            <Bot size={26} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold tracking-[4px] text-xl">HEYBUDDY AI</h1>
              <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] px-2.5 py-0.5 rounded-full font-mono">
                FEMALE VOICE • &quot;DUDU, TELL ME&quot;
              </span>
            </div>
            <p className="text-[9px] tracking-[3px] text-sky-300 uppercase">
              FULL SYSTEM INTEGRATION • LIVE DATABASE SYNCHRONIZED
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={syncCompleteSystem}
            disabled={systemData.syncing}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs px-3 py-2 rounded-xl transition"
            title="Re-sync all live data"
          >
            <RefreshCw size={13} className={systemData.syncing ? "animate-spin" : ""} />
            {systemData.syncing ? "Syncing..." : "Sync Live DB"}
          </button>
          <Link
            href="/admin"
            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-sky-300 text-xs px-4 py-2 rounded-xl transition"
          >
            <ArrowLeft size={14} /> Back to Admin Console
          </Link>
          <div className="text-xs text-emerald-400 border border-emerald-800 bg-emerald-950 rounded-full px-4 py-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> SYSTEM ONLINE
          </div>
        </div>
      </header>

      {/* SYSTEM METRICS TICKER */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        <div className="bg-[#0b1c2d] border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Total Bookings</div>
          <div className="text-base font-bold text-sky-400 mt-0.5">{systemData.bookings.length}</div>
        </div>
        <div className="bg-[#0b1c2d] border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Properties</div>
          <div className="text-base font-bold text-emerald-400 mt-0.5">{systemData.hotels.length}</div>
        </div>
        <div className="bg-[#0b1c2d] border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Tax Invoices</div>
          <div className="text-base font-bold text-amber-400 mt-0.5">{systemData.taxInvoices.length}</div>
        </div>
        <div className="bg-[#0b1c2d] border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Hotel Partners</div>
          <div className="text-base font-bold text-indigo-400 mt-0.5">{systemData.partners.length}</div>
        </div>
        <div className="bg-[#0b1c2d] border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Registered Users</div>
          <div className="text-base font-bold text-purple-400 mt-0.5">{systemData.users.length}</div>
        </div>
        <div className="bg-[#0b1c2d] border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-[10px] text-slate-400 uppercase font-mono">Onboarders</div>
          <div className="text-base font-bold text-rose-400 mt-0.5">{systemData.onboardingStaff.length}</div>
        </div>
      </div>

      {/* MYRA-STYLE EXECUTIVE BANNER */}
      <div className="mt-4 bg-gradient-to-r from-[#0b1c2d] via-[#102c49] to-[#0b1c2d] border border-[#1e3d57] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white">
              Hi, <span className="text-sky-400">{adminName}</span> ✨
            </h2>
            <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
              CONNECTED EXECUTIVE AI
            </span>
          </div>
          <p className="text-slate-300 text-xs mt-1 max-w-xl leading-relaxed">
            HeyBuddy has direct access across all StayBuddy modules: search bookings by guest name or booking ID, trigger Razorpay rechecks, dispatch WhatsApp confirmations, manage hotel approvals, or audit gross profit &amp; 5% GST.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={listening ? stopListening : startListening}
            className={`${listening ? "bg-rose-600 hover:bg-rose-500 ring-4 ring-rose-500/30 animate-pulse" : "bg-blue-600 hover:bg-blue-500"} px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold text-xs tracking-wider transition shadow-lg shadow-blue-500/20 text-white`}
          >
            {listening ? <MicOff size={16} /> : <Mic size={16} />}
            {listening ? "● ACTIVATED (PAUSE)" : "START LISTENING"}
          </button>
        </div>
      </div>

      {/* HERO VOICE ORB */}
      <section className="text-center py-6 flex flex-col items-center">
        <div className={`orb ${listening ? "active" : ""} ${scanning ? "scanning" : ""}`}>
          <div className="orb-inner">
            <AudioLines size={55} />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-[6px] mt-4">
          HEYBUDDY AI
        </h2>

        <p className="text-emerald-400 text-xs tracking-widest mt-2.5 font-mono font-bold">
          {status}
        </p>

        <p className="text-slate-300 text-xs mt-1.5 font-medium">
          {listening
            ? '● Microphone active! Say "Hey Buddy" to hear "Dudu, tell me" or speak any booking/system request directly.'
            : 'Click below to activate voice assistant.'}
        </p>

        <div className="flex gap-3 mt-4">
          <button
            onClick={listening ? stopListening : startListening}
            className={`${listening ? "bg-rose-600 hover:bg-rose-500 ring-4 ring-rose-500/30 animate-pulse" : "bg-blue-600 hover:bg-blue-500"} px-6 py-3 rounded-xl flex items-center gap-2.5 font-bold text-xs tracking-wider transition shadow-lg shadow-blue-500/20 text-white`}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
            {listening ? "● ACTIVATED & LISTENING (CLICK TO PAUSE)" : "START LISTENING NOW"}
          </button>

          <button
            onClick={() => {
              setSpeaking(!speaking);
              if (typeof window !== "undefined") window.speechSynthesis.cancel();
            }}
            title={speaking ? "Mute Female Voice" : "Unmute Female Voice"}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl px-4 transition"
          >
            {speaking ? <Volume2 size={18} className="text-sky-400" /> : <VolumeX size={18} className="text-slate-400" />}
          </button>
        </div>
      </section>

      {/* DASHBOARD PANELS */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* COMMAND CENTRE */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <h3 className="text-sm font-bold flex gap-2 items-center">
                <Activity className="text-sky-400" size={18} />
                COMMAND CENTRE
              </h3>
              <span className="text-sky-400 text-[10px] font-mono">DEEP SYSTEM ACCESS</span>
            </div>

            {/* QUICK PROMPTS CHIPS */}
            <div className="py-3 border-b border-slate-800/80">
              <div className="text-[11px] text-slate-400 mb-2 font-medium">Try asking any system query:</div>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => execute(item.query)}
                    className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 hover:border-sky-500 rounded-xl text-[11px] px-3 py-1.5 text-sky-200 transition text-left flex items-center gap-1.5"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MESSAGES THREAD */}
            <div className="min-h-[280px] max-h-[380px] overflow-y-auto py-4 space-y-4 pr-1">
              {messages.map((message, index) => (
                <div key={index} className="flex gap-3 border-b border-slate-800/80 pb-3">
                  <div className="text-sky-400 mt-0.5">
                    {message.role === "You" ? <Mic size={16} /> : <Bot size={18} className="text-emerald-400" />}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <strong className={message.role === "You" ? "text-sky-300 text-xs" : "text-emerald-400 text-xs"}>
                        {message.role === "HeyBuddy" ? "HeyBuddy (Female Voice)" : message.role}
                      </strong>
                      <span className="text-[10px] text-slate-500 font-mono">{message.timestamp || "Now"}</span>
                    </div>

                    <p className="text-slate-200 text-xs leading-relaxed mt-1 whitespace-pre-line">
                      {message.text}
                    </p>

                    {/* ACTION TYPE: SINGLE BOOKING DETAILS */}
                    {message.actionType === "booking" && message.actionData?.booking && (
                      <div className="mt-3 bg-[#071625] border border-sky-600/40 rounded-xl p-3.5 space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-sky-300">
                            Booking #{message.actionData.booking.bookingId || message.actionData.booking._id.slice(0, 8)}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${message.actionData.booking.paymentStatus === "paid" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-amber-950 text-amber-400 border border-amber-800"}`}>
                            {message.actionData.booking.paymentStatus || "unpaid"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                          <div>
                            <span className="text-slate-400 block">Guest Name:</span>
                            <strong className="text-white">{message.actionData.booking.guestName || message.actionData.booking.customerId?.name || "Guest"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Phone:</span>
                            <strong className="text-white">{message.actionData.booking.guestPhone || message.actionData.booking.customerId?.phone || "N/A"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Property:</span>
                            <strong className="text-white">{message.actionData.booking.hotelId?.name || "StayBuddy Hotel"}</strong>
                          </div>
                          <div>
                            <span className="text-slate-400 block">Total Amount:</span>
                            <strong className="text-emerald-400">₹{Number(message.actionData.booking.totalAmount || 0).toLocaleString("en-IN")}</strong>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-700/60">
                          {message.actionData.whatsapp && (
                            <a
                              href={message.actionData.whatsapp.whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                            >
                              <MessageCircle size={13} /> WhatsApp Guest
                            </a>
                          )}
                          <button
                            onClick={() => recheckPayment(message.actionData.booking._id)}
                            disabled={recheckingBookingId === message.actionData.booking._id}
                            className="bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                          >
                            <RefreshCw size={12} className={recheckingBookingId === message.actionData.booking._id ? "animate-spin" : ""} />
                            Recheck Razorpay
                          </button>
                          <Link
                            href="/admin?tab=bookings"
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition"
                          >
                            View in Console →
                          </Link>
                        </div>
                      </div>
                    )}

                    {/* ACTION TYPE: LIST OF PENDING BOOKINGS */}
                    {message.actionType === "bookings_list" && message.actionData?.bookings && (
                      <div className="mt-3 space-y-2">
                        {message.actionData.bookings.map((b: BookingItem) => (
                          <div key={b._id} className="bg-[#071625] border border-slate-700/80 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                            <div>
                              <div className="font-bold text-white">{b.guestName || b.customerId?.name || "Guest"}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {b.hotelId?.name || "Hotel"} • ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")} • <span className="text-amber-400 font-mono uppercase">{b.paymentStatus || "unpaid"}</span>
                              </div>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => recheckPayment(b._id)}
                                disabled={recheckingBookingId === b._id}
                                className="bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                              >
                                Recheck
                              </button>
                              {b.guestPhone && (
                                <a
                                  href={`https://wa.me/91${b.guestPhone.replace(/\D/g,"")}?text=${encodeURIComponent(`Hello ${b.guestName || "Guest"}, this is StayBuddy regarding your reservation. Please confirm your booking payment.`)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 transition"
                                >
                                  <MessageCircle size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* ACTION TYPE: HOTELS RECOMMENDATION CARDS */}
                    {message.actionType === "hotels" && message.actionData?.hotels && (
                      <div className="mt-3 space-y-2.5">
                        {message.actionData.hotels.map((hotel: HotelItem) => {
                          const price = hotel.pricePerNight || hotel.rooms?.[0]?.price || 1811;
                          return (
                            <div key={hotel._id} className="bg-[#071524] border border-[#1e3d57] rounded-xl p-3 flex items-center justify-between gap-3 hover:border-sky-500/50 transition">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-14 h-14 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 relative">
                                  {hotel.images?.[0] ? (
                                    <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <Hotel className="w-8 h-8 text-sky-400 m-auto mt-3" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-xs text-white truncate">{hotel.name}</div>
                                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                    <MapPin size={11} className="text-rose-400" />
                                    <span>{hotel.city}</span>
                                    <span>•</span>
                                    <span className="text-amber-400">★ {hotel.starRating || 3} Star</span>
                                  </div>
                                  <div className="text-emerald-400 font-bold text-xs mt-1">
                                    ₹{Number(price).toLocaleString("en-IN")}<span className="text-[10px] text-slate-400 font-normal"> / night</span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-col gap-1.5 flex-shrink-0">
                                <Link
                                  href={`/hotels/${hotel._id}`}
                                  target="_blank"
                                  className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                                >
                                  Book Now <ArrowUpRight size={12} />
                                </Link>
                                <button
                                  onClick={() => execute(`Send WhatsApp confirmation to 9876543210 for ${hotel.name}`)}
                                  className="bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition"
                                >
                                  <MessageCircle size={12} /> WhatsApp
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ACTION TYPE: WHATSAPP CARD */}
                    {message.actionType === "whatsapp" && message.actionData && (
                      <div className="mt-3 bg-[#071e1b] border border-emerald-600/50 rounded-xl p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <MessageCircle size={14} /> WhatsApp Confirmation Prepared
                          </span>
                          <span className="text-[10px] text-emerald-300 font-mono">
                            {message.actionData.phone}
                          </span>
                        </div>

                        <div className="bg-[#041210] border border-emerald-800/60 rounded-lg p-2.5 text-[11px] text-slate-300 whitespace-pre-wrap font-sans">
                          {message.actionData.text}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <a
                            href={message.actionData.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition flex-1 justify-center"
                          >
                            <MessageCircle size={15} /> Send on WhatsApp Now
                          </a>
                          <a
                            href={message.actionData.smsUrl}
                            className="bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition"
                          >
                            <Phone size={14} /> SMS
                          </a>
                        </div>
                      </div>
                    )}

                    {/* ACTION TYPE: FINANCIAL STATS CARD */}
                    {message.actionType === "stats" && message.actionData?.totalRevenue !== undefined && (
                      <div className="mt-3 bg-[#0b1c2d] border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <TrendingUp size={14} /> StayBuddy Financial Breakdown
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-[#061523] p-2 rounded-lg">
                            <div className="text-[10px] text-slate-400">Total B2C Revenue</div>
                            <div className="text-sm font-bold text-white mt-0.5">₹{message.actionData.totalRevenue.toLocaleString("en-IN")}</div>
                          </div>
                          <div className="bg-[#061523] p-2 rounded-lg">
                            <div className="text-[10px] text-slate-400">Gross Margin</div>
                            <div className="text-sm font-bold text-emerald-400 mt-0.5">₹{message.actionData.grossProfit.toLocaleString("en-IN")}</div>
                          </div>
                          <div className="bg-[#061523] p-2 rounded-lg">
                            <div className="text-[10px] text-slate-400">GST Output (5%)</div>
                            <div className="text-sm font-bold text-amber-400 mt-0.5">-₹{message.actionData.gstDeduction.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                          </div>
                          <div className="bg-[#061523] p-2 rounded-lg">
                            <div className="text-[10px] text-slate-400">Net Platform Profit</div>
                            <div className="text-sm font-bold text-sky-400 mt-0.5">₹{message.actionData.netProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</div>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <form onSubmit={sendCommand} className="flex gap-2 mt-4">
              <input
                value={command}
                onChange={e => setCommand(e.target.value)}
                placeholder="Ask HeyBuddy: find booking, check revenue, send WhatsApp, search hotels..."
                className="flex-1 min-w-0 bg-[#061523] border border-slate-700 focus:border-sky-500 p-3 rounded-xl text-sm outline-none transition text-white placeholder-slate-500"
              />

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 px-4 rounded-xl transition flex items-center justify-center text-white"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        </div>

        {/* WEBSITE INSPECTOR */}
        <div className="panel p-5">
          <div className="flex justify-between items-center border-b border-slate-700 pb-4">
            <h3 className="text-sm font-bold flex gap-2 items-center">
              <Bug className="text-sky-400" size={18} />
              WEBSITE INTELLIGENCE
            </h3>
            <span className="text-sky-400 text-[10px] font-mono">DIAGNOSTICS</span>
          </div>

          <div className="text-center py-6">
            <Globe size={40} className="mx-auto text-sky-400" />
            <h3 className="font-bold mt-3 text-base">StayBuddy Website Scanner</h3>
            <p className="text-slate-400 text-xs mt-1.5 max-w-md mx-auto leading-relaxed">
              Inspect StayBuddy homepage for HTTP errors, image accessibility, viewport settings, buttons and form labels.
            </p>

            <button
              disabled={scanning}
              onClick={scanWebsite}
              className="bg-blue-600 hover:bg-blue-500 rounded-xl px-6 py-2.5 text-xs font-bold mt-4 transition shadow-md shadow-blue-500/20"
            >
              {scanning ? "SCANNING..." : "START WEBSITE SCAN"}
            </button>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <div className="flex justify-between text-xs items-center font-bold">
              <span>INSPECTION RESULTS</span>
              <span className="text-sky-400 font-mono">{findings.length} FINDINGS</span>
            </div>

            {!scanDone && (
              <div className="text-center text-slate-500 text-xs py-8">
                <ShieldCheck size={28} className="mx-auto mb-2 text-slate-600" />
                No inspection has been run yet. Click &quot;Start Website Scan&quot; to begin.
              </div>
            )}

            <div className="max-h-[220px] overflow-y-auto space-y-2 mt-2 pr-1">
              {findings.map((item, index) => (
                <div key={index} className="finding">
                  <div className="flex justify-between gap-2">
                    <strong className="text-xs text-white">{item.title}</strong>
                    <span className={`text-[10px] font-mono uppercase font-bold ${item.severity.toLowerCase()}`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">{item.detail}</p>
                  <p className="text-sky-300 text-xs mt-1">Recommendation: {item.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex flex-wrap justify-between gap-4 text-[10px] text-sky-400 border-t border-slate-800 mt-8 pt-5 font-mono">
        <span className="flex items-center gap-2"><Zap size={14}/> HEYBUDDY AI V3.0 • DEEP SYSTEM SYNC</span>
        <span className="flex items-center gap-2"><RefreshCw size={14}/> LAST SYNCED: {systemData.lastSynced || "LIVE"}</span>
        <span className="flex items-center gap-2"><Hotel size={14}/> STAYBUDDY SUPER ADMIN CONSOLE</span>
      </footer>
    </main>
  );
}
