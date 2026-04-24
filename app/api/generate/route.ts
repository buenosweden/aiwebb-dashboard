import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { publishToWordPress } from "@/lib/wordpress";
import type { Payload } from "@/lib/payload";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o")
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

  // Hämta profil
  const { data: profile } = await supabase.from("profiles").select("full_name, company_name").eq("id", user.id).maybeSingle();

  const userContext = `
Företagsnamn: ${profile?.company_name ?? answers[0] ?? ""}
Vad företaget gör / tjänster: ${answers[0] ?? ""}
Målgrupp: ${answers[1] ?? ""}
Unika fördelar: ${answers[2] ?? ""}
Erbjudande/garanti: ${answers[3] ?? ""}
Primärfärg: ${answers[4] ?? "#0F1012"}
`;

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4000,
    messages: [{
      role: "user",
      content: `Generera en komplett hemsida-payload som JSON. Svara ENDAST med giltig JSON, inga backticks.

Schema:
{
  "page": { "title": "string", "slug": "hem", "is_front_page": true, "template": "landing" },
  "brand": { "name": "string", "primary_color": "#hex", "tone": "professional" },
  "seo": { "meta_title": "string (max 60 tecken)", "meta_description": "string (max 155 tecken)", "focus_keyword": "string" },
  "sections": [
    { "type": "hero", "data": { "eyebrow": "string", "headline": "string (max 8 ord)", "subheadline": "string", "primary_cta": { "label": "string", "url": "#kontakt", "style": "primary" }, "secondary_cta": { "label": "string", "url": "#om" } } },
    { "type": "usp_row", "data": { "items": [{ "icon": "emoji", "label": "string", "description": "string" }, { "icon": "emoji", "label": "string", "description": "string" }, { "icon": "emoji", "label": "string", "description": "string" }] } },
    { "type": "text_block", "data": { "heading": "string", "body": "string", "layout": "single" } },
    { "type": "feature_grid", "data": { "heading": "string", "intro": "string", "items": [{ "icon": "emoji", "title": "string", "description": "string" }, { "icon": "emoji", "title": "string", "description": "string" }, { "icon": "emoji", "title": "string", "description": "string" }] } },
    { "type": "faq", "data": { "heading": "Vanliga frågor", "items": [{ "question": "string", "answer": "string" }, { "question": "string", "answer": "string" }, { "question": "string", "answer": "string" }] } },
    { "type": "cta_band", "data": { "heading": "string", "body": "string", "cta": { "label": "string", "url": "#kontakt", "style": "primary" }, "background": "dark" } }
  ]
}

FÖRETAGSINFO:
${userContext}

Skriv professionell säljande svenska. Anpassa allt till branschen.`,
    }],
  });

  const content = message.content[0];
  if (content.type !== "text") return NextResponse.json({ error: "generation_failed" }, { status: 500 });

  let payload: Payload;
  try {
    payload = JSON.parse(content.text.replace(/```json|```/g, "").trim());
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 500 });
  }

  // Generera subdomän från företagsnamn
  const companyName = profile?.company_name ?? payload.brand?.name ?? "min-sajt";
  const baseSlug = slugify(companyName);

  // Kolla att subdomänet är unikt
  let subdomain = baseSlug;
  let counter = 0;
  while (true) {
    const { data: existing } = await supabase.from("sites").select("id").eq("subdomain", subdomain).maybeSingle();
    if (!existing) break;
    counter++;
    subdomain = `${baseSlug}-${counter}`;
  }

  const wpUrl = `https://${subdomain}.aiwebb.se`;

  // Uppdatera eller skapa site
  let site;
  if (siteId) {
    const { data } = await supabase.from("sites").update({
      name: payload.brand?.name ?? companyName,
      brand: payload.brand,
      seo: payload.seo,
      sections: payload.sections,
    }).eq("id", siteId).eq("user_id", user.id).select().maybeSingle();
    site = data;
  } else {
    const { data } = await supabase.from("sites").insert({
      user_id: user.id,
      name: payload.brand?.name ?? companyName,
      subdomain,
      wp_url: wpUrl,
      wp_api_key: process.env.AIWEBB_WP_API_KEY ?? "",
      brand: payload.brand,
      seo: payload.seo,
      sections: payload.sections,
    }).select().maybeSingle();
    site = data;
  }

  // Publicera till WP om wp_url finns
  if (site?.wp_url && site?.wp_api_key) {
    await publishToWordPress(payload, { baseUrl: site.wp_url, apiKey: site.wp_api_key });
  }

  return NextResponse.json({ success: true, subdomain, wp_url: wpUrl });
}
