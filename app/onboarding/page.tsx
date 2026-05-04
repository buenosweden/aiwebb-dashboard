"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase-client";
import { GeneratingScreen } from "./generating";

interface Message { role: "user" | "assistant"; content: string; }
type Phase = "selecting" | "chatting" | "generating" | "done" | "error";
type SiteType = "landing" | "full";

const COLOR_OPTIONS = [
  { hex: "#1E3A8A", name: "Mörkblå" },
  { hex: "#166534", name: "Mörkgrön" },
  { hex: "#9A3412", name: "Tegelbrun" },
  { hex: "#1F2937", name: "Antracit" },
  { hex: "#7C3AED", name: "Lila" },
  { hex: "#0F766E", name: "Petrol" },
];

const QUICK_REPLIES: Record<number, string[]> = {
  0: [],
  1: ["Privatpersoner i hela Sverige", "Företag och organisationer", "Lokala kunder i min stad", "Både privat och företag"],
  2: ["Snabb leverans och tillgänglighet", "Lång erfarenhet och expertis", "Personlig service och omsorg", "Bästa pris på marknaden"],
  3: ["Fri frakt", "Nöjd-kund-garanti", "Öppet köp 30 dagar", "Gratis konsultation"],
  4: [],
};

function ColorPicker({ onSelect }: { onSelect: (hex: string) => void }) {
  return (
    <div className="px-4 pb-3 max-w-2xl mx-auto w-full">
      <p className="text-xs text-muted-foreground mb-2">Välj en primärfärg för din sajt:</p>
      <div className="flex flex-wrap gap-3">
        {COLOR_OPTIONS.map(({ hex, name }) => (
          <button
            key={hex}
            onClick={() => onSelect(hex)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-input bg-background hover:bg-secondary transition-colors text-xs"
          >
            <span className="w-4 h-4 rounded-full flex-shrink-0 border border-black/10" style={{ backgroundColor: hex }} />
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}

function SiteTypeSelector({ onSelect }: { onSelect: (type: SiteType) => void }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-semibold text-xs">a</span>
        </div>
        <span className="text-sm font-medium">Skapa din sajt</span>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-xl font-semibold">Vilken typ av sajt vill du skapa?</h1>
            <p className="text-sm text-muted-foreground">Du kan alltid uppgradera en landningssida till en full hemsida senare.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <button
              onClick={() => onSelect("landing")}
              className="group relative flex flex-col gap-3 rounded-xl border-2 border-input bg-background p-6 text-left transition-all hover:border-primary hover:bg-secondary/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">⚡</span>
                <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Snabbast</span>
              </div>
              <div>
                <h2 className="font-semibold text-sm mb-1">Landningssida</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">En sida med allt viktigt — perfekt för att komma igång snabbt eller testa marknaden.</p>
              </div>
              <ul className="space-y-1">
                {["Hero, tjänster, om oss & kontakt", "Optimerad för konvertering", "Kan uppgraderas till hemsida"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </button>

            <button
              onClick={() => onSelect("full")}
              className="group relative flex flex-col gap-3 rounded-xl border-2 border-input bg-background p-6 text-left transition-all hover:border-primary hover:bg-secondary/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">🌐</span>
                <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">Rekommenderat</span>
              </div>
              <div>
                <h2 className="font-semibold text-sm mb-1">Full hemsida</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">Flera sidor med full struktur — bäst för etablerade företag som vill synas professionellt.</p>
              </div>
              <ul className="space-y-1">
                {["Start, Tjänster, Om oss, Kontakt", "Blogg som tillval", "Bäst för SEO och trovärdighet"].map(item => (
                  <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteId = searchParams.get("site");

  const [siteType, setSiteType] = useState<SiteType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("selecting");
  const [answers, setAnswers] = useState<string[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [profile, setProfile] = useState<{full_name?: string; company_name?: string} | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatStarted = useRef(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase.from("profiles").select("full_name, company_name").eq("id", user.id).maybeSingle();
        setProfile(data ?? {});
      } else {
        setProfile({});
      }
    }).catch(() => setProfile({}));
  }, []);

  function handleSelectType(type: SiteType) {
    setSiteType(type);
    setPhase("chatting");
  }

  useEffect(() => {
    if (phase !== "chatting") return;
    if (profile === null) return;
    if (chatStarted.current) return;
    chatStarted.current = true;
    askAI([], profile);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function askAI(history: Message[], currentProfile: {full_name?: string; company_name?: string}, currentAnswers: string[] = answers) {
    setLoading(true);
    try {
      const payload = history.length === 0
        ? { messages: [{ role: "user", content: "Hej, jag vill skapa en hemsida." }], profile: currentProfile }
        : { messages: history, profile: currentProfile };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok || !res.body) { setLoading(false); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      setMessages(prev => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += decoder.decode(value);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: full };
          return updated;
        });
      }

      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);

      if (full.includes("ONBOARDING_COMPLETE")) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: full.replace("ONBOARDING_COMPLETE", "").trim() };
          return updated;
        });
        setTimeout(() => generateSite(currentAnswers), 800);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function sendAnswer(text: string) {
    if (!text.trim() || loading || phase !== "chatting") return;
    const newAnswers = [...answers, text.trim()];
    setAnswers(newAnswers);
    setQuestionIndex(newAnswers.length);
    const newMessages = [...messages, { role: "user" as const, content: text.trim() }];
    setMessages(newMessages);
    setInput("");
    await askAI(newMessages, profile ?? {}, newAnswers);
  }

  async function generateSite(finalAnswers: string[]) {
    setPhase("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, siteId, siteType }),
      });
      if (!res.ok) { setPhase("error"); return; }
      setPhase("done");
      router.push("/hantera");
    } catch {
      setPhase("error");
    }
  }

  if (phase === "selecting") {
    return <SiteTypeSelector onSelect={handleSelectType} />;
  }

  if (phase === "generating" || phase === "done") return <GeneratingScreen />;

  if (phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Något gick fel. Försök igen.</p>
          <Button onClick={() => router.push("/onboarding")}>Börja om</Button>
        </div>
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const currentQuickReplies = QUICK_REPLIES[questionIndex] ?? [];
  const showColorPicker = questionIndex === 4 && !loading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-semibold text-xs">a</span>
        </div>
        <span className="text-sm font-medium">Skapa din sajt</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-muted-foreground border border-input px-2 py-0.5 rounded-full">
            {siteType === "landing" ? "⚡ Landningssida" : "🌐 Full hemsida"}
          </span>
          <div className="flex gap-1">
            {[1,2,3,4,5].map(n => (
              <div key={n} className={`h-1.5 w-6 rounded-full transition-colors duration-300 ${n <= answers.length ? "bg-primary" : "bg-secondary"}`} />
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                <span className="text-primary-foreground font-semibold text-xs">a</span>
              </div>
            )}
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-secondary text-foreground rounded-bl-sm"}`}>
              {msg.content || (
                <span className="flex gap-1 items-center h-5">
                  {[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: d + "ms" }} />)}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {!loading && currentQuickReplies.length > 0 && (
        <div className="px-4 pb-3 max-w-2xl mx-auto w-full">
          <div className="flex flex-wrap gap-2">
            {currentQuickReplies.map(reply => (
              <button key={reply} onClick={() => sendAnswer(reply)} className="text-xs px-3 py-1.5 rounded-full border border-input bg-background hover:bg-secondary transition-colors">
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {showColorPicker && <ColorPicker onSelect={(hex) => sendAnswer(hex)} />}

      <div className="border-t px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendAnswer(input)}
            placeholder={showColorPicker ? "Eller skriv en färg, t.ex. mörkblå..." : currentQuickReplies.length > 0 ? "Eller skriv ditt eget svar..." : "Skriv ditt svar..."}
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={() => sendAnswer(input)} disabled={loading || !input.trim()} size="icon">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}
