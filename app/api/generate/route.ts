import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { publishToWordPress } from "@/lib/wordpress";
import type { Payload } from "@/lib/payload";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\u00e5/g, "a").replace(/\u00e4/g, "a").replace(/\u00f6/g, "o")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { answers, siteId } = await req.json();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company_name")
    .eq("id", user.id)
    .maybeSingle();

  const companyName = profile?.company_name ?? answers[0] ?? "";
  const userContext = [
    "Foeretagsnamn: " + companyName,
    "Tjänster: " + (answers[0] ?? ""),
    "Målgrupp: " + (answers[1] ?? ""),
    "Fördelar: " + (answers[2] ?? ""),
    "Erbjudande: " + (answers[3] ?? ""),
    "Primärfärg: " + (answers[4] ?? "#0F1012"),
  ].join("\n");

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: `Generera en komplett hemsida-payload som JSON. Svara ENDAST m
cat > ~/Downloads/aiwebb-dashboard/app/onboarding/generating.tsx << 'EOF'
"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { icon: "🔍", label: "Analyserar ditt foretag...", color: "text-blue-500" },
  { icon: "✍️", label: "Skriver texter...", color: "text-purple-500" },
  { icon: "🏗️", label: "Skapar sektioner...", color: "text-orange-500" },
  { icon: "🎨", label: "Applicerar design...", color: "text-pink-500" },
  { icon: "🔎", label: "SEO-optimerar...", color: "text-green-500" },
  { icon: "🚀", label: "Publicerar din sajt...", color: "text-indigo-500" },
];

export function GeneratingScreen() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStep(prev => (prev + 1) % STEPS.length);
        setVisible(true);
      }, 300);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  const current = STEPS[step];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-8 max-w-sm px-6">
        <div className={`mx-auto h-20 w-20 rounded-2xl bg-secondary flex items-center justify-center transition-all duration-300 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
          <span className="text-4xl">{current.icon}</span>
        </div>
        <div className={`transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <h2 className={`text-lg font-medium mb-2 ${current.color}`}>{current.label}</h2>
          <p className="text-sm text-muted-foreground">Vi bygger din sajt med AI. Tar bara nagra sekunder.</p>
        </div>
        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: ((step + 1) / STEPS.length * 100) + "%" }} />
        </div>
        <div className="flex justify-center gap-1.5">
          {STEPS.map((_, i) => (
            <div key={i} className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${i <= step ? "bg-primary" : "bg-secondary"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
