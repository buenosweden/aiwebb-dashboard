import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { publishToWordPress } from "@/lib/wordpress";
import type { Payload } from "@/lib/payload";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function generateSubdomain(text: string): string {
  const prefix = text.toLowerCase().replace(/[^a-z]/g, "").slice(0, 2) || "ai";
  const num = Math.floor(1000 + Math.random() * 9000);
  return prefix + "-" + num;
}

async function createWPSite(subdomain: string, siteName: string, apiKey: string): Promise<boolean> {
  const networkApiUrl = process.env.AIWEBB_WP_NETWORK_URL;
  const networkApiKey = process.env.AIWEBB_WP_NETWORK_KEY;
  if (!networkApiUrl || !networkApiKey) return false;

  try {
    const res = await fetch(`${networkApiUrl}/wp-json/aiwebb-network/v1/create-site`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${networkApiKey}` },
      body: JSON.stringify({ subdomain, site_name: siteName, api_key: apiKey }),
    });
    const data = await res.json();
    if (!res.ok) { console.error("WP site creation failed:", data); return false; }
    return true;
  } catch (err) {
    console.error("WP network API error:", err);
    return false;
  }
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
  const colorAnswer = answers[4] ?? "";
  const hexMatch = colorAnswer.match(/#[0-9a-fA-F]{6}/);
  const primaryColor = hexMatch ? hexMatch[0] : "#0F1012";

  // Generera AI-innehåll — flera sidor
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 6000,
    messages: [{
      role: "user",
      content: `Generera en komplett sajt med FLERA SIDOR som JSON. Svara ENDAST med giltig JSON, inga backticks.

Bestäm vilka sidor som passar företaget bäst (3-5 sidor). Alltid med: startsida (hem), kontaktsida. Välj sedan lämpliga undersidor baserat på branschen, t.ex. om-oss, tjanster, priser, blogg, portfolio, referenser.

Schema:
{
  "brand": {
    "name": "string",
    "primary_color": "#hex",
    "tone": "professional"
  },
  "pages": [
    {
      "page": { "title": "string", "slug": "hem", "is_front_page": true, "template": "landing" },
      "seo": { "meta_title": "string (max 60 tecken)", "meta_description": "string (max 155 tecken)", "focus_keyword": "string" },
      "sections": [
        { "type": "hero", "data": { "eyebrow": "string", "headline": "string", "subheadline": "string", "primary_cta": { "label": "string", "url": "#kontakt" }, "secondary_cta": { "label": "string", "url": "#om" } } },
        { "type": "usp_row", "data": { "items": [{ "icon": "emoji", "label": "string", "description": "string" }] } },
        { "type": "feature_grid", "data": { "heading": "string", "intro": "string", "items": [{ "icon": "emoji", "title": "string", "description": "string" }] } },
        { "type": "testimonial", "data": { "quote": "string", "name": "string", "title": "string" } },
        { "type": "faq", "data": { "heading": "string", "subtitle": "string", "body": "string", "cta": { "label": "string", "url": "#kontakt" }, "items": [{ "question": "string", "answer": "string" }] } },
        { "type": "cta_band", "data": { "heading": "string", "body": "string", "cta": { "label": "string", "url": "#kontakt" }, "background": "dark" } }
      ]
    },
    {
      "page": { "title": "Om oss", "slug": "om-oss", "is_front_page": false, "template": "page" },
      "seo": { "meta_title": "string", "meta_description": "string", "focus_keyword": "string" },
      "sections": [
        { "type": "hero", "data": { "eyebrow": "string", "headline": "string", "subheadline": "string", "primary_cta": { "label": "string", "url": "#kontakt" } } },
        { "type": "image_text", "data": { "subtitle": "string", "heading": "string", "body": "string", "cta": { "label": "string", "url": "#kontakt" }, "checklist": ["string", "string", "string", "string", "string", "string"] } },
        { "type": "stats", "data": { "items": [{ "value": "string", "label": "string", "description": "string" }] } },
        { "type": "cta_band", "data": { "heading": "string", "body": "string", "cta": { "label": "string", "url": "#kontakt" }, "background": "dark" } }
      ]
    },
    {
      "page": { "title": "Kontakt", "slug": "kontakt", "is_front_page": false, "template": "page" },
      "seo": { "meta_title": "string", "meta_description": "string", "focus_keyword": "string" },
      "sections": [
        { "type": "contact", "data": { "subtitle": "string", "heading": "string", "body": "string", "phone": "string", "form_title": "Skicka ett meddelande", "cta_label": "Skicka meddelande" } }
      ]
    }
  ]
}

Företag: ${companyName}
Tjänster: ${answers[0] ?? ""}
Målgrupp: ${answers[1] ?? ""}
Fördelar: ${answers[2] ?? ""}
Erbjudande: ${answers[3] ?? ""}
VIKTIGT - Primärfärg (MÅSTE användas exakt i brand.primary_color): ${primaryColor}

Skriv professionell säljande svenska. Anpassa sidstrukturen efter branschen.`,
    }],
  });

  const content = message.content[0];
  if (content.type !== "text") return NextResponse.json({ error: "generation_failed" }, { status: 500 });

  let result: { brand: Payload["brand"]; pages: Array<{ page: Payload["page"]; seo: Payload["seo"]; sections: Payload["sections"] }> };
  try {
    result = JSON.parse(content.text.replace(/```json|```/g, "").trim());
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 500 });
  }

  // Override primärfärg
  if (hexMatch && result.brand) {
    result.brand.primary_color = hexMatch[0];
  }

  // Generera unik subdomän
  const baseSlug = generateSubdomain(companyName || result.brand?.name || "min-sajt");
  let subdomain = baseSlug;
  let counter = 0;
  while (true) {
    const { data: existing } = await supabase.from("sites").select("id").eq("subdomain", subdomain).maybeSingle();
    if (!existing) break;
    counter++;
    subdomain = baseSlug + "-" + counter;
  }

  const wpUrl = "https://" + subdomain + ".aiwebb.se";
  const wpApiKey = process.env.AIWEBB_WP_API_KEY ?? "testkey_tennisgrus_abc123xyz789";

  // Spara i Supabase
  const firstPage = result.pages[0];
  let site;
  if (siteId) {
    const { data } = await supabase.from("sites").update({
      name: result.brand?.name ?? companyName,
      brand: result.brand,
      seo: firstPage.seo,
      sections: firstPage.sections,
    }).eq("id", siteId).eq("user_id", user.id).select().maybeSingle();
    site = data;
  } else {
    const { data } = await supabase.from("sites").insert({
      user_id: user.id,
      name: result.brand?.name ?? companyName,
      subdomain,
      wp_url: wpUrl,
      wp_api_key: wpApiKey,
      brand: result.brand,
      seo: firstPage.seo,
      sections: firstPage.sections,
    }).select().maybeSingle();
    site = data;
  }

  // Skapa WP-subsajt
  await createWPSite(subdomain, result.brand?.name ?? companyName, wpApiKey);

  // Publicera alla sidor till WP
  if (wpUrl && wpApiKey) {
    for (const pageData of result.pages) {
      const payload: Payload = {
        page: pageData.page,
        brand: result.brand,
        seo: pageData.seo,
        sections: pageData.sections,
      };
      await publishToWordPress(payload, { baseUrl: wpUrl, apiKey: wpApiKey }).catch(console.error);
    }
  }

  return NextResponse.json({ success: true, subdomain, wp_url: wpUrl, pages: result.pages.length });
}
