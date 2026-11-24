"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, AudioLines, Bot, Bug, CheckCircle,
  Code2, Globe, Hotel, Mic, MicOff, Send,
  ShieldCheck, Volume2, VolumeX, Zap, RefreshCw,
  ArrowLeft, Lock, MessageCircle, Phone, Calendar,
  ExternalLink, Sparkles, Star, MapPin, IndianRupee,
  Share2, ArrowUpRight
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
};

type ChatMessage = {
  role: "HeyBuddy" | "You";
  text: string;
  timestamp?: string;
  actionType?: "hotels" | "whatsapp" | "stats" | "diagnostic";
  actionData?: any;
};

export default function HeyBuddyPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(true);
  const [command, setCommand] = useState("");
  const [status, setStatus] = useState("● ACTIVATED & LISTENING • \"DUDU, TELL ME\"");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const adminName = useMemo(() => {
    return session?.user?.name || "Arif";
  }, [session]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "HeyBuddy",
      text: `Hi, ${adminName} ✨ I am HeyBuddy, your executive AI voice assistant. Say "Hey Buddy" and I'll respond "Dudu, tell me". You can ask me to book hotels, send WhatsApp confirmations, check revenue, or scan your website!`,
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

    // Preferred realistic female voices
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

    // Secondary check: voice name containing female or en-IN
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

  // VOICE SYNTHESIS (Natural, melodic female tone)
  function speak(text: string) {
    if (!speaking || typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();

      // Clean speech text (strip URLs, markdown asterisks, emojis for smooth voice)
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
      utterance.pitch = 1.25; // Gentle, melodic female pitch

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  function reply(text: string, originalCommand: string, actionType?: "hotels" | "whatsapp" | "stats" | "diagnostic", actionData?: any) {
    setMessages(old => [
      ...old,
      { role: "You", text: originalCommand, timestamp: "Just now" },
      { role: "HeyBuddy", text, timestamp: "Just now", actionType, actionData }
    ]);

    setStatus("RESPONSE READY");
    speak(text);
  }

  // WEBSITE SCANNER
  async function scanWebsite(): Promise<Finding[]> {
    setScanning(true);
    setScanDone(false);
    setStatus("INSPECTING STAYBUDDY WEBSITE");

    const issues: Finding[] = [];

    try {
      const response = await fetch(window.location.origin, {
        cache: "no-store"
      });

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
      const unnamedButtons = buttons.filter(button =>
        !button.textContent?.trim() &&
        !button.getAttribute("aria-label")
      );

      if (unnamedButtons.length) {
        issues.push({
          title: "Buttons missing accessible names",
          severity: "Medium",
          detail: `${unnamedButtons.length} buttons have no text or aria-label.`,
          recommendation: "Add button text or aria-label for screen reader support."
        });
      }

      const inputs = Array.from(doc.querySelectorAll("input"));
      const unlabeledInputs = inputs.filter(input => {
        if (["hidden", "submit", "button"].includes(input.type)) return false;
        const id = input.id;
        const hasLabel = id && doc.querySelector(`label[for="${CSS.escape(id)}"]`);
        return !hasLabel && !input.getAttribute("aria-label");
      });

      if (unlabeledInputs.length) {
        issues.push({
          title: "Form fields missing labels",
          severity: "Medium",
          detail: `${unlabeledInputs.length} search/form fields need accessible labels.`,
          recommendation: "Add associated labels or aria-label attributes."
        });
      }

      const links = Array.from(doc.querySelectorAll("a"));
      const unnamedLinks = links.filter(link =>
        !link.textContent?.trim() &&
        !link.getAttribute("aria-label") &&
        !link.querySelector("img[alt]")
      );

      if (unnamedLinks.length) {
        issues.push({
          title: "Links missing accessible names",
          severity: "Low",
          detail: `${unnamedLinks.length} links have no descriptive text or aria-labels.`,
          recommendation: "Add descriptive link text or aria-label."
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

  // INTELLIGENT HOTEL SEARCH & BOOKING FINDER
  async function searchHotels(queryCity?: string, hotelNameQuery?: string) {
    try {
      const res = await fetch("/api/admin/hotels");
      if (!res.ok) throw new Error("Could not fetch hotels");
      const data = await res.json();
      const allHotels: any[] = data.hotels || [];

      let matched = allHotels.filter(h => h.status === "approved" || !h.status);

      if (queryCity) {
        const cLower = queryCity.toLowerCase().trim();
        matched = matched.filter(h => (h.city || "").toLowerCase().includes(cLower));
      }

      if (hotelNameQuery) {
        const nLower = hotelNameQuery.toLowerCase().trim();
        matched = matched.filter(h => (h.name || "").toLowerCase().includes(nLower));
      }

      // If no exact city match, fallback to approved hotels
      if (!matched.length && allHotels.length) {
        matched = allHotels.slice(0, 4);
      }

      return matched.slice(0, 5);
    } catch (e) {
      console.error("Hotel search error:", e);
      return [];
    }
  }

  // LIVE STAYBUDDY STATS FETCHERS
  async function fetchLiveBookings(): Promise<string> {
    try {
      const res = await fetch("/api/admin/bookings");
      if (!res.ok) throw new Error("Failed to fetch bookings");
      const data = await res.json();
      const bookings: any[] = data.bookings || [];

      const total = bookings.length;
      const confirmed = bookings.filter(b => b.status === "confirmed" || b.status === "completed").length;
      const pending = bookings.filter(b => b.status === "pending").length;
      const paid = bookings.filter(b => b.paymentStatus === "paid").length;

      const todayStr = new Date().toISOString().split("T")[0];
      const todayBookings = bookings.filter(b => {
        const d = b.createdAt ? new Date(b.createdAt).toISOString().split("T")[0] : "";
        return d === todayStr;
      });

      return `Dudu, StayBuddy currently has ${total} total bookings. ${confirmed} are confirmed, ${paid} are verified paid payments, and ${pending} are pending verification. Today there are ${todayBookings.length} new booking requests recorded.`;
    } catch (err) {
      return "Dudu, connected to StayBuddy bookings database, but could not load current records. Please check the Admin Bookings tab.";
    }
  }

  async function fetchLiveRevenue(): Promise<string> {
    try {
      const res = await fetch("/api/admin/bookings");
      if (!res.ok) throw new Error("Failed to fetch financial data");
      const data = await res.json();
      const bookings: any[] = data.bookings || [];

      const confirmedPaid = bookings.filter(b => (b.status === "confirmed" || b.status === "completed") && b.paymentStatus === "paid");
      const totalRevenue = confirmedPaid.reduce((acc, b) => acc + (Number(b.totalAmount) || 0), 0);
      const totalCommission = confirmedPaid.reduce((acc, b) => {
        const total = Number(b.totalAmount) || 0;
        const b2b = Number(b.b2bCost) || 0;
        return acc + (total > b2b ? (total - b2b) : 0);
      }, 0);

      return `Dudu, here is the verified revenue: ₹${totalRevenue.toLocaleString("en-IN")} collected across ${confirmedPaid.length} confirmed paid reservations, with an estimated gross profit margin of ₹${totalCommission.toLocaleString("en-IN")}.`;
    } catch (err) {
      return "Dudu, could not compute financial figures at this moment. You can check the complete tax invoices and margins tab in the Admin Console.";
    }
  }

  async function fetchLiveHotelsSummary(): Promise<string> {
    try {
      const res = await fetch("/api/admin/hotels");
      if (!res.ok) throw new Error("Failed to fetch hotels");
      const data = await res.json();
      const hotels: any[] = data.hotels || [];

      const total = hotels.length;
      const approved = hotels.filter(h => h.status === "approved").length;
      const pending = hotels.filter(h => h.status === "pending" || h.hasPendingRoomUpdates === true || (Array.isArray(h.rooms) && h.rooms.some((r: any) => r.approvalStatus === "pending"))).length;
      const extranetCount = hotels.filter(h => h.isExtranet === true || h.source === "extranet").length;

      return `Dudu, StayBuddy has ${total} registered properties in total. ${approved} are live on the B2C site, ${pending} properties or room updates require admin review, and ${extranetCount} properties are managed via Partner Extranet.`;
    } catch (err) {
      return "Dudu, could not retrieve hotel inventory list. Please review the Properties tab in the Admin Console.";
    }
  }

  // PREPARE WHATSAPP & SMS DATA
  function prepareWhatsApp(guestPhone: string, guestName: string, hotelName: string, bookingRef?: string) {
    const cleanPhone = guestPhone.replace(/\D/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const ref = bookingRef || `SB-${Math.floor(100000 + Math.random() * 900000)}`;

    const text = `*StayBuddy Hotel Booking Confirmation* 🏨✨\n\nDear ${guestName || "Guest"},\nThank you for choosing StayBuddy! Your reservation at *${hotelName || "StayBuddy Hotel"}* is confirmed.\n\n*Booking ID:* ${ref}\n*Check-in:* 12:00 PM\n*Check-out:* 11:00 AM\n\nFor directions or special requests, please reply to this chat or visit https://staybuddy.in\n\n_Wish you a pleasant stay with StayBuddy!_`;

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

  // EXECUTIVE COMMAND ENGINE
  async function execute(input: string) {
    const q = input.trim().toLowerCase();
    if (!q) return;

    setStatus("PROCESSING COMMAND");

    // 1. WHATSAPP & SMS DISPATCH
    if (
      q.includes("whatsapp") ||
      q.includes("what up") ||
      q.includes("whst up") ||
      q.includes("sms") ||
      q.includes("message to guest") ||
      q.includes("send message")
    ) {
      setStatus("PREPARING WHATSAPP");
      // Extract phone number if spoken or typed
      const phoneMatch = input.match(/(\+?91[\-\s]?)?[6-9]\d{9}/);
      const phone = phoneMatch ? phoneMatch[0].replace(/\D/g, "") : "9876543210";

      let hotelName = "GM Hotel Kosala";
      if (q.includes("galadari")) hotelName = "Hotel Galadari";
      if (q.includes("taj")) hotelName = "Taj Banjara";

      let guestName = "Guest";
      if (q.includes("for ")) {
        const afterFor = input.split(/for /i)[1];
        if (afterFor) guestName = afterFor.split(" ")[0].trim();
      }

      const waData = prepareWhatsApp(phone, guestName, hotelName);
      const answer = `Dudu, I have prepared the WhatsApp confirmation message for ${waData.guestName} (${waData.displayPhone}) for ${waData.hotelName}. Click "Send on WhatsApp" below to open and dispatch it!`;

      reply(answer, input, "whatsapp", waData);
      return;
    }

    // 2. HOTEL RECOMMENDATION & INSTANT BOOKING
    if (
      q.includes("book") ||
      q.includes("recommend") ||
      q.includes("find hotel") ||
      q.includes("show hotel") ||
      q.includes("hotels in") ||
      q.includes("flight") ||
      q.includes("myra")
    ) {
      setStatus("SEARCHING PROPERTIES");

      // Extract city
      let targetCity = "";
      const cities = ["goa", "vijayawada", "hyderabad", "bengaluru", "bangalore", "mumbai", "delhi", "chennai", "kolkata", "pune", "jaipur"];
      for (const c of cities) {
        if (q.includes(c)) {
          targetCity = c === "bangalore" ? "bengaluru" : c;
          break;
        }
      }

      // Extract hotel name keywords
      let hotelNameQuery = "";
      if (q.includes("kosala")) hotelNameQuery = "kosala";
      else if (q.includes("galadari")) hotelNameQuery = "galadari";
      else if (q.includes("executive")) hotelNameQuery = "executive";

      const matchedHotels = await searchHotels(targetCity, hotelNameQuery);

      if (matchedHotels.length > 0) {
        const top = matchedHotels[0];
        const cityName = targetCity ? (targetCity.charAt(0).toUpperCase() + targetCity.slice(1)) : (top.city || "India");
        const price = top.pricePerNight || (top.rooms?.[0]?.price) || 1811;

        const answer = `Dudu, I found ${matchedHotels.length} great hotels in ${cityName}. The best option is ${top.name} starting at ₹${Number(price).toLocaleString("en-IN")}/night. You can book it directly or share details via WhatsApp!`;

        reply(answer, input, "hotels", { hotels: matchedHotels, targetCity: cityName });
      } else {
        const answer = `Dudu, I couldn't find active hotels in that location right now. Showing our top approved properties across StayBuddy.`;
        const allHotels = await searchHotels();
        reply(answer, input, "hotels", { hotels: allHotels, targetCity: "All Cities" });
      }
      return;
    }

    // 3. LIVE BOOKINGS
    if (q.includes("booking") || q.includes("reservation") || q.includes("today's booking") || q.includes("live bookings")) {
      setStatus("FETCHING BOOKINGS DATA");
      const answer = await fetchLiveBookings();
      reply(answer, input, "stats");
      return;
    }

    // 4. LIVE REVENUE & FINANCIAL AUDIT
    if (q.includes("revenue") || q.includes("sales") || q.includes("profit") || q.includes("money") || q.includes("finance") || q.includes("earnings")) {
      setStatus("CALCULATING REVENUE");
      const answer = await fetchLiveRevenue();
      reply(answer, input, "stats");
      return;
    }

    // 5. HOTEL INVENTORY PERFORMANCE
    if (q.includes("hotel performance") || q.includes("inventory") || q.includes("properties") || q.includes("onboarding")) {
      setStatus("ANALYZING HOTEL INVENTORY");
      const answer = await fetchLiveHotelsSummary();
      reply(answer, input, "stats");
      return;
    }

    // 6. WEBSITE SCANNER & ACCESSIBILITY AUDIT
    if (
      q.includes("scan") ||
      q.includes("website") ||
      q.includes("bug") ||
      q.includes("error") ||
      q.includes("health") ||
      q.includes("inspect")
    ) {
      const result = await scanWebsite();
      const answer = `Dudu, website inspection is completed. I found ${result.length} diagnostic findings for StayBuddy homepage. All details are displayed in the diagnostics panel.`;
      reply(answer, input, "diagnostic", { findings: result });
      return;
    }

    // 7. GREETINGS & HEY BUDDY RECOGNITION
    if (q.includes("hello") || q.includes("hi") || q.includes("hey") || q.includes("dudu")) {
      reply(
        `Dudu, tell me! What can I do for you today, ${adminName}? You can ask me to book a hotel, send a WhatsApp confirmation, show revenue, or inspect the website.`,
        input
      );
      return;
    }

    // 8. HELP & CAPABILITIES
    if (q.includes("help") || q.includes("what can you do") || q.includes("commands")) {
      reply(
        `Dudu, here is what I can do: 1. Recommend and book hotels in Goa, Vijayawada, Hyderabad or Bengaluru. 2. Send instant WhatsApp & SMS confirmations to guests. 3. Show live bookings and revenue. 4. Scan StayBuddy for bugs. Just say the word!`,
        input
      );
      return;
    }

    // 9. ADMIN NAVIGATION SHORTCUTS
    if (q.includes("admin") || q.includes("dashboard") || q.includes("go to admin")) {
      reply(`Dudu, taking you right to the StayBuddy Admin Console.`, input);
      setTimeout(() => router.push("/admin"), 1000);
      return;
    }

    // DEFAULT FALLBACK
    reply(
      `Dudu, I heard: "${input}". Searching StayBuddy intelligence... You can ask me to recommend hotels, dispatch WhatsApp confirmations, or check today's revenue.`,
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
              // User said "Hey Buddy recommend hotel in Goa"
              execute(afterWake);
            } else {
              // User called "Hey Buddy"
              const wakeGreeting = "Dudu, tell me";
              speak(wakeGreeting);
              setMessages(old => [
                ...old,
                { role: "You", text: transcript, timestamp: "Just now" },
                { role: "HeyBuddy", text: "Dudu, tell me! What can I do for you today?", timestamp: "Just now" }
              ]);
            }
          } else {
            // 2. Direct command spoken without saying "Hey Buddy" -> Respond immediately!
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

  // AUTO-ACTIVATE ON ARRIVAL: Immediately start listening and greet with "Dudu, tell me"
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

  function sendCommand(e: React.FormEvent) {
    e.preventDefault();
    if (!command.trim()) return;

    const value = command;
    setCommand("");
    execute(value);
  }

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
    { label: "🏨 Recommend best hotel in Goa", query: "Recommend best hotel in Goa" },
    { label: "🏨 Hotels in Vijayawada", query: "Recommend best hotel in Vijayawada" },
    { label: "💬 Send WhatsApp confirmation to guest", query: "Send WhatsApp confirmation to 9876543210 for GM Hotel Kosala" },
    { label: "💰 Show revenue & profit", query: "Show revenue and platform profit" },
    { label: "🛎️ Show today's live bookings", query: "Show today's bookings" },
    { label: "🔍 Scan website for bugs", query: "Scan my website" }
  ];

  // If session is still verifying, show futuristic security check
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

  // Security Gate: Only Admin allowed
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
              <h1 className="font-bold tracking-[4px] text-xl">HEYBUDDY</h1>
              <span className="bg-sky-950 text-sky-400 border border-sky-800 text-[10px] px-2 py-0.5 rounded-full font-mono">
                FEMALE VOICE • &quot;DUDU, TELL ME&quot;
              </span>
            </div>
            <p className="text-[9px] tracking-[3px] text-sky-300 uppercase">
              STAYBUDDY EXECUTIVE AI • LIKE MYRA
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

      {/* MYRA-STYLE EXECUTIVE WELCOME BANNER */}
      <div className="mt-6 bg-gradient-to-r from-[#0b1c2d] via-[#102c49] to-[#0b1c2d] border border-[#1e3d57] rounded-2xl p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-extrabold text-white">
              Hi, <span className="text-sky-400">{adminName}</span> ✨
            </h2>
            <span className="bg-blue-600/30 text-blue-300 border border-blue-500/40 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
              AI ASSISTANT
            </span>
          </div>
          <p className="text-slate-300 text-xs mt-1 max-w-xl leading-relaxed">
            Meet HeyBuddy, your online executive AI assistant. Say <strong className="text-sky-300">&quot;Hey Buddy&quot;</strong> and she responds <strong className="text-emerald-400">&quot;Dudu, tell me&quot;</strong> in a realistic female voice. She can search hotels, create bookings, dispatch WhatsApp confirmations, and inspect website health!
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
      <section className="text-center py-8 flex flex-col items-center">
        <div className={`orb ${listening ? "active" : ""} ${scanning ? "scanning" : ""}`}>
          <div className="orb-inner">
            <AudioLines size={55} />
          </div>
        </div>

        <h2 className="text-2xl font-bold tracking-[6px] mt-5">
          HEYBUDDY AI
        </h2>

        <p className="text-emerald-400 text-xs tracking-widest mt-3 font-mono font-bold">
          {status}
        </p>

        <p className="text-slate-300 text-xs mt-2 font-medium">
          {listening
            ? '● Microphone is active! Say "Hey Buddy" to hear "Dudu, tell me" or speak your booking/revenue request directly.'
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

        {/* COMMAND CENTRE (MYRA-STYLE CHAT WITH ACTION CARDS) */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-700 pb-4">
              <h3 className="text-sm font-bold flex gap-2 items-center">
                <Activity className="text-sky-400" size={18} />
                COMMAND CENTRE
              </h3>
              <span className="text-sky-400 text-[10px] font-mono">AI CONSOLE • LIKE MYRA</span>
            </div>

            {/* QUICK PROMPTS CHIPS */}
            <div className="py-3 border-b border-slate-800/80">
              <div className="text-[11px] text-slate-400 mb-2 font-medium">You may try asking:</div>
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

                    {/* ACTION TYPE: HOTELS RECOMMENDATION CARDS */}
                    {message.actionType === "hotels" && message.actionData?.hotels && (
                      <div className="mt-3 space-y-2.5">
                        {message.actionData.hotels.map((hotel: HotelItem) => {
                          const price = hotel.pricePerNight || hotel.rooms?.[0]?.price || 1811;
                          const img = hotel.images?.[0] || "/placeholder-hotel.jpg";
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
                placeholder="Ask HeyBuddy to book a hotel, send WhatsApp, check revenue..."
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
            <span className="text-sky-400 text-[10px] font-mono">
              DIAGNOSTICS
            </span>
          </div>

          <div className="text-center py-6">
            <Globe size={40} className="mx-auto text-sky-400" />

            <h3 className="font-bold mt-3 text-base">
              StayBuddy Website Scanner
            </h3>

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
              <span className="text-sky-400 font-mono">
                {findings.length} FINDINGS
              </span>
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
                    <strong className="text-xs text-white">
                      {item.title}
                    </strong>

                    <span className={`text-[10px] font-mono uppercase font-bold ${item.severity.toLowerCase()}`}>
                      {item.severity}
                    </span>
                  </div>

                  <p className="text-slate-400 text-xs mt-1">
                    {item.detail}
                  </p>

                  <p className="text-sky-300 text-xs mt-1">
                    Recommendation: {item.recommendation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="flex flex-wrap justify-between gap-4 text-[10px] text-sky-400 border-t border-slate-800 mt-8 pt-5 font-mono">
        <span className="flex items-center gap-2"><Zap size={14}/> HEYBUDDY AI V2.0 • VOICE &amp; BOOKING</span>
        <span className="flex items-center gap-2"><RefreshCw size={14}/> SCANS RUN: {scanCount}</span>
        <span className="flex items-center gap-2"><Hotel size={14}/> STAYBUDDY ADMIN CONSOLE</span>
      </footer>
    </main>
  );
}
