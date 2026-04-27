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

  if (!networkApiUrl || !networkApiKey) {
    console.error("Network API not configured");
    return false;
  }

  try {
    const res = await fetch(`${networkApiUrl}/wp-json/aiwebb-network/v1/create-site`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${networkApiKey}`,
      },
      body: JSON.stringify({ subdomain, site_name: siteName, api_key: apiKey }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("WP site creation failed:", data);
      return false;
    }

    console.log("WP site created:", data);
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

  // Generera AI-innehåll
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
    { "type": "hero", "data": { "eyebrow": "string", "headline": "string", "subheadline": "string", "primary_cta": { "label": "string", "url": "#kontakt" }, "secondary_cta": { "label": "string", "url": "#om" } } },
    { "type": "usp_row", "data": { "items": [{ "icon": "emoji", "label": "string", "description": "string" }, { "icon": "emoji", "label": "string", "description": "string" }, { "icon": "emoji", "label": "string", "description": "string" }] } },
    { "type": "text_block", "data": { "heading": "string", "body": "string", "layout": "single" } },
    { "type": "feature_grid", "data": { "heading": "string", "intro": "string", "items": [{ "icon": "emoji", "title": "string", "description": "string" }, { "icon": "emoji", "title": "string", "description": "string" }, { "icon": "emoji", "title": "string", "description": "string" }] } },
    { "type": "faq", "data": { "heading": "Vanliga fragor", "items": [{ "question": "string", "answer": "string" }, { "question": "string", "answer": "string" }, { "question": "string", "answer": "string" }] } },
    { "type": "cta_band", "data": { "heading": "string", "body": "string", "cta": { "label": "string", "url": "#kontakt" }, "background": "dark" } }
  ]
}

Foretag: ${companyName}
Tjanster: ${answers[0] ?? ""}
Malgrupp: ${answers[1] ?? ""}
Fordelar: ${answers[2] ?? ""}
Erbjudande: ${answers[3] ?? ""}
Farg: ${(answers[4] ?? "").match(/#[0-9a-fA-F]{6}/) ? (answers[4]).match(/#[0-9a-fA-F]{6}/)[0] : "#0F1012"}

Skriv professionell saljande svenska.`,
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

  // Generera unik subdomän
  const baseSlug = generateSubdomain(companyName || payload.brand?.name || "min-sajt");
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
      wp_api_key: wpApiKey,
      brand: payload.brand,
      seo: payload.seo,
      sections: payload.sections,
    }).select().maybeSingle();
    site = data;
  }

  // Skapa WP-subsajt automatiskt
  await createWPSite(subdomain, payload.brand?.name ?? companyName, wpApiKey);

  // Publicera till WP
  if (wpUrl && wpApiKey) {
    await publishToWordPress(payload, { baseUrl: wpUrl, apiKey: wpApiKey }).catch(console.error);
  }

  return NextResponse.json({ success: true, subdomain, wp_url: wpUrl });
}
