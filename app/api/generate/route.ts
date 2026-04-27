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
    return res.ok;
  } catch { return false; }
}

// Generera EN sida åt gången för att hålla oss under 60s timeout
async function generatePage(
  pageType: string,
  companyName: string,
  answers: string[],
  primaryColor: string,
  brand: { name: string; primary_color: string; tone: string } | null
): Promise<Payload | null> {
  const brandInfo = brand
    ? `Företagsnamn: ${brand.name}, Primärfärg: ${brand.primary_color}`
    : `Företag: ${companyName}`;

  const pagePrompts: Record<string, string> = {
    hem: `Generera startsidan (slug: "hem", is_front_page: true) med sektionerna: hero, usp_row, feature_grid, testimonial, faq, cta_band.`,
    "om-oss": `Generera Om oss-sidan (slug: "om-oss") med sektionerna: hero, image_text (med checklist), stats, cta_band.`,
    tjanster: `Generera Tjänster-sidan (slug: "tjanster") med sektionerna: hero, feature_grid (detaljerade tjänster), image_text, cta_band.`,
    priser: `Generera Priser-sidan (slug: "priser") med sektionerna: hero, feature_grid (prisplaner/paket), faq, cta_band.`,
    kontakt: `Generera Kontakt-sidan (slug: "kontakt") med sektionen: contact.`,
  };

  const prompt = pagePrompts[pageType] || pagePrompts["hem"];

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2500,
    messages: [{
      role: "user",
      content: `Generera en sida som JSON. Svara ENDAST med giltig JSON, inga backticks.

${prompt}

Schema:
{
  "brand": { "name": "string", "primary_color": "#hex", "tone": "professional" },
  "page": { "title": "string", "slug": "string", "is_front_page": false, "template": "page" },
  "seo": { "meta_title": "string (max 60 tecken)", "meta_description": "string (max 155 tecken)", "focus_keyword": "string" },
  "sections": [ ...relevanta sektioner... ]
}

Tillgängliga sektionstyper och deras data-struktur:
- hero: { eyebrow, headline, subheadline, primary_cta: {label, url}, secondary_cta: {label, url} }
- usp_row: { items: [{icon, label, description}] }
- feature_grid: { heading, intro, items: [{icon, title, description}] }
- image_text: { subtitle, heading, body, cta: {label, url}, checklist: [string] }
- stats: { items: [{value, label, description}] }
- testimonial: { quote, name, title }
- faq: { heading, subtitle, body, cta: {label, url}, items: [{question, answer}] }
- cta_band: { heading, body, cta: {label, url}, background: "dark" }
- contact: { subtitle, heading, body, phone, form_title, cta_label }

${brandInfo}
Tjänster: ${answers[0] ?? ""}
Målgrupp: ${answers[1] ?? ""}
Fördelar: ${answers[2] ?? ""}
Erbjudande: ${answers[3] ?? ""}
VIKTIGT - Primärfärg (MÅSTE användas exakt i brand.primary_color): ${primaryColor}

Skriv professionell säljande svenska.`,
    }],
  });

  const content = message.content[0];
  if (content.type !== "text") return null;

  try {
    return JSON.parse(content.text.replace(/```json|```/g, "").trim()) as Payload;
  } catch { return null; }
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

  // Generera subdomän
  const baseSlug = generateSubdomain(companyName);
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

  // Generera startsidan först (mest kritisk)
  const homePage = await generatePage("hem", companyName, answers, primaryColor, null);
  if (!homePage) return NextResponse.json({ error: "generation_failed" }, { status: 500 });

  // Override primärfärg
  if (hexMatch && homePage.brand) homePage.brand.primary_color = primaryColor;

  // Spara i Supabase
  let site;
  if (siteId) {
    const { data } = await supabase.from("sites").update({
      name: homePage.brand?.name ?? companyName,
      brand: homePage.brand,
      seo: homePage.seo,
      sections: homePage.sections,
    }).eq("id", siteId).eq("user_id", user.id).select().maybeSingle();
    site = data;
  } else {
    const { data } = await supabase.from("sites").insert({
      user_id: user.id,
      name: homePage.brand?.name ?? companyName,
      subdomain,
      wp_url: wpUrl,
      wp_api_key: wpApiKey,
      brand: homePage.brand,
      seo: homePage.seo,
      sections: homePage.sections,
    }).select().maybeSingle();
    site = data;
  }

  // Skapa WP-subsajt
  await createWPSite(subdomain, homePage.brand?.name ?? companyName, wpApiKey);

  // Publicera startsidan
  if (wpUrl && wpApiKey) {
    await publishToWordPress(homePage, { baseUrl: wpUrl, apiKey: wpApiKey }).catch(console.error);
  }

  // Generera och publicera undersidor asynkront (efter att vi returnerat)
  const subPages = ["om-oss", "tjanster", "kontakt"];
  (async () => {
    for (const pageType of subPages) {
      try {
        const page = await generatePage(pageType, companyName, answers, primaryColor, homePage.brand ?? null);
        if (page) {
          if (hexMatch && page.brand) page.brand.primary_color = primaryColor;
          await publishToWordPress(page, { baseUrl: wpUrl, apiKey: wpApiKey }).catch(console.error);
        }
      } catch (err) {
        console.error(`Failed to generate page ${pageType}:`, err);
      }
    }
  })();

  return NextResponse.json({ success: true, subdomain, wp_url: wpUrl });
}
