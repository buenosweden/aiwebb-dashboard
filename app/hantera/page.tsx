import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import Link from "next/link";

export default async function HanteraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!site || !site.sections || site.sections.length === 0) {
    return (
      <div className="p-8">
        <div className="text-sm text-muted-foreground mb-2">REDIGERAR</div>
        <h1 className="text-xl font-medium mb-8">Startsida</h1>
        <div className="border border-dashed rounded-lg p-12 text-center max-w-lg mx-auto">
          <p className="text-sm font-medium mb-1">Din sida är tom</p>
          <p className="text-sm text-muted-foreground mb-6">Låt AI bygga din sajt på under 2 minuter.</p>
          <Link href="/onboarding" className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium">
            Starta onboarding
          </Link>
        </div>
      </div>
    );
  }

  const sectionCount = site.sections.length;
  const brand = site.brand ?? {};
  const seo = site.seo ?? {};

  return (
    <div className="p-8 max-w-3xl">
      <div className="text-sm text-muted-foreground mb-2">REDIGERAR</div>
      <h1 className="text-xl font-medium mb-6">Startsida</h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-secondary rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Sektioner</div>
          <div className="text-2xl font-medium">{sectionCount}</div>
        </div>
        <div className="bg-secondary rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Primärfärg</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="h-5 w-5 rounded-full border" style={{ backgroundColor: brand.primary_color ?? "#000" }} />
            <span className="text-sm font-mono">{brand.primary_color ?? "–"}</span>
          </div>
        </div>
        <div className="bg-secondary rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Subdomän</div>
          <div className="text-sm truncate font-medium">{site.subdomain ?? "–"}</div>
        </div>
      </div>

      {seo.meta_title && (
        <div className="border rounded-lg p-4 mb-6">
          <div className="text-xs text-muted-foreground mb-2">SEO</div>
          <div className="text-sm font-medium mb-1">{seo.meta_title}</div>
          <div className="text-xs text-muted-foreground">{seo.meta_description}</div>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs text-muted-foreground mb-3">SEKTIONER</div>
        {site.sections.map((section: { type: string }, i: number) => (
          <div key={i} className="flex items-center gap-3 border rounded-lg px-4 py-3 bg-background">
            <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}</span>
            <span className="text-sm font-medium capitalize">{section.type.replace("_", " ")}</span>
          </div>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <Link href="/onboarding" className="text-sm text-muted-foreground hover:text-foreground border rounded-md px-4 py-2">
          Bygg om med AI
        </Link>
        {site.wp_url && (
          <a href={site.wp_url} target="_blank" rel="noopener noreferrer" className="text-sm border rounded-md px-4 py-2 hover:bg-secondary">
            Visa sajt →
          </a>
        )}
      </div>
    </div>
  );
}
