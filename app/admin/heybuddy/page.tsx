"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Activity, AudioLines, Bot, Bug, CheckCircle,
  Code2, Globe, Hotel, Mic, MicOff, Send,
  ShieldCheck, Volume2, VolumeX, Zap, RefreshCw,
  ArrowLeft, Lock, Database, DollarSign, Calendar
} from "lucide-react";

type Finding = {
  title: string;
  severity: string;
  detail: string;
  recommendation: string;
};

export default function HeyBuddyPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(true);
  const [command, setCommand] = useState("");
  const [status, setStatus] = useState("SYSTEM READY");
  const [messages, setMessages] = useState([
    {
      role: "HeyBuddy",
      text: "Hello Admin! HeyBuddy is online and connected to StayBuddy intelligence. How can I assist you today?"
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

  // VOICE RESPONSE
  function speak(text: string) {
    if (!speaking || typeof window === "undefined") return;

    try {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-IN";
      utterance.rate = 0.94;
      utterance.pitch = 0.85;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  }

  function reply(text: string, originalCommand: string) {
    setMessages(old => [
      ...old,
      { role: "You", text: originalCommand },
      { role: "HeyBuddy", text }
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

  // LIVE STAYBUDDY INTELLIGENCE FETCHERS
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

      return `StayBuddy has recorded ${total} total bookings to date. Currently: ${confirmed} are confirmed or completed, ${paid} have verified paid payments, and ${pending} are pending verification. Today there are ${todayBookings.length} new booking requests recorded.`;
    } catch (err) {
      return "Connected to StayBuddy bookings API, but could not load current records. Please verify the database connection in the Admin panel.";
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

      return `StayBuddy Financial Audit: Verified booking revenue is ₹${totalRevenue.toLocaleString("en-IN")} across ${confirmedPaid.length} confirmed paid reservations. Estimated gross platform margin is ₹${totalCommission.toLocaleString("en-IN")}.`;
    } catch (err) {
      return "Could not compute financial figures at this moment. You can check the complete tax invoices and margins tab in the Admin Console.";
    }
  }

  async function fetchLiveHotels(): Promise<string> {
    try {
      const res = await fetch("/api/admin/hotels");
      if (!res.ok) throw new Error("Failed to fetch hotels");
      const data = await res.json();
      const hotels: any[] = data.hotels || [];

      const total = hotels.length;
      const approved = hotels.filter(h => h.status === "approved").length;
      const pending = hotels.filter(h => h.status === "pending" || h.hasPendingRoomUpdates === true || (Array.isArray(h.rooms) && h.rooms.some((r: any) => r.approvalStatus === "pending"))).length;
      const extranetCount = hotels.filter(h => h.isExtranet === true || h.source === "extranet").length;

      return `StayBuddy Hotel Inventory: There are ${total} registered properties in total. ${approved} properties are active and live for booking on the B2C portal. ${pending} properties or room updates require admin review, with ${extranetCount} properties managed via Partner Extranet.`;
    } catch (err) {
      return "Could not retrieve hotel inventory list. Please review the Properties tab in the Admin Console.";
    }
  }

  // COMMAND ENGINE
  async function execute(input: string) {
    const q = input.trim().toLowerCase();
    if (!q) return;

    setStatus("PROCESSING COMMAND");

    if (
      q.includes("scan") ||
      q.includes("website") ||
      q.includes("bug") ||
      q.includes("error") ||
      q.includes("health")
    ) {
      const result = await scanWebsite();
      const answer = `Website inspection completed. ${result.length} diagnostic findings are available in the diagnostics panel.`;
      reply(answer, input);
      return;
    }

    if (q.includes("booking") || q.includes("reservation")) {
      setStatus("FETCHING BOOKINGS DATA");
      const answer = await fetchLiveBookings();
      reply(answer, input);
      return;
    }

    if (q.includes("revenue") || q.includes("sales") || q.includes("profit") || q.includes("money") || q.includes("finance")) {
      setStatus("CALCULATING REVENUE");
      const answer = await fetchLiveRevenue();
      reply(answer, input);
      return;
    }

    if (q.includes("hotel") || q.includes("property") || q.includes("inventory") || q.includes("room")) {
      setStatus("ANALYZING HOTEL INVENTORY");
      const answer = await fetchLiveHotels();
      reply(answer, input);
      return;
    }

    if (q.includes("call") || q.includes("phone")) {
      reply(
        "Telephony integration is ready for configuration. Direct Twilio/Exotel customer calling can be dispatched from the Partner Bookings panel.",
        input
      );
      return;
    }

    if (q.includes("hello") || q.includes("hi") || q.includes("hey")) {
      reply(
        "Hello Admin! HeyBuddy is online, fully authorized, and standing by for your commands.",
        input
      );
      return;
    }

    if (q.includes("help") || q.includes("commands") || q.includes("what can you do")) {
      reply(
        "You can ask me to: 1. Scan my website for bugs and accessibility issues. 2. Show today's bookings. 3. Show live revenue and gross profit. 4. Check hotel inventory and pending approvals. Or click any quick action below.",
        input
      );
      return;
    }

    if (q.includes("admin") || q.includes("dashboard") || q.includes("go to admin")) {
      reply("Taking you to the StayBuddy Admin Console overview.", input);
      setTimeout(() => router.push("/admin"), 1000);
      return;
    }

    reply(
      `Command received: "${input}". Querying StayBuddy platform intelligence... You can review full real-time details across the Admin Console tabs.`,
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

    if (listeningRef.current) return;

    try {
      const engine = new SpeechRecognition();
      engine.continuous = true;
      engine.interimResults = true;
      engine.lang = "en-IN";

      engine.onresult = (event: any) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (!event.results[i].isFinal) continue;

          const transcript = event.results[i][0].transcript.trim();
          const normalized = transcript.toLowerCase();

          if (!wakeActive.current && normalized.includes("hey buddy")) {
            wakeActive.current = true;
            setStatus("HEYBUDDY ACTIVATED");

            const afterWake = normalized.split("hey buddy").pop()?.trim();
            speak("Yes sir. I'm listening.");

            if (afterWake) {
              wakeActive.current = false;
              execute(afterWake);
            }
          } else if (wakeActive.current) {
            wakeActive.current = false;
            execute(transcript);
          }
        }
      };

      engine.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setStatus("VOICE CONNECTION INTERRUPTED");
      };

      engine.onend = () => {
        if (listeningRef.current) {
          try {
            engine.start();
          } catch {
            setStatus("VOICE RESTART FAILED");
          }
        }
      };

      recognition.current = engine;
      listeningRef.current = true;
      engine.start();
      setListening(true);
      setStatus("LISTENING FOR 'HEY BUDDY'");
    } catch (err) {
      listeningRef.current = false;
      setStatus("MICROPHONE UNAVAILABLE");
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

  const quickCommands = [
    "Scan my website",
    "Show today's bookings",
    "Show revenue",
    "Check hotel performance"
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
                ADMIN ONLY
              </span>
            </div>
            <p className="text-[9px] tracking-[3px] text-sky-300">
              STAYBUDDY INTELLIGENCE CONSOLE
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

      {/* HERO VOICE ORB */}
      <section className="text-center py-10 flex flex-col items-center">
        <div className={`orb ${listening ? "active" : ""} ${scanning ? "scanning" : ""}`}>
          <div className="orb-inner">
            <AudioLines size={55} />
          </div>
        </div>

        <h2 className="text-3xl font-bold tracking-[8px] mt-6">
          HEYBUDDY
        </h2>

        <p className="text-sky-300 text-xs tracking-[3px] mt-2">
          YOUR INTELLIGENT STAYBUDDY BUSINESS ASSISTANT
        </p>

        <p className="text-sky-400 text-xs tracking-widest mt-4 font-mono">
          ● {status}
        </p>

        <p className="text-slate-400 text-xs mt-2">
          {listening
            ? 'Microphone active. Say "Hey Buddy" followed by your command.'
            : 'Activate the microphone to talk or type your command below.'}
        </p>

        <div className="flex gap-3 mt-6">
          <button
            onClick={listening ? stopListening : startListening}
            className={`${listening ? "bg-red-600 hover:bg-red-500" : "bg-blue-600 hover:bg-blue-500"} px-6 py-3 rounded-xl flex items-center gap-2 font-bold text-xs tracking-wider transition shadow-lg shadow-blue-500/20`}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
            {listening ? "STOP LISTENING" : "ACTIVATE HEYBUDDY"}
          </button>

          <button
            onClick={() => {
              setSpeaking(!speaking);
              if (typeof window !== "undefined") window.speechSynthesis.cancel();
            }}
            title={speaking ? "Mute Voice Responses" : "Unmute Voice Responses"}
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
              <span className="text-sky-400 text-[10px] font-mono">AI CONSOLE</span>
            </div>

            <div className="min-h-[250px] max-h-[340px] overflow-y-auto py-4 space-y-4 pr-1">
              {messages.map((message, index) => (
                <div key={index} className="flex gap-3 border-b border-slate-800/80 pb-3">
                  <div className="text-sky-400 mt-0.5">
                    {message.role === "You" ? <Mic size={16} /> : <Bot size={18} />}
                  </div>

                  <div className="flex-1">
                    <strong className="text-sky-300 text-xs">
                      {message.role}
                    </strong>
                    <p className="text-slate-300 text-xs leading-relaxed mt-1">
                      {message.text}
                    </p>
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
                placeholder="Ask HeyBuddy anything about bookings, revenue, hotels..."
                className="flex-1 min-w-0 bg-[#061523] border border-slate-700 focus:border-sky-500 p-3 rounded-xl text-sm outline-none transition text-white placeholder-slate-500"
              />

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 px-4 rounded-xl transition flex items-center justify-center text-white"
              >
                <Send size={18} />
              </button>
            </form>

            <div className="flex flex-wrap gap-2 mt-4">
              {quickCommands.map(item => (
                <button
                  key={item}
                  onClick={() => execute(item)}
                  className="bg-slate-800/90 hover:bg-slate-700 border border-slate-700 hover:border-sky-500 rounded-lg text-[10px] px-3 py-2 text-sky-200 transition"
                >
                  {item}
                </button>
              ))}
            </div>
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
                No inspection has been run yet. Click "Start Website Scan" to begin.
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
        <span className="flex items-center gap-2"><Zap size={14}/> HEYBUDDY AI V1.0</span>
        <span className="flex items-center gap-2"><RefreshCw size={14}/> SCANS RUN: {scanCount}</span>
        <span className="flex items-center gap-2"><Hotel size={14}/> STAYBUDDY ADMIN CONSOLE</span>
      </footer>
    </main>
  );
}
