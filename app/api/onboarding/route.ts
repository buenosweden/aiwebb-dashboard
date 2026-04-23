import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `Du är en vänlig onboarding-assistent för aiwebb — en tjänst som bygger professionella hemsidor åt svenska småföretagare med hjälp av AI.

Din uppgift är att ställa EXAKT 5 frågor för att samla in information om företaget, sedan generera en komplett hemsida.

FRÅGORNA (ställ dem en i taget, i denna ordning):
1. "Vad heter ditt företag och vad gör ni?"
2. "Beskriv dina tjänster eller produkter — vad säljer du?"
3. "Vilka är dina kunder? (t.ex. privatpersoner, företag, ålder, ort)"
4. "Vad är du bäst på eller vad skiljer dig från konkurrenterna?"
5. "Vad är din primärfärg? Välj en hex-kod eller beskriv en färg (t.ex. mörkblå, grön, röd)"

REGLER:
- Ställ EN fråga i taget
- Håll svaren korta och vänliga (1-2 meningar max innan frågan)
- Efter fråga 5, avsluta med exakt: "ONBOARDING_COMPLETE"
- Lägg aldrig till extra frågor
- Var entusiastisk men professionell — som en duktig kollega

EXEMPEL PÅ BRA SVAR:
"Perfekt! Nu till tjänsterna — [FRÅGA 2]"
"Bra att veta! [FRÅGA 3]"`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    system: SYSTEM_PROMPT,
    messages,
  });

  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      controller.close();
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
