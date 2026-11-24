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
  TrendingUp, AlertTriangle, Check, Clock, UserCheck,
  Languages, Flame
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
  teluguText?: string;
  timestamp?: string;
  actionType?: "hotels" | "whatsapp" | "booking" | "bookings_list" | "stats" | "diagnostic" | "partners" | "navigate";
  actionData?: any;
};

export default function HeyBuddyPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(true);
  const [isSpeakingNow, setIsSpeakingNow] = useState(false);
  const [language, setLanguage] = useState<"en" | "te">("en");
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
      text: `Hi, ${adminName} ✨ I am HeyBuddy, your StayBuddy Executive AI. I speak both English and Telugu! Say "Hey Buddy" for "Dudu, tell me" or say "Dude unnava" for Telugu mode. Everything you ask scrolls right into your view!`,
      teluguText: `నమస్తే ${adminName} గారు! నేను స్టేబడ్డీ AI అసిస్టెంట్. 'Dude unnava' అంటే నేను తెలుగులో మాట్లాడుతాను.`,
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

  // DEEP SYSTEM SYNCHRONIZATION
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

      setStatus(language === "te" ? "● తెలుగు లైవ్ సింక్ పూర్తయింది" : "● FULLY SYNCHRONIZED • \"DUDU, TELL ME\"");
    } catch (err) {
      console.error("System sync error:", err);
      setSystemData(prev => ({ ...prev, syncing: false }));
      setStatus("● SYSTEM READY");
    }
  }, [language]);

  useEffect(() => {
    if (authStatus === "authenticated" && (session?.user as any)?.role === "admin") {
      syncCompleteSystem();
    }
  }, [authStatus, session, syncCompleteSystem]);

  // LOAD VOICES
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

  function getFemaleVoice(preferTelugu = false): SpeechSynthesisVoice | null {
    if (!availableVoices.length) return null;

    if (preferTelugu) {
      // Look for Telugu voice
      const teVoice = availableVoices.find(v => v.lang.startsWith("te"));
      if (teVoice) return teVoice;
    }

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

  // NATURAL FEMALE SPEECH SYNTHESIS (ENGLISH & TELUGU)
  function speak(text: string, spokenTextTeluguAlternative?: string) {
    if (!speaking || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      setIsSpeakingNow(true);

      const hasTeluguVoice = availableVoices.some(v => v.lang.startsWith("te"));
      const isTeluguTarget = language === "te" || /[\u0C00-\u0C7F]/.test(text);

      // If browser lacks Telugu voice, speak phonetically with en-IN female voice
      let textToSpeak = text;
      if (isTeluguTarget && !hasTeluguVoice && spokenTextTeluguAlternative) {
        textToSpeak = spokenTextTeluguAlternative;
      }

      // Clean speech text
      const cleanText = textToSpeak
        .replace(/https?:\/\/\S+/g, "")
        .replace(/[*_#`~]/g, "")
        .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, "")
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      const femaleVoice = getFemaleVoice(isTeluguTarget);

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }

      if (isTeluguTarget && hasTeluguVoice) {
        utterance.lang = "te-IN";
      } else {
        utterance.lang = femaleVoice?.lang || "en-IN";
      }

      utterance.rate = isTeluguTarget ? 0.94 : 0.98;
      utterance.pitch = isTeluguTarget ? 1.3 : 1.25;

      utterance.onend = () => setIsSpeakingNow(false);
      utterance.onerror = () => setIsSpeakingNow(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      setIsSpeakingNow(false);
    }
  }

  // AUTO-SCROLL TO ACTIVE ITEM
  const scrollToActiveResult = useCallback(() => {
    setTimeout(() => {
      const activeEl = document.getElementById("active-speaking-card");
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 180);
  }, []);

  function reply(
    text: string,
    originalCommand: string,
    actionType?: "hotels" | "whatsapp" | "booking" | "bookings_list" | "stats" | "diagnostic" | "partners" | "navigate",
    actionData?: any,
    teluguText?: string,
    phoneticTelugu?: string
  ) {
    setMessages(old => [
      ...old,
      { role: "You", text: originalCommand, timestamp: "Just now" },
      { role: "HeyBuddy", text, teluguText, timestamp: "Just now", actionType, actionData }
    ]);

    setStatus(language === "te" ? "● తెలుగు రెస్పాన్స్ సిద్ధం" : "● RESPONSE READY");

    if (language === "te" && teluguText) {
      speak(teluguText, phoneticTelugu || teluguText);
    } else {
      speak(text);
    }

    scrollToActiveResult();
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
    scrollToActiveResult();
    return issues;
  }

  // PREPARE WHATSAPP
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

  // DEEP MULTILINGUAL SYSTEM INTELLIGENCE ENGINE
  async function execute(input: string) {
    const q = input.trim().toLowerCase();
    if (!q) return;

    setStatus("PROCESSING INTELLIGENCE...");

    // 0. TELUGU WAKE WORD DETECTION: "dude unava" / "dude unnava" / "dudu unnava"
    if (
      q.includes("dude unava") ||
      q.includes("dude unnava") ||
      q.includes("dudu unava") ||
      q.includes("dudu unnava") ||
      q.includes("unnava") ||
      q.includes("telugu")
    ) {
      setLanguage("te");
      setStatus("● TELUGU MODE ACTIVE • డ్యూడ్, ఉన్నాను!");

      const teluguAns = "హా డ్యూడ్, ఉన్నాను! చెప్పండి, మీకు ఏం కావాలి? హోటల్స్, బుకింగ్స్, లేదా రెవెన్యూ వివరాలు చూడాలా?";
      const phonetic = "Haa dude, unnanu! Cheppandi, meeku em kavali? Hotels, bookings, leda revenue vivaraalu choodaala?";

      reply(
        "Yes Dude, I am here! What can I do for you? I can show hotels, bookings, or revenue in Telugu.",
        input,
        undefined,
        undefined,
        teluguAns,
        phonetic
      );
      return;
    }

    // ENGLISH SWITCH
    if (q.includes("speak in english") || q.includes("switch to english")) {
      setLanguage("en");
      setStatus("● ENGLISH MODE ACTIVE • \"DUDU, TELL ME\"");
      reply("Switched back to English! Dudu, tell me what you need.", input);
      return;
    }

    // 1. REFRESH / SYNC
    if (q.includes("sync") || q.includes("refresh") || q.includes("reload")) {
      await syncCompleteSystem();
      const eng = "Dudu, system data has been completely re-synchronized with StayBuddy's live database.";
      const tel = "డ్యూడ్, స్టేబడ్డీ లైవ్ డేటాబేస్ మొత్తం రీ-సింక్ అయ్యింది.";
      reply(eng, input, undefined, undefined, tel, "Dude, StayBuddy live database motham re-sync ayyindi.");
      return;
    }

    // 2. SEARCH SPECIFIC BOOKING
    if (
      q.includes("find booking") ||
      q.includes("search booking") ||
      q.includes("booking for") ||
      q.includes("check booking") ||
      q.includes("booking details") ||
      (q.includes("booking") && (q.match(/\b\d{4,}\b/) || q.match(/sb-/i)))
    ) {
      const bookings = systemData.bookings;
      let matchedBooking: BookingItem | undefined;

      const queryIdMatch = input.match(/sb-?\d+/i);
      if (queryIdMatch) {
        const idSearch = queryIdMatch[0].toLowerCase().replace("-", "");
        matchedBooking = bookings.find(b =>
          (b._id || "").toLowerCase().includes(idSearch) ||
          (b.bookingId || "").toLowerCase().replace("-", "").includes(idSearch)
        );
      }

      if (!matchedBooking) {
        const words = input.replace(/find|search|check|booking|for|details|of|the|with|chupinchu/gi, "").trim().split(" ");
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
        const hotelName = matchedBooking.hotelId?.name || "StayBuddy Hotel";
        const amt = Number(matchedBooking.totalAmount || 0);
        const statusStr = matchedBooking.status || "confirmed";
        const payStatus = matchedBooking.paymentStatus || "unpaid";

        const eng = `Dudu, I found booking ${matchedBooking.bookingId || matchedBooking._id.slice(0, 8)} for ${guestName} at ${hotelName}. Status is ${statusStr.toUpperCase()}, payment is ${payStatus.toUpperCase()} for ₹${amt.toLocaleString("en-IN")}. Details are scrolling into view below.`;
        const tel = `డ్యూడ్, ${guestName} గారి బుకింగ్ ${hotelName} లో దొరికింది. అమౌంట్ ₹${amt.toLocaleString("en-IN")}, పేమెంట్ ${payStatus.toUpperCase()}. స్క్రీన్ పై వివరాలు ఉన్నాయి.`;
        const phonetic = `Dude, ${guestName} gaari booking ${hotelName} lo dorikindi. Amount ₹${amt}, payment ${payStatus}. Screen pai vivaraalu unnaayi.`;

        const waData = prepareWhatsApp(
          matchedBooking.guestPhone || matchedBooking.customerId?.phone || "9876543210",
          guestName,
          hotelName,
          matchedBooking.bookingId || matchedBooking._id,
          amt
        );

        reply(eng, input, "booking", { booking: matchedBooking, whatsapp: waData }, tel, phonetic);
        return;
      }
    }

    // 3. PENDING BOOKINGS OR UNPAID RESERVATIONS
    if (q.includes("pending booking") || q.includes("unpaid") || q.includes("failed payment") || q.includes("recheck")) {
      const pending = systemData.bookings.filter(b => b.status === "pending" || b.paymentStatus !== "paid");
      if (pending.length > 0) {
        const eng = `Dudu, there are ${pending.length} bookings pending payment verification. Scrolling to the list with instant Razorpay check.`;
        const tel = `డ్యూడ్, ${pending.length} పెండింగ్ బుకింగ్స్ ఉన్నాయి. ఇక్కడ లిస్ట్ చూపిస్తున్నాను, రేజర్‌పే రీ-చెక్ చేయవచ్చు.`;
        reply(eng, input, "bookings_list", { bookings: pending.slice(0, 5) }, tel, `Dude, ${pending.length} pending bookings unnaayi.`);
      } else {
        const eng = `Dudu, all bookings in the system currently have verified payments!`;
        const tel = `డ్యూడ్, అన్ని బుకింగ్స్ పేమెంట్స్ పూర్తయి కన్ఫర్మ్ అయ్యాయి!`;
        reply(eng, input, undefined, undefined, tel, "Dude, anni bookings payments poorthayi confirm ayyaayi!");
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
      const eng = `Dudu, I have prepared the WhatsApp confirmation message for ${waData.guestName} (${waData.displayPhone}) at ${waData.hotelName}. Click Send on WhatsApp below to dispatch it!`;
      const tel = `డ్యూడ్, ${waData.guestName} కోసం ${waData.hotelName} వాట్సాప్ కన్ఫర్మేషన్ రెడీగా ఉంది. కింద ఉన్న బటన్ నొక్కి పంపవచ్చు.`;
      const phonetic = `Dude, ${waData.guestName} kosam ${waData.hotelName} WhatsApp confirmation ready gaa undi.`;

      reply(eng, input, "whatsapp", waData, tel, phonetic);
      return;
    }

    // 5. HOTEL INVENTORY & SEARCH
    if (
      q.includes("book") ||
      q.includes("recommend") ||
      q.includes("find hotel") ||
      q.includes("show hotel") ||
      q.includes("hotels in") ||
      q.includes("hotels") ||
      q.includes("hotel") ||
      q.includes("chupinchu")
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

      const eng = `Dudu, I found ${matched.length} properties in ${cityName}. The best recommendation is ${top?.name || "StayBuddy Hotel"} starting at ₹${Number(price).toLocaleString("en-IN")}/night. Scrolling down to show you!`;
      const tel = `డ్యూడ్, ${cityName} లో ${matched.length} హోటల్స్ ఉన్నాయి. బెస్ట్ హోటల్ ${top?.name || "StayBuddy Hotel"}, ప్రారంభ ధర ₹${Number(price).toLocaleString("en-IN")}. క్రింద చూడండి.`;
      const phonetic = `Dude, ${cityName} lo ${matched.length} hotels unnaayi. Best hotel ${top?.name || "StayBuddy Hotel"}, price ₹${price}. Krinda choodandi.`;

      reply(eng, input, "hotels", { hotels: matched.slice(0, 5), targetCity: cityName }, tel, phonetic);
      return;
    }

    // 6. FINANCIAL AUDIT & REVENUE
    if (q.includes("revenue") || q.includes("sales") || q.includes("profit") || q.includes("financial") || q.includes("tax") || q.includes("gst") || q.includes("dabbu")) {
      const bookings = systemData.bookings;
      const confirmedPaid = bookings.filter(b => (b.status === "confirmed" || b.status === "completed") && b.paymentStatus === "paid");
      const totalRevenue = confirmedPaid.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
      const totalB2b = confirmedPaid.reduce((acc, b) => acc + (Number(b.b2bCost) || 0), 0);
      const grossProfit = totalRevenue > totalB2b ? totalRevenue - totalB2b : 0;
      const gstDeduction = grossProfit * 0.05;
      const netProfit = grossProfit - gstDeduction;

      const eng = `Dudu, here is the complete financial audit: Total GMV is ₹${totalRevenue.toLocaleString("en-IN")} across ${confirmedPaid.length} confirmed paid bookings. Platform gross profit is ₹${grossProfit.toLocaleString("en-IN")}, with estimated net profit of ₹${netProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })} after 5% GST.`;
      const tel = `డ్యూడ్, ఇప్పటివరకు మొత్తం బుకింగ్స్ రెవెన్యూ ₹${totalRevenue.toLocaleString("en-IN")}. మన నికర లాభం (నెట్ ప్రాఫిట్) ₹${netProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })} GST 5% పోను.`;
      const phonetic = `Dude, ippativaraku motham booking revenue ₹${totalRevenue}. Mana net profit ₹${Math.round(netProfit)}.`;

      reply(eng, input, "stats", {
        totalRevenue,
        grossProfit,
        netProfit,
        gstDeduction,
        totalBookings: bookings.length,
        confirmedPaidCount: confirmedPaid.length
      }, tel, phonetic);
      return;
    }

    // 7. WEBSITE SCANNER
    if (q.includes("scan") || q.includes("website") || q.includes("bug") || q.includes("error") || q.includes("health") || q.includes("inspect")) {
      const result = await scanWebsite();
      const eng = `Dudu, website inspection is completed. I found ${result.length} diagnostic findings for the StayBuddy homepage. Full details are scrolling onto your screen.`;
      const tel = `డ్యూడ్, వెబ్‌సైట్ స్కాన్ పూర్తయ్యింది. మొత్తం ${result.length} విషయాలు గుర్తించాను. స్క్రీన్ పై చూడండి.`;
      reply(eng, input, "diagnostic", { findings: result }, tel, `Dude, website scan poorthayyindi. ${result.length} issues unnaayi.`);
      return;
    }

    // 8. NAVIGATION
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
      if (q.includes("dashboard") || q.includes("overview")) {
        reply(`Dudu, navigating to Admin Dashboard Overview.`, input, "navigate");
        setTimeout(() => router.push("/admin"), 800);
        return;
      }
    }

    // 9. GREETINGS & HEY BUDDY
    if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("dudu")) {
      const eng = `Dudu, tell me! What can I do for you today, ${adminName}? You can ask me to find any booking, check revenue, dispatch WhatsApp messages, or inspect hotels.`;
      const tel = `హా డ్యూడ్, ఉన్నాను! చెప్పండి ${adminName} గారు, మీకు ఏం కావాలి?`;
      reply(eng, input, undefined, undefined, tel, `Haa dude, unnanu! Cheppandi ${adminName} gaaru, meeku em kavali?`);
      return;
    }

    // DEFAULT FALLBACK
    const eng = `Dudu, I received: "${input}". Querying StayBuddy's synchronized database... Showing details on screen!`;
    const tel = `డ్యూడ్, మీ కమాండ్ అందింది: "${input}". డేటా వెతుకుతున్నాను, స్క్రీన్ పై చూడండి!`;
    reply(eng, input, undefined, undefined, tel, `Dude, mee command andindi. Data vethukuthunnaanu.`);
  }

  // SPEECH RECOGNITION ENGINE
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
      // Recognition works for Indian English & bilingual Telugu inputs
      engine.lang = language === "te" ? "te-IN" : "en-IN";

      engine.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (!event.results[i].isFinal) continue;

          const transcript = event.results[i][0].transcript.trim();
          if (!transcript) continue;
          const normalized = transcript.toLowerCase();

          // TELUGU WAKE WORD: "dude unava" / "dude unnava"
          if (
            normalized.includes("dude unava") ||
            normalized.includes("dude unnava") ||
            normalized.includes("dudu unava") ||
            normalized.includes("dudu unnava") ||
            normalized.includes("unnava")
          ) {
            setLanguage("te");
            setStatus("● TELUGU ACTIVATED • \"డ్యూడ్, ఉన్నాను!\"");
            const teluguGreet = "హా డ్యూడ్, ఉన్నాను! చెప్పండి, మీకు ఏం కావాలి?";
            const teluguPhonetic = "Haa dude, unnanu! Cheppandi, meeku em kavali?";
            speak(teluguGreet, teluguPhonetic);
            setMessages(old => [
              ...old,
              { role: "You", text: transcript, timestamp: "Just now" },
              { role: "HeyBuddy", text: "Yes Dude, I am here! What can I do for you?", teluguText: teluguGreet, timestamp: "Just now" }
            ]);
            scrollToActiveResult();
            return;
          }

          // ENGLISH WAKE WORD: "hey buddy"
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
              scrollToActiveResult();
            }
          } else {
            // Direct command
            execute(transcript);
          }
        }
      };

      engine.onerror = (e: any) => {
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
      setStatus(language === "te" ? "● తెలుగు లిజనింగ్ ఆన్ • \"డ్యూడ్, ఉన్నాను\"" : "● ACTIVATED & LISTENING • \"DUDU, TELL ME\"");
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
    { label: "🗣️ 'Dude unnava' (Telugu)", query: "dude unnava" },
    { label: "🔍 Find booking for Arif", query: "Find booking for Arif" },
    { label: "⏳ Show pending bookings", query: "Show pending bookings" },
    { label: "💰 Show revenue & profit audit", query: "Show revenue and platform profit audit" },
    { label: "🏨 Recommend best hotel in Goa", query: "Recommend best hotel in Goa" },
    { label: "🏨 Hotels in Vijayawada", query: "Recommend best hotel in Vijayawada" },
    { label: "💬 Send WhatsApp to guest", query: "Send WhatsApp confirmation to 9876543210 for GM Hotel Kosala" },
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

        /* CRAZY HIGH-TECH AI ORB WITH SOUND WAVE RIPPLES */
        .orb-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 220px;
          height: 220px;
          margin: 0 auto;
        }
        .orb-ripple {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 2px solid rgba(56, 189, 248, 0.4);
          animation: ripple 2s cubic-bezier(0, 0.2, 0.8, 1) infinite;
        }
        .orb-ripple:nth-child(2) {
          animation-delay: 0.6s;
          border-color: rgba(167, 139, 250, 0.35);
        }
        .orb-ripple:nth-child(3) {
          animation-delay: 1.2s;
          border-color: rgba(52, 211, 153, 0.35);
        }
        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .orb {
          width: 170px;
          height: 170px;
          border-radius: 50%;
          border: 2px solid #38bdf8;
          display: grid;
          place-items: center;
          background: radial-gradient(circle, #0e3d64 0%, #06182c 60%, #030d17 100%);
          box-shadow: 0 0 50px rgba(56, 189, 248, 0.4), inset 0 0 30px rgba(56, 189, 248, 0.3);
          position: relative;
          z-index: 2;
          transition: all 0.3s ease;
        }
        .orb.active {
          animation: cyber-glow 1.4s ease-in-out infinite alternate;
          border-color: #38bdf8;
        }
        .orb.speaking {
          animation: cyber-glow-speaking 0.8s ease-in-out infinite alternate;
          border-color: #34d399;
          box-shadow: 0 0 60px rgba(52, 211, 153, 0.6), inset 0 0 35px rgba(52, 211, 153, 0.4);
        }
        @keyframes cyber-glow {
          0% { box-shadow: 0 0 30px rgba(56, 189, 248, 0.3), inset 0 0 20px rgba(56, 189, 248, 0.2); }
          100% { box-shadow: 0 0 65px rgba(56, 189, 248, 0.7), inset 0 0 40px rgba(56, 189, 248, 0.4); }
        }
        @keyframes cyber-glow-speaking {
          0% { transform: scale(0.98); box-shadow: 0 0 40px rgba(52, 211, 153, 0.4); }
          100% { transform: scale(1.05); box-shadow: 0 0 80px rgba(52, 211, 153, 0.8), 0 0 30px #38bdf8; }
        }

        .orb-inner {
          width: 125px;
          height: 125px;
          border: 2px solid #60a5fa;
          border-radius: 50%;
          display: grid;
          place-items: center;
          color: #6cd1ff;
          box-shadow: 0 0 25px rgba(56, 189, 248, 0.5);
          background: rgba(6, 17, 31, 0.6);
        }

        /* LIVE AUDIO EQUALIZER BARS */
        .equalizer-bars {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          height: 40px;
        }
        .eq-bar {
          width: 4px;
          background: #38bdf8;
          border-radius: 4px;
          animation: eq-bounce 0.6s ease-in-out infinite alternate;
        }
        .eq-bar:nth-child(1) { height: 12px; animation-delay: 0.1s; }
        .eq-bar:nth-child(2) { height: 24px; animation-delay: 0.25s; background: #34d399; }
        .eq-bar:nth-child(3) { height: 36px; animation-delay: 0.15s; background: #60a5fa; }
        .eq-bar:nth-child(4) { height: 28px; animation-delay: 0.35s; background: #a78bfa; }
        .eq-bar:nth-child(5) { height: 16px; animation-delay: 0.2s; background: #38bdf8; }
        @keyframes eq-bounce {
          0% { transform: scaleY(0.3); }
          100% { transform: scaleY(1.2); }
        }

        /* HIGHLIGHTED RESPONSE CARD PULSE */
        .active-response-highlight {
          border-color: #38bdf8 !important;
          box-shadow: 0 0 25px rgba(56, 189, 248, 0.35), inset 0 0 15px rgba(56, 189, 248, 0.1);
          animation: card-pop 0.4s ease-out;
        }
        @keyframes card-pop {
          0% { transform: translateY(6px); opacity: 0.8; }
          100% { transform: translateY(0); opacity: 1; }
        }

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
              <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
                <Languages size={12} /> {language === "te" ? "TELUGU • తెలుగు" : "ENGLISH • \"DUDU, TELL ME\""}
              </span>
            </div>
            <p className="text-[9px] tracking-[3px] text-sky-300 uppercase">
              DEEP SYSTEM SYNC • VOICE SCROLL • FEMALE AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nextLang = language === "en" ? "te" : "en";
              setLanguage(nextLang);
              if (nextLang === "te") {
                speak("డ్యూడ్, నేను తెలుగులో మాట్లాడుతాను. చెప్పండి!", "Dude, nenu Telugu lo maatlaaduthaanu. Cheppandi!");
              } else {
                speak("Switched to English. Dudu, tell me!");
              }
            }}
            className="flex items-center gap-1.5 bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-600/60 text-indigo-300 text-xs px-3 py-2 rounded-xl transition font-bold"
          >
            <Languages size={14} /> {language === "en" ? "Switch to Telugu (తెలుగు)" : "Switch to English"}
          </button>
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
            <span className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Sparkles size={11} /> TELUGU &amp; ENGLISH VOICE
            </span>
          </div>
          <p className="text-slate-300 text-xs mt-1 max-w-xl leading-relaxed">
            Say <strong className="text-emerald-400">&quot;Dude unnava&quot;</strong> for Telugu voice assistance (&quot;డ్యూడ్, ఉన్నాను!&quot;) or <strong className="text-sky-300">&quot;Hey Buddy&quot;</strong> for English (&quot;Dudu, tell me&quot;). Every result automatically scrolls directly into view!
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

      {/* HERO VOICE ORB WITH CRAZY ANIMATIONS & EQUALIZER */}
      <section className="text-center py-6 flex flex-col items-center">
        <div className="orb-wrapper">
          {/* Animated sound ripples */}
          <div className="orb-ripple"></div>
          <div className="orb-ripple"></div>
          <div className="orb-ripple"></div>

          <div className={`orb ${listening ? "active" : ""} ${isSpeakingNow ? "speaking" : ""}`}>
            <div className="orb-inner">
              {isSpeakingNow ? (
                <div className="equalizer-bars">
                  <div className="eq-bar"></div>
                  <div className="eq-bar"></div>
                  <div className="eq-bar"></div>
                  <div className="eq-bar"></div>
                  <div className="eq-bar"></div>
                </div>
              ) : (
                <AudioLines size={55} className={listening ? "text-sky-300" : "text-slate-400"} />
              )}
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-[6px] mt-4 flex items-center gap-2">
          HEYBUDDY AI
          {isSpeakingNow && (
            <span className="text-xs tracking-normal bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-full font-sans animate-pulse font-normal">
              {language === "te" ? "Speaking Telugu 🗣️" : "Speaking Female Voice 🗣️"}
            </span>
          )}
        </h2>

        <p className="text-emerald-400 text-xs tracking-widest mt-2 font-mono font-bold">
          {status}
        </p>

        <p className="text-slate-300 text-xs mt-1 font-medium">
          {listening
            ? '● Microphone active! Say "Dude unnava" for Telugu or "Hey Buddy" for English.'
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
            title={speaking ? "Mute Voice" : "Unmute Voice"}
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
              <span className="text-sky-400 text-[10px] font-mono">
                {language === "te" ? "తెలుగు మోడ్ ACTIVE" : "ENGLISH MODE ACTIVE"}
              </span>
            </div>

            {/* QUICK PROMPTS CHIPS */}
            <div className="py-3 border-b border-slate-800/80">
              <div className="text-[11px] text-slate-400 mb-2 font-medium">Try asking any query (Auto-scrolls directly):</div>
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
            <div className="min-h-[280px] max-h-[420px] overflow-y-auto py-4 space-y-4 pr-1">
              {messages.map((message, index) => {
                const isLatest = index === messages.length - 1;
                return (
                  <div
                    key={index}
                    id={isLatest ? "active-speaking-card" : undefined}
                    className={`flex gap-3 border-b border-slate-800/80 pb-3 transition-all rounded-xl p-2 ${isLatest ? "active-response-highlight bg-[#07192b]/60" : ""}`}
                  >
                    <div className="text-sky-400 mt-0.5">
                      {message.role === "You" ? <Mic size={16} /> : <Bot size={18} className="text-emerald-400" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <strong className={message.role === "You" ? "text-sky-300 text-xs" : "text-emerald-400 text-xs"}>
                          {message.role === "HeyBuddy" ? (language === "te" ? "HeyBuddy (తెలుగు)" : "HeyBuddy (Female Voice)") : message.role}
                        </strong>
                        <span className="text-[10px] text-slate-500 font-mono">{message.timestamp || "Now"}</span>
                      </div>

                      {message.teluguText && (
                        <p className="text-emerald-300 text-xs font-semibold leading-relaxed mt-1">
                          {message.teluguText}
                        </p>
                      )}

                      <p className="text-slate-200 text-xs leading-relaxed mt-1 whitespace-pre-line">
                        {message.text}
                      </p>

                      {/* ACTION TYPE: SINGLE BOOKING DETAILS */}
                      {message.actionType === "booking" && message.actionData?.booking && (
                        <div className="mt-3 bg-[#071625] border border-sky-600/40 rounded-xl p-3.5 space-y-3 shadow-lg shadow-sky-500/10">
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
                );
              })}
            </div>
          </div>

          <div>
            <form onSubmit={sendCommand} className="flex gap-2 mt-4">
              <input
                value={command}
                onChange={e => setCommand(e.target.value)}
                placeholder={language === "te" ? "తెలుగు లేదా ఇంగ్లీష్ లో అడగండి (హోటల్స్, బుకింగ్స్, రెవెన్యూ)..." : "Ask in English or Telugu ('Dude unnava', bookings, revenue)..."}
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
        <span className="flex items-center gap-2"><Zap size={14}/> HEYBUDDY AI V4.0 • TELUGU &amp; ENGLISH VOICE</span>
        <span className="flex items-center gap-2"><RefreshCw size={14}/> LAST SYNCED: {systemData.lastSynced || "LIVE"}</span>
        <span className="flex items-center gap-2"><Hotel size={14}/> STAYBUDDY SUPER ADMIN CONSOLE</span>
      </footer>
    </main>
  );
}
