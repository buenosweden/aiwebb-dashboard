import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { publishToWordPress } from "@/lib/wordpress";
import type { Payload } from "@/lib/payload";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let siteId: string | null = null;
  try {
    const body = await req.json();
    siteId = body?.siteId ?? null;
  } catch {}

  const query = supabase.from("sites").select("*").eq("user_id", user.id);
  const { data: site } = siteId
    ? await query.eq("id", siteId).maybeSingle()
    : await query.order("created_at", { ascending: false }).limit(1).maybeSingle();

  if (!site) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const payload: Payload = {
    page: { title: site.name, slug: "hem", is_front_page: true, template: "landing" },
    brand: site.brand,
    seo: site.seo,
    sections: site.sections,
  };

  const wpUrl = site.wp_url ?? process.env.AIWEBB_WP_BASE_URL;
  const apiKey = site.wp_api_key ?? process.env.AIWEBB_WP_API_KEY;

  if (!wpUrl || !apiKey) return NextResponse.json({ error: "no_wp_config" }, { status: 400 });

  await publishToWordPress(payload, { baseUrl: wpUrl, apiKey });

  return NextResponse.json({ success: true });
}
