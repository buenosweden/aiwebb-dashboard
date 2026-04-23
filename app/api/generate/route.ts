import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { publishToWordPress } from "@/lib/wordpress";
import type { Payload } from "@/lib/payload";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const GENERATE_PROMPT = `Du är en expert på att skapa professionella svenska hemsidor. Baserat på företagsinformationen nedan, generera en komplett hemsida-payload i JSON-format.

VIKTIGT: Svara ENDAST med giltig JSON. Inga förklaringar, inga markdown-backticks, bara ren JSON.

JSON-schemat ska följa denna exakta struktur:
{
  "page": {
    "title": "string",
    "slug": "hem",
    "is_front_page": true,
    "template": "landing"
  },
  "brand": {
    "name": "string",
    "primary_color": "#hexkod",
    "tone": "professional"
  },
  "seo": {
    "meta_title": "string (max 60 tecken)",
    "meta_description": "string (max 155 tecken)",
    "focus_keyword": "string"
  },
  "sections": [
    {
      "type": "hero",
      "data": {
        "eyebrow": "kort eyebrow-text",
        "headline": "stark huvudrubrik (max 8 ord)",
        "subheadline": "förklarande text (1-2 meningar)",
        "primary_cta": {"label": "knapptext", "url": "#kontakt", "style": "primary"},
        "secondary_cta": {"label": "knapptext", "url": "#om-oss"}
      }
    },
    {
      "type": "usp_row",
      "data": {
        "items": [
          {"icon": "emoji", "label": "kort USP", "description": "en mening"},
          {"icon": "emoji", "label": "kort USP", "description": "en mening"},
          {"icon": "emoji", "label": "kort USP", "description": "en mening"}
        ]
      }
    },
    {
      "type": "text_block",
      "data": {
        "heading": "Om [företaget]",
        "body": "2-3 meningar om företaget",
        "layout": "single"
      }
    },
    {
      "type": "feature_grid",
      "data": {
        "heading": "Vad vi erbjuder",
        "intro": "kort intro",
        "items": [
          {"icon": "emoji", "title": "tjänst/produkt", "description": "kort beskrivning"},
          {"icon": "emoji", "title": "tjänst/produkt", "description": "kort beskrivning"},
          {"icon": "emoji", "title": "tjänst/produkt", "description": "kort beskrivning"}
        ]
      }
    },
    {
      "type": "faq",
      "data": {
        "heading": "Vanliga frågor",
        "items": [
          {"question": "relevant fråga", "answer": "tydligt svar"},
          {"question": "relevant fråga", "answer": "tydligt svar"},
          {"question": "relevant fråga", "answer": "tydligt svar"}
        ]
      }
    },
    {
      "type": "cta_band",
      "data": {
        "heading": "Redo att komma igång?",
        "body": "kort uppmaning",
        "cta": {"label": "Kontakta oss", "url": "#kontakt", "style": "primary"},
        "background": "dark"
      }
    }
  ]
}

Anpassa allt innehåll till företaget. Gör det professionellt, konkret och säljande på svenska.`;

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { answers } = await req.json();

  const userContext = `
Företagsnamn och beskrivning: ${answers[0] ?? ""}
Tjänster/produkter: ${answers[1] ?? ""}
Målgrupp: ${answers[2] ?? ""}
Unika fördelar: ${answers[3] ?? ""}
Primärfärg: ${answers[4] ?? "#0F1012"}
`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `${GENERATE_PROMPT}\n\nFÖRETAGSINFORMATION:\n${userContext}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    return NextResponse.json({ error: "generation_failed" }, { status: 500 });
  }

  let payload: Payload;
  try {
    const clean = content.text.replace(/```json|```/g, "").trim();
    payload = JSON.parse(clean);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 500 });
  }

  const { data: site } = await supabase
    .from("sites")
    .select("wp_url, wp_api_key")
    .eq("user_id", user.id)
    .maybeSingle();

  await supabase
    .from("sites")
    .update({
      name: payload.brand?.name ?? "Min sajt",
      brand: payload.brand,
      seo: payload.seo,
      sections: payload.sections,
    })
    .eq("user_id", user.id);

  if (site?.wp_url && site?.wp_api_key) {
    await publishToWordPress(payload, {
      baseUrl: site.wp_url,
      apiKey: site.wp_api_key,
    });
  }

  return NextResponse.json({ success: true, payload });
}
