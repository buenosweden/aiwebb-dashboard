"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, CheckCircle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Phase = "chatting" | "generating" | "done" | "error";

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<Phase>("chatting");
  const [answers, setAnswers] = useState<string[]>([]);
  const [generatingText, setGeneratingText] = useState("Genererar din sajt...");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Starta med första AI-frågan
  useEffect(() => {
    askAI([]);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function askAI(history: Message[]) {
    setLoading(true);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });

    if (!res.ok || !res.body) {
      setLoading(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      full += decoder.decode(value);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: full };
        return updated;
      });
    }

    setLoading(false);
    inputRef.current?.focus();

    if (full.includes("ONBOARDING_COMPLETE")) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: full.replace("ONBOARDING_COMPLETE", "").trim(),
        };
        return updated;
      });
      setTimeout(() => generateSite(answers), 800);
    }
  }

  async function handleSend() {
    if (!input.trim() || loading || phase !== "chatting") return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const newAnswers = [...answers, input.trim()];
    setAnswers(newAnswers);

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    await askAI(newMessages);
  }

  async function generateSite(finalAnswers: string[]) {
    setPhase("generating");

    const texts = [
      "Analyserar ditt företag...",
      "Skriver texter...",
      "Skapar sektioner...",
      "Optimerar för sökmotorer...",
      "Publicerar din sajt...",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < texts.length) {
        setGeneratingText(texts[i]);
        i++;
      }
    }, 1800);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: finalAnswers }),
      });

      clearInterval(interval);

      if (!res.ok) {
        setPhase("error");
        return;
      }

      setPhase("done");
      setGeneratingText("Din sajt är klar! 🎉");
      setTimeout(() => router.push("/hantera"), 2000);
    } catch {
      clearInterval(interval);
      setPhase("error");
    }
  }

  if (phase === "generating" || phase === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6 max-w-sm px-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
            {phase === "done" ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-medium mb-2">{generatingText}</h2>
            {phase === "generating" && (
              <p className="text-sm text-muted-foreground">
                Vi bygger din sajt med AI. Det tar bara några sekunder.
              </p>
            )}
            {phase === "done" && (
              <p className="text-sm text-muted-foreground">
                Skickar dig till dashboardet...
              </p>
            )}
          </div>
          {phase === "generating" && (
            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: "60%" }} />
            </div>
          )}
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 flex items-center gap-3">
        <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center">
          <span className="text-primary-foreground font-semibold text-xs">a</span>
        </div>
        <span className="text-sm font-medium">Skapa din sajt</span>
        <div className="ml-auto flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`h-1.5 w-6 rounded-full transition-colors ${
                n <= answers.length ? "bg-primary" : "bg-secondary"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Chatt */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-2xl mx-auto w-full">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mr-3 mt-0.5">
                <span className="text-primary-foreground font-semibold text-xs">a</span>
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-secondary text-foreground rounded-bl-sm"
              }`}
            >
              {msg.content || (
                <span className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t px-4 py-4">
        <div className="max-w-2xl mx-auto flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Skriv ditt svar..."
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            size="icon"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2">
          Tryck Enter för att skicka
        </p>
      </div>
    </div>
  );
}
