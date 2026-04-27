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
type Phase = "chatting" | "generating" | "done" | "error";

const QUICK_REPLIES: Record<number, string[]> = {
  0: [],
  1: ["Privatpersoner i hela Sverige", "Foretag och organisationer", "Lokala kunder i min stad", "Bade privat och foretag"],
  2: ["Snabb leverans och tillganglighet", "Lang erfarenhet och expertis", "Personlig service och omsorg", "Basta pris pa marknaden"],
  3: ["Fri frakt", "Nojd-kund-garanti", "Oppet kop 30 dagar", "Gratis konsultation"],
  4: [{ label: "Mörkblå", value: "#1E3A8A" }, { label: "Mörkgrön", value: "#166534" }, { label: "Rostrött", value: "#9A3412" }, { label: "Antracit", value: "#1F2937" }, { label: "Lila", value: "#7C3AED" }, { label: "Teal", value: "#0F766E" }],
};

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const siteId = searchParams.get("site");

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("chatting");
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

  useEffect(() => {
    if (profile === null) return;
    if (chatStarted.current) return;
    chatStarted.current = true;
    askAI([], profile);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function askAI(history: Message[], currentProfile: {full_name?: string; company_name?: string}) {
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
        setTimeout(() => generateSite(answers), 800);
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
    await askAI(newMessages, profile ?? {});
  }

  async function generateSite(finalAnswers: string[]) {
    setPhase("generating");
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers, siteId }),
      });
      if (!res.ok) { setPhase("error"); return; }
      setPhase("done");
      router.push("/hantera");
    } catch {
      setPhase("error");
    }
  }

  if (phase === "generating" || phase === "done") return <GeneratingScreen />;

  if (phase === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">Nagot gick fel. Forsok igen.</p>
          <Button onClick={() => router.push("/onboarding")}>Borja om</Button>
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-semibold text-xs">a</span>
        </div>
        <span className="text-sm font-medium">Skapa din sajt</span>
        <div className="ml-auto flex gap-1">
          {[1,2,3,4,5].map(n => (
            <div key={n} className={`h-1.5 w-6 rounded-full transition-colors duration-300 ${n <= answers.length ? "bg-primary" : "bg-secondary"}`} />
          ))}
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

      <div className="border-t px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendAnswer(input)}
            placeholder={currentQuickReplies.length > 0 ? "Eller skriv ditt eget svar..." : "Skriv ditt svar..."}
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
