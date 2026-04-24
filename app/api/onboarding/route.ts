import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Hämta profil för personalisering
  let profile: { full_name?: string; company_name?: string } = {};
  if (user) {
    const { data } = await supabase.from("profiles").select("full_name, company_name").eq("id", user.id).maybeSingle();
    if (data) profile = data;
  }

  const { messages } = await req.json();
  const firstName = profile.full_name?.split(" ")[0] ?? "";
  const companyName = profile.company_name ?? "";

  const SYSTEM_PROMPT = `Du är en vänlig och professionell onboarding-assistent för aiwebb — en tjänst som bygger professionella hemsidor åt svenska småföretagare med AI.

${firstName ? `Kundens namn är ${firstName}.` : ""}
${companyName ? `Företagsnamnet är "${companyName}".` : ""}

Din uppgift är att ställa EXAKT 5 frågor för att samla info om företaget, sedan generera en hemsida.

FRÅGA 1 (första meddelandet): Hälsa ${firstName ? firstName : "kunden"} välkommen med namn. ${companyName ? `Nämn att du sett att de heter "${companyName}" och fråga vad företaget gör och vilka tjänster/produkter de erbjuder.` : "Fråga vad företaget heter och vad de gör."}

FRÅGA 2: Vilka är era kunder? (privatpersoner, företag, ålder, ort)
FRÅGA 3: Vad är ni bäst på eller vad skiljer er från konkurrenterna?
FRÅGA 4: Har ni något specifikt ni vill lyfta fram — erbjudande, garanti, pris?
FRÅGA 5: Välj en primärfärg för sajten (hex-kod eller beskriv: mörkblå, grön, röd)

REGLER:
- EN fråga i taget, kort och vänlig
- Använd kundens förnamn ibland för personlighet
- Efter svar på fråga 5: avsluta med exakt texten ONBOARDING_COMPLETE
- Max 2 meningar innan varje fråga
- Var entusiastisk — detta är ett spännande projekt!`;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 400,
    system: SYSTEM_PROMPT,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
