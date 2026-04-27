import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import type { Payload } from "@/lib/payload";

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function generateSubdomain(text: string): string {
  const prefix = text.toLowerCase().replace(/[^a-z]/g, "").slice(0, 2) || "ai";
  const num = Math.floor(1000 + Math.random() * 9000);
  return prefix + "-" + num;
}

async function createWPSite(subdomain: string, siteName: string, apiKey: string): Promise<void> {
  const networkApiUrl = process.env.AIWEBB_WP_NETWORK_URL;
  const networkApiKey = process.env.AIWEBB_WP_NETWORK_KEY;
  if (!networkApiUrl || !networkApiKey) return;
  try {
    await fetch(`${networkApiUrl}/wp-json/aiwebb-network/v1/create-site`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${networkApiKey}` },
      body: JSON.stringify({ subdomain, site_name: siteName, api_key: apiKey }),
    });
  } catch (err) { console.error("WP network API error:", err); }
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

  // Generera startsidan med AI
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Generera startsidan som JSON. Svara ENDAST med giltig JSON, inga backticks.

{
  "brand": { "name": "string", "primary_color": "${primaryColor}", "tone": "professional" },
  "page": { "title": "string", "slug": "hem", "is_front_page": true, "template": "landing" },
  "seo": { "meta_title": "string (max 60 tecken)", "meta_description": "string (max 155 tecken)", "focus_keyword": "string" },
  "sections": [
    { "type": "hero", "data": { "eyebrow": "string", "headline": "string", "subheadline": "string", "primary_cta": { "label": "string", "url": "#kontakt" }, "secondary_cta": { "label": "string", "url": "#om" } } },
    { "type": "usp_row", "data": { "items": [{ "icon": "emoji", "label": "string", "description": "string" }, { "icon": "emoji", "label": "string", "description": "string" }, { "icon": "emoji", "label": "string", "description": "string" }] } },
    { "type": "feature_grid", "data": { "heading": "string", "intro": "string", "items": [{ "icon": "emoji", "title": "string", "description": "string" }, { "icon": "emoji", "title": "string", "description": "string" }, { "icon": "emoji", "title": "string", "description": "string" }] } },
    { "type": "cta_band", "data": { "heading": "string", "body": "string", "cta": { "label": "string", "url": "#kontakt" }, "background": "dark" } }
  ]
}

Företag: ${companyName}
Tjänster: ${answers[0] ?? ""}
Målgrupp: ${answers[1] ?? ""}
Fördelar: ${answers[2] ?? ""}
Erbjudande: ${answers[3] ?? ""}
Primärfärg: ${primaryColor}

Skriv professionell säljande svenska.`,
    }],
  });

  const content = message.content[0];
  if (content.type !== "text") return NextResponse.json({ error: "generation_failed" }, { status: 500 });

  let homePage: Payload;
  try {
    homePage = JSON.parse(content.text.replace(/```json|```/g, "").trim());
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 500 });
  }

  if (homePage.brand) homePage.brand.primary_color = primaryColor;

  const baseSlug = generateSubdomain(companyName || homePage.brand?.name || "ai");
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
  if (siteId) {
    await supabase.from("sites").update({
      name: homePage.brand?.name ?? companyName,
      brand: homePage.brand,
      seo: homePage.seo,
      sections: homePage.sections,
    }).eq("id", siteId).eq("user_id", user.id);
  } else {
    await supabase.from("sites").insert({
      user_id: user.id,
      name: homePage.brand?.name ?? companyName,
      subdomain,
      wp_url: wpUrl,
      wp_api_key: wpApiKey,
      brand: homePage.brand,
      seo: homePage.seo,
      sections: homePage.sections,
    });
  }

  // Skapa WP-subsajt (snabbt anrop, blockar inte länge)
  await createWPSite(subdomain, homePage.brand?.name ?? companyName, wpApiKey);

  return NextResponse.json({ success: true, subdomain, wp_url: wpUrl });
}
