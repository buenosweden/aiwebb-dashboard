import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { messages, profile } = await req.json();

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const companyName = profile?.company_name ?? "";

  const SYSTEM_PROMPT = `Du är en vänlig onboarding-assistent för aiwebb som bygger hemsidor åt svenska småföretagare med AI.

${firstName ? `Kundens namn är ${firstName}.` : ""}
${companyName ? `Företagsnamnet är "${companyName}".` : ""}

Ställ EXAKT 5 frågor en i taget:
1. Hälsa ${firstName ? firstName : "kunden"} välkommen varmt. ${companyName ? `Bekräfta att de heter "${companyName}" och fråga vad företaget gör.` : "Fråga vad företaget heter och vad de gör."}
2. Vilka är era kunder? (privatpersoner, företag, ålder, ort)
3. Vad är ni bäst på eller vad skiljer er från konkurrenterna?
4. Har ni något specifikt ni vill lyfta fram — erbjudande, garanti, pris?
5. Välj en primärfärg (hex-kod eller beskriv: mörkblå, grön, röd)

REGLER: EN fråga i taget. Max 2 meningar innan frågan. Efter svar på fråga 5: skriv exakt ONBOARDING_COMPLETE`;

  try {
    const stream = await client.messages.stream({
      model: "claude-sonnet-4-5",
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
  } catch (error) {
    console.error("Onboarding API error:", error);
    return NextResponse.json({ error: "api_error" }, { status: 500 });
  }
}
