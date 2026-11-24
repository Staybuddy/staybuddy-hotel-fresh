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
  const [orbState, setOrbState] = useState<"" | "listening" | "speaking" | "thinking">("");
  const [language, setLanguage] = useState<"en" | "te">("en");
  const [command, setCommand] = useState("");
  const [statusText, setStatusText] = useState("Ready when you are");
  const [substatusText, setSubstatusText] = useState("Microphone active • Say \"Hey Buddy\" or \"Dude unnava\"");
  const [heardText, setHeardText] = useState("Your spoken request will appear here…");
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
      text: `Hi, ${adminName}! I’m HeyBuddy, your StayBuddy AI concierge. I speak both English and Telugu! Say "Hey Buddy" for English ("Dudu, tell me") or "Dude unnava" for Telugu ("హా డ్యూడ్, ఉన్నాను!"). I am fully connected to your live bookings, hotels, revenue and WhatsApp dispatch.`,
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
    setOrbState("thinking");
    setStatusText("Buddy is synchronizing...");
    setSubstatusText("Connecting to StayBuddy bookings, hotels, invoices and partner extranet...");

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

      setOrbState(listeningRef.current ? "listening" : "");
      setStatusText(listeningRef.current ? (language === "te" ? "డ్యూడ్, నేను వింటున్నాను" : "Hey Buddy is listening") : "Ready when you are");
      setSubstatusText(language === "te" ? "మాట్లాడండి లేదా 'Dude unnava' అనండి" : "Say “Hey Buddy” or “Dude unnava”");
    } catch (err) {
      console.error("System sync error:", err);
      setSystemData(prev => ({ ...prev, syncing: false }));
      setOrbState("");
      setStatusText("Ready when you are");
      setSubstatusText("StayBuddy system connected");
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
      setOrbState("speaking");
      setStatusText(language === "te" ? "డ్యూడ్, సమాధానం వినండి..." : "Buddy is speaking");
      setSubstatusText("Listen to the response…");

      const hasTeluguVoice = availableVoices.some(v => v.lang.startsWith("te"));
      const isTeluguTarget = language === "te" || /[\u0C00-\u0C7F]/.test(text);

      let textToSpeak = text;
      if (isTeluguTarget && !hasTeluguVoice && spokenTextTeluguAlternative) {
        textToSpeak = spokenTextTeluguAlternative;
      }

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

      utterance.onend = () => {
        setIsSpeakingNow(false);
        if (listeningRef.current) {
          setOrbState("listening");
          setStatusText(language === "te" ? "డ్యూడ్, నేను వింటున్నాను" : "I’m listening");
          setSubstatusText(language === "te" ? "మీ ప్రశ్నను చెప్పండి" : "Say “Hey Buddy” followed by your request.");
        } else {
          setOrbState("");
          setStatusText("Ready when you are");
          setSubstatusText("Tap Start listening to speak again.");
        }
      };

      utterance.onerror = () => {
        setIsSpeakingNow(false);
        setOrbState(listeningRef.current ? "listening" : "");
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      setIsSpeakingNow(false);
      setOrbState(listeningRef.current ? "listening" : "");
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
    setOrbState("thinking");
    setStatusText("Buddy is inspecting StayBuddy...");
    setSubstatusText("Auditing homepage for accessibility, buttons and HTTP status...");

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
    setOrbState(listeningRef.current ? "listening" : "");
    setStatusText("Inspection Completed");
    setSubstatusText(`Found ${issues.length} diagnostics findings.`);
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

    setHeardText(input);
    setOrbState("thinking");
    setStatusText("Buddy is thinking");
    setSubstatusText("Understanding your request…");

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
      engine.lang = language === "te" ? "te-IN" : "en-IN";

      engine.onresult = (event: any) => {
        let currentInterim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript.trim();
          if (event.results[i].isFinal) {
            setHeardText(t);

            const normalized = t.toLowerCase();

            // TELUGU WAKE WORD: "dude unava" / "dude unnava"
            if (
              normalized.includes("dude unava") ||
              normalized.includes("dude unnava") ||
              normalized.includes("dudu unava") ||
              normalized.includes("dudu unnava") ||
              normalized.includes("unnava")
            ) {
              setLanguage("te");
              const teluguGreet = "హా డ్యూడ్, ఉన్నాను! చెప్పండి, మీకు ఏం కావాలి?";
              const teluguPhonetic = "Haa dude, unnanu! Cheppandi, meeku em kavali?";
              speak(teluguGreet, teluguPhonetic);
              setMessages(old => [
                ...old,
                { role: "You", text: t, timestamp: "Just now" },
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
              const afterWake = normalized.replace(/hey buddy|a buddy|hey body|dudu/gi, "").trim();

              if (afterWake && afterWake.length > 2) {
                execute(afterWake);
              } else {
                const wakeGreeting = "Dudu, tell me";
                speak(wakeGreeting);
                setMessages(old => [
                  ...old,
                  { role: "You", text: t, timestamp: "Just now" },
                  { role: "HeyBuddy", text: "Dudu, tell me! What can I do for you today?", timestamp: "Just now" }
                ]);
                scrollToActiveResult();
              }
            } else {
              execute(t);
            }
          } else {
            currentInterim = t;
            setHeardText(currentInterim);
          }
        }
      };

      engine.onerror = (e: any) => {
        if (e?.error === "not-allowed") {
          setStatusText("Microphone access denied");
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
      setOrbState("listening");
      setStatusText(language === "te" ? "డ్యూడ్, నేను వింటున్నాను" : "I’m listening");
      setSubstatusText(language === "te" ? "మాట్లాడండి లేదా 'Dude unnava' అనండి" : "Say “Hey Buddy” and then your request.");
    } catch (err) {
      listeningRef.current = false;
      setOrbState("");
      setStatusText("Microphone paused");
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
    setOrbState("");
    setStatusText("Stopped");
    setSubstatusText("Tap Start listening when you are ready.");
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

  const latestMessage = useMemo(() => {
    return messages[messages.length - 1];
  }, [messages]);

  const quickPrompts = [
    { label: "🗣️ 'Dude unnava' (Telugu)", query: "dude unnava" },
    { label: "🏨 Recommend best hotel in Goa", query: "Recommend best hotel in Goa" },
    { label: "🏨 Hotels in Vijayawada", query: "Recommend best hotel in Vijayawada" },
    { label: "🔍 Find booking for Arif", query: "Find booking for Arif" },
    { label: "⏳ Show pending bookings", query: "Show pending bookings" },
    { label: "💰 Show revenue & profit", query: "Show revenue and platform profit audit" },
    { label: "💬 Send WhatsApp to guest", query: "Send WhatsApp confirmation to 9876543210 for GM Hotel Kosala" },
    { label: "🔍 Scan website for bugs", query: "Scan my website" }
  ];

  if (authStatus === "loading") {
    return (
      <main className="min-h-screen bg-[#fffaf5] text-[#202027] flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 border-4 border-[#ff7900] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="flex items-center gap-2 text-[#ff7900] text-xs tracking-[3px] uppercase font-bold">
          <ShieldCheck size={16} /> Authenticating StayBuddy Admin
        </div>
      </main>
    );
  }

  const role = (session?.user as any)?.role;
  if (authStatus === "unauthenticated" || role !== "admin") {
    return (
      <main className="min-h-screen bg-[#fffaf5] text-[#202027] flex items-center justify-center p-4">
        <div className="bg-white border border-[#f0dfd0] rounded-3xl p-8 max-w-md text-center shadow-xl">
          <div className="w-16 h-16 bg-[#fff0e2] border border-[#ff7900] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#ff7900]">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-bold tracking-[3px] text-[#ff7900] mb-2">ACCESS RESTRICTED</h2>
          <p className="text-[#777985] text-xs leading-relaxed mb-6">
            HeyBuddy AI is an executive intelligence console exclusively reserved for StayBuddy Super Administrators.
          </p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/login?callbackUrl=/admin/heybuddy"
              className="bg-[#ff7900] hover:bg-[#e66c00] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-md shadow-[#ff790044]"
            >
              Admin Sign In
            </Link>
            <Link
              href="/"
              className="bg-[#fff1e5] hover:bg-[#ffe4cc] text-[#a84c00] font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              Return Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="app">
      <style jsx global>{`
        :root {
          --orange: #ff7900;
          --orange2: #ff9b36;
          --ink: #202027;
          --muted: #777985;
          --paper: #fffaf5;
          --line: #f0dfd0;
        }
        * { box-sizing: border-box; }
        body {
          margin: 0;
          background: radial-gradient(circle at 50% 0, #fff0df 0, #fffaf5 38%, #fff 100%);
          color: var(--ink);
          font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif;
          min-height: 100vh;
        }
        button, input { font: inherit; }
        .app { max-width: 1100px; margin: auto; padding: 24px; }
        .top { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 850; font-size: 22px; letter-spacing: -.7px; text-decoration: none; color: inherit; }
        .logo { width: 44px; height: 44px; border-radius: 15px; background: linear-gradient(135deg, var(--orange), #ffb15e); display: grid; place-items: center; color: white; font-size: 24px; box-shadow: 0 8px 22px #ff790044; }
        .brand small { display: block; font-size: 10px; letter-spacing: 2px; color: var(--muted); font-weight: 700; margin-top: 2px; }
        .pill { border: 1px solid var(--line); background: #fff; padding: 9px 13px; border-radius: 30px; color: #6d6d75; font-size: 12px; display: flex; align-items: center; gap: 8px; }
        .pill b { color: #16844c; }
        .hero { text-align: center; padding: 24px 0 16px; }
        .eyebrow { color: var(--orange); font-size: 11px; font-weight: 850; letter-spacing: 2.4px; }
        .hero h1 { font-size: clamp(28px, 4.5vw, 44px); letter-spacing: -1.5px; margin: 8px 0; font-weight: 850; }
        .hero p { color: var(--muted); margin: 0 auto; max-width: 620px; line-height: 1.6; font-size: 14px; }
        .layout { display: grid; grid-template-columns: 1.1fr .9fr; gap: 20px; margin-top: 20px; }
        .panel { background: #ffffffd9; border: 1px solid var(--line); border-radius: 24px; padding: 22px; box-shadow: 0 15px 50px #7c3c1010; backdrop-filter: blur(10px); }
        .assistant { min-height: 520px; display: flex; flex-direction: column; align-items: center; }

        /* ORB STYLING & ANIMATIONS */
        .orb-wrap { height: 190px; display: grid; place-items: center; width: 100%; position: relative; }
        .orb {
          width: 136px;
          height: 136px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 28%, #fff 0, #ffd3a5 17%, #ff9638 43%, #f36a00 72%, #c84a00 100%);
          box-shadow: 0 0 0 13px #ff79000d, 0 0 0 28px #ff790008, 0 18px 55px #ff790055;
          position: relative;
          transition: transform .25s;
          display: grid;
          place-items: center;
        }
        .orb:before, .orb:after {
          content: "";
          position: absolute;
          inset: 13px;
          border: 1px solid #ffffff80;
          border-radius: 50%;
          animation: spin 8s linear infinite;
        }
        .orb:after {
          inset: -10px;
          border: 1px dashed #ff9b3680;
          animation: spin 15s linear infinite reverse;
        }
        .orb.listening { animation: pulse 1.3s ease-in-out infinite; }
        .orb.speaking { animation: speak .45s ease-in-out infinite alternate; }
        .orb.thinking { animation: think 1.1s ease-in-out infinite; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 50% { transform: scale(1.09); box-shadow: 0 0 0 22px #ff790018, 0 0 0 42px #ff79000b, 0 18px 65px #ff790077; } }
        @keyframes speak { to { transform: scale(1.13); } }
        @keyframes think { 50% { filter: hue-rotate(15deg); transform: scale(.96); } }

        /* LIVE EQUALIZER BARS */
        .eq-bars { display: flex; align-items: center; justify-content: center; gap: 3.5px; height: 32px; z-index: 5; }
        .eq-b { width: 3.5px; background: white; border-radius: 3px; animation: eq-anim 0.5s ease-in-out infinite alternate; }
        .eq-b:nth-child(1) { height: 10px; animation-delay: 0.1s; }
        .eq-b:nth-child(2) { height: 20px; animation-delay: 0.25s; }
        .eq-b:nth-child(3) { height: 30px; animation-delay: 0.15s; }
        .eq-b:nth-child(4) { height: 22px; animation-delay: 0.35s; }
        .eq-b:nth-child(5) { height: 12px; animation-delay: 0.2s; }
        @keyframes eq-anim { 0% { transform: scaleY(0.4); } 100% { transform: scaleY(1.2); } }

        .status { font-weight: 850; font-size: 19px; margin: 6px 0 2px; text-align: center; color: var(--ink); }
        .substatus { font-size: 12px; color: var(--muted); text-align: center; min-height: 18px; font-weight: 500; }
        .transcript {
          margin: 14px 0 8px;
          background: #fff8f1;
          border: 1px solid #ffe4cc;
          border-radius: 16px;
          padding: 13px 15px;
          width: 100%;
          min-height: 75px;
          color: #444;
          font-size: 13px;
          line-height: 1.5;
        }
        .transcript strong { color: var(--orange); display: block; font-size: 10px; letter-spacing: 1.4px; margin-bottom: 4px; font-weight: 850; }
        .controls { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 8px; }
        .btn { border: 0; border-radius: 14px; padding: 12px 18px; font-weight: 800; cursor: pointer; transition: .2s; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
        .btn:active { transform: scale(.97); }
        .primary { background: linear-gradient(135deg, var(--orange), #ff9c38); color: #fff; box-shadow: 0 8px 20px #ff790044; }
        .secondary { background: #fff1e5; color: #a84c00; border: 1px solid #ffdfc2; }
        .danger { background: #fff0f0; color: #b63b3b; border: 1px solid #ffdada; }
        .hint { font-size: 11px; color: #92929a; text-align: center; margin-top: 12px; }

        .side h3 { margin: 0 0 5px; font-size: 17px; font-weight: 850; }
        .side .desc { font-size: 12px; color: var(--muted); margin: 0 0 15px; line-height: 1.5; }
        .activity { display: flex; flex-direction: column; gap: 10px; }
        .item { display: flex; gap: 12px; padding: 12px; border: 1px solid #f2e9e1; border-radius: 15px; background: #fff; }
        .ico { width: 35px; height: 35px; flex: 0 0 35px; border-radius: 11px; background: #fff0e2; display: grid; place-items: center; color: var(--orange); font-size: 17px; }
        .item b { display: block; font-size: 13px; color: var(--ink); }
        .item span { font-size: 11px; color: var(--muted); line-height: 1.45; }

        .section { margin-top: 16px; }
        .section label { display: block; font-size: 11px; font-weight: 850; color: #777; margin-bottom: 7px; letter-spacing: 0.5px; }
        .command { display: flex; gap: 8px; }
        .command input { min-width: 0; flex: 1; border: 1px solid var(--line); border-radius: 13px; padding: 12px 14px; outline: none; background: #fff; }
        .command input:focus { border-color: var(--orange); }

        .tag { display: inline-block; background: #fff0e2; color: #b85a08; border-radius: 20px; padding: 4px 10px; font-size: 10px; font-weight: 800; margin: 4px 4px 0 0; }
        .foot { text-align: center; color: #a0a0a5; font-size: 11px; padding: 24px 0 10px; }

        /* CRAZY AUTO-SCROLL CARD HIGHLIGHT */
        .card-highlight {
          border-color: var(--orange) !important;
          box-shadow: 0 0 25px rgba(255, 121, 0, 0.25);
          animation: pop-card 0.4s ease-out;
        }
        @keyframes pop-card {
          0% { transform: translateY(6px); opacity: 0.8; }
          100% { transform: translateY(0); opacity: 1; }
        }

        @media(max-width: 860px) {
          .layout { grid-template-columns: 1fr; }
          .assistant { min-height: 480px; }
        }
      `}</style>

      {/* TOP HEADER */}
      <header className="top">
        <Link href="/admin" className="brand">
          <div className="logo">✦</div>
          <div>
            staybuddy
            <small>YOUR SMART TRAVEL PARTNER</small>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = language === "en" ? "te" : "en";
              setLanguage(next);
              if (next === "te") {
                speak("డ్యూడ్, నేను తెలుగులో మాట్లాడుతాను. చెప్పండి!", "Dude, nenu Telugu lo maatlaaduthaanu. Cheppandi!");
              } else {
                speak("Switched to English. Dudu, tell me!");
              }
            }}
            className="pill hover:bg-orange-50 transition cursor-pointer font-bold text-xs"
          >
            <Languages size={14} className="text-[#ff7900]" />
            {language === "en" ? "Telugu Mode (తెలుగు)" : "English Mode"}
          </button>
          <div className="pill">
            ● <b>AI CONCIERGE</b> &nbsp; Admin Intelligence
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="eyebrow">INTRODUCING YOUR PERSONAL AI CONCIERGE</div>
        <h1>Meet <span style={{ color: "var(--orange)" }}>Hey Buddy.</span></h1>
        <p>
          Speak naturally in English or Telugu. Plan stays, manage bookings, check revenue, dispatch WhatsApp messages and inspect your site — all from one intelligent assistant.
        </p>
      </section>

      {/* 2-COLUMN MAIN LAYOUT */}
      <main className="layout">

        {/* LEFT COLUMN: THE AI ASSISTANT ORB & VOICE CORE */}
        <section className="panel assistant">
          <div className="orb-wrap">
            <div className={`orb ${orbState} ${isSpeakingNow ? "speaking" : ""}`}>
              {isSpeakingNow ? (
                <div className="eq-bars">
                  <div className="eq-b"></div>
                  <div className="eq-b"></div>
                  <div className="eq-b"></div>
                  <div className="eq-b"></div>
                  <div className="eq-b"></div>
                </div>
              ) : (
                <AudioLines size={48} className="text-white/80" />
              )}
            </div>
          </div>

          <div className="status">{statusText}</div>
          <div className="substatus">{substatusText}</div>

          {/* TRANSCRIPT 1: WHAT I HEARD */}
          <div className="transcript">
            <strong>WHAT I HEARD</strong>
            <span>{heardText}</span>
          </div>

          {/* TRANSCRIPT 2: BUDDY'S RESPONSE */}
          <div className="transcript" style={{ background: "#fff", borderColor: "#f1ece7" }}>
            <strong>BUDDY&apos;S RESPONSE</strong>
            {latestMessage?.teluguText && (
              <div className="text-emerald-700 font-bold mb-1">{latestMessage.teluguText}</div>
            )}
            <span>{latestMessage?.text || "I’m ready to help you with StayBuddy."}</span>
          </div>

          {/* CONTROLS */}
          <div className="controls">
            <button
              onClick={listening ? stopListening : startListening}
              className={`btn ${listening ? "danger" : "primary"}`}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
              {listening ? "Stop listening" : "🎙 Start listening"}
            </button>
            <button
              onClick={() => {
                setSpeaking(!speaking);
                if (typeof window !== "undefined") window.speechSynthesis.cancel();
              }}
              className="btn secondary"
            >
              {speaking ? <Volume2 size={16} /> : <VolumeX size={16} />}
              {speaking ? "Mute Voice" : "Unmute Voice"}
            </button>
            <button
              onClick={syncCompleteSystem}
              disabled={systemData.syncing}
              className="btn secondary"
            >
              <RefreshCw size={14} className={systemData.syncing ? "animate-spin" : ""} />
              Sync DB
            </button>
          </div>

          <div className="hint">
            Wake phrase: “Hey Buddy” (English) · “Dude unnava” (Telugu) · Instant response
          </div>

          {/* AUTO-SCROLL ACTION CARD CONTAINER */}
          {latestMessage?.actionType && (
            <div id="active-speaking-card" className="w-full mt-4 card-highlight rounded-2xl">

              {/* ACTION: SINGLE BOOKING */}
              {latestMessage.actionType === "booking" && latestMessage.actionData?.booking && (
                <div className="bg-[#fff9f4] border border-[#ffdfc2] rounded-2xl p-4 text-xs space-y-3">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-[#c84a00]">
                      Booking #{latestMessage.actionData.booking.bookingId || latestMessage.actionData.booking._id.slice(0, 8)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full uppercase text-[10px] ${latestMessage.actionData.booking.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {latestMessage.actionData.booking.paymentStatus || "unpaid"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div><b>Guest:</b> {latestMessage.actionData.booking.guestName || "Guest"}</div>
                    <div><b>Phone:</b> {latestMessage.actionData.booking.guestPhone || "N/A"}</div>
                    <div><b>Hotel:</b> {latestMessage.actionData.booking.hotelId?.name || "StayBuddy Hotel"}</div>
                    <div><b>Amount:</b> ₹{Number(latestMessage.actionData.booking.totalAmount || 0).toLocaleString("en-IN")}</div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-[#f2e2d2]">
                    {latestMessage.actionData.whatsapp && (
                      <a
                        href={latestMessage.actionData.whatsapp.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn primary py-2 px-3 text-xs"
                      >
                        <MessageCircle size={14} /> WhatsApp Guest
                      </a>
                    )}
                    <button
                      onClick={() => recheckPayment(latestMessage.actionData.booking._id)}
                      disabled={recheckingBookingId === latestMessage.actionData.booking._id}
                      className="btn secondary py-2 px-3 text-xs"
                    >
                      <RefreshCw size={12} className={recheckingBookingId === latestMessage.actionData.booking._id ? "animate-spin" : ""} /> Recheck Razorpay
                    </button>
                  </div>
                </div>
              )}

              {/* ACTION: HOTELS RECOMMENDATION */}
              {latestMessage.actionType === "hotels" && latestMessage.actionData?.hotels && (
                <div className="space-y-2 mt-2">
                  {latestMessage.actionData.hotels.map((hotel: HotelItem) => {
                    const price = hotel.pricePerNight || hotel.rooms?.[0]?.price || 1811;
                    return (
                      <div key={hotel._id} className="bg-white border border-[#f0dfd0] rounded-xl p-3 flex items-center justify-between gap-3 text-xs shadow-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-12 h-12 rounded-lg bg-orange-100 overflow-hidden flex-shrink-0 relative">
                            {hotel.images?.[0] ? (
                              <img src={hotel.images[0]} alt={hotel.name} className="w-full h-full object-cover" />
                            ) : (
                              <Hotel className="w-6 h-6 text-orange-500 m-auto mt-3" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <b className="truncate block text-slate-800">{hotel.name}</b>
                            <div className="text-[11px] text-slate-500">{hotel.city} • ★ {hotel.starRating || 3} Star</div>
                            <div className="text-orange-600 font-bold mt-0.5">₹{Number(price).toLocaleString("en-IN")}/night</div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <Link
                            href={`/hotels/${hotel._id}`}
                            target="_blank"
                            className="btn primary py-1 px-2.5 text-[11px]"
                          >
                            Book <ArrowUpRight size={11} />
                          </Link>
                          <button
                            onClick={() => execute(`Send WhatsApp confirmation to 9876543210 for ${hotel.name}`)}
                            className="btn secondary py-1 px-2.5 text-[11px]"
                          >
                            WhatsApp
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ACTION: WHATSAPP CARD */}
              {latestMessage.actionType === "whatsapp" && latestMessage.actionData && (
                <div className="bg-[#f0fbf5] border border-[#a7f3d0] rounded-2xl p-4 text-xs space-y-2.5">
                  <div className="flex justify-between items-center font-bold text-emerald-800">
                    <span className="flex items-center gap-1.5"><MessageCircle size={14} /> WhatsApp Prepared</span>
                    <span className="font-mono text-[11px]">{latestMessage.actionData.phone}</span>
                  </div>
                  <div className="bg-white border border-[#d1fae5] rounded-xl p-2.5 text-[11px] text-slate-700 whitespace-pre-wrap font-sans">
                    {latestMessage.actionData.text}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <a
                      href={latestMessage.actionData.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn primary py-2 px-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex-1 justify-center"
                    >
                      Send on WhatsApp Now
                    </a>
                  </div>
                </div>
              )}

              {/* ACTION: REVENUE & FINANCIAL STATS */}
              {latestMessage.actionType === "stats" && latestMessage.actionData?.totalRevenue !== undefined && (
                <div className="bg-white border border-[#ffdfc2] rounded-2xl p-4 text-xs space-y-2">
                  <b className="text-[#a84c00] flex items-center gap-1.5 text-xs"><TrendingUp size={14} /> Financial Audit</b>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-[#fff8f1] p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">Total Revenue</span>
                      <strong className="text-slate-800 text-sm">₹{latestMessage.actionData.totalRevenue.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="bg-[#fff8f1] p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">Gross Profit</span>
                      <strong className="text-emerald-700 text-sm">₹{latestMessage.actionData.grossProfit.toLocaleString("en-IN")}</strong>
                    </div>
                    <div className="bg-[#fff8f1] p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">GST 5%</span>
                      <strong className="text-amber-700 text-sm">-₹{latestMessage.actionData.gstDeduction.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
                    </div>
                    <div className="bg-[#fff8f1] p-2 rounded-xl">
                      <span className="text-[10px] text-slate-500 block">Net StayBuddy Profit</span>
                      <strong className="text-orange-600 text-sm">₹{latestMessage.actionData.netProfit.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </section>

        {/* RIGHT COLUMN: INTELLIGENCE CENTRE & SYSTEM ACTIONS */}
        <aside className="panel side">
          <h3>Buddy’s intelligence centre</h3>
          <p className="desc">
            Directly connected to your live StayBuddy database. Ask questions or trigger actions using voice or text.
          </p>

          <div className="activity">
            <div className="item">
              <div className="ico">🏨</div>
              <div>
                <b>Hotel booking &amp; inventory</b>
                <span>Search properties, live rates, room occupancy and initiate reservations directly.</span>
              </div>
            </div>
            <div className="item">
              <div className="ico">🧠</div>
              <div>
                <b>Deep system knowledge</b>
                <span>{systemData.bookings.length} live bookings, {systemData.hotels.length} properties, and {systemData.taxInvoices.length} tax invoices indexed.</span>
              </div>
            </div>
            <div className="item">
              <div className="ico">⚡</div>
              <div>
                <b>Website &amp; operations helper</b>
                <span>Audit homepage health, check viewport, buttons and image accessibility instantly.</span>
              </div>
            </div>
            <div className="item">
              <div className="ico">🔐</div>
              <div>
                <b>WhatsApp &amp; payment verification</b>
                <span>Recheck Razorpay payments and prepare official StayBuddy guest WhatsApp confirmations.</span>
              </div>
            </div>
          </div>

          {/* TRY A TEXT COMMAND */}
          <div className="section">
            <label htmlFor="typed">TRY A COMMAND (ENGLISH OR TELUGU)</label>
            <form onSubmit={sendCommand} className="command">
              <input
                id="typed"
                value={command}
                onChange={e => setCommand(e.target.value)}
                placeholder="e.g. Recommend best hotel in Goa, dude unnava, show revenue…"
              />
              <button type="submit" className="btn primary">Send</button>
            </form>
          </div>

          {/* QUICK PROMPTS TAGS */}
          <div className="section">
            <label>SUGGESTIONS</label>
            <div>
              {quickPrompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => execute(p.query)}
                  className="tag hover:bg-orange-200 transition cursor-pointer border-0"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* WEBSITE AUDIT SECTION */}
          <div className="section pt-2">
            <button
              onClick={scanWebsite}
              disabled={scanning}
              className="btn secondary w-full justify-center text-xs py-2.5 font-bold"
            >
              <Bug size={14} /> {scanning ? "Scanning Website..." : "Run Website Diagnostic Scan"}
            </button>

            {scanDone && (
              <div className="mt-3 p-3 bg-white border border-[#f0dfd0] rounded-xl text-xs space-y-1.5 max-h-[160px] overflow-y-auto">
                <b className="text-slate-800 block">Inspection Findings ({findings.length}):</b>
                {findings.map((f, i) => (
                  <div key={i} className="text-[11px] border-b border-slate-100 pb-1">
                    <span className="font-bold text-orange-600">{f.title}:</span> {f.detail}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>

      <div className="foot">
        StayBuddy AI · Executive Voice &amp; System Intelligence · Connected to Live Database
      </div>
    </div>
  );
}
