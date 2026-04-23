import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { publishToWordPress } from "@/lib/wordpress";
import type { Payload } from "@/lib/payload";

/**
 * POST /api/publish
 *
 * Tar kundens aktuella payload från Supabase och skickar till deras
 * WordPress-subsite. Inga payload-data skickas från klienten —
 * vi läser från vår egen DB så kunden inte kan injicera godtyckliga
 * fält genom att manipulera request.
 */

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "unauthorized" }, { status: 401 });
  }

  const { data: site } = await supabase
    .from("sites")
    .select("id, name, wp_url, wp_api_key, brand, sections, seo, contact")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!site) {
    return NextResponse.json(
      { success: false, error: "no_site_configured" },
      { status: 404 }
    );
  }

  const payload: Payload = {
    page: {
      title: site.name ?? "Start",
      slug: "hem",
      is_front_page: true,
      template: "landing",
    },
    brand: site.brand ?? undefined,
    sections: site.sections ?? [],
    seo: site.seo ?? {
      meta_title: site.name ?? "Start",
      meta_description: "",
    },
    meta: {
      generated_at: new Date().toISOString(),
      model: "dashboard-manual-edit",
      prompt_version: "v1.0.0",
    },
  };

  const result = await publishToWordPress(payload, {
    baseUrl: site.wp_url ?? undefined,
    apiKey: site.wp_api_key ?? undefined,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }

  await supabase
    .from("sites")
    .update({ last_published_at: new Date().toISOString() })
    .eq("id", site.id);

  return NextResponse.json(result);
}
