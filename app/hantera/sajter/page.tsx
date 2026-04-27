import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { DeleteSiteButton } from "@/components/delete-site-button";
import Link from "next/link";

export const metadata = { title: "Mina sajter" };

export default async function SitesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, subdomain, wp_url, created_at, brand")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-sm text-muted-foreground mb-1">HANTERA</div>
          <h1 className="text-xl font-medium">Mina sajter</h1>
        </div>
        <Link href="/onboarding" className="inline-flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md">
          + Ny hemsida
        </Link>
      </div>

      {!sites || sites.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center">
          <p className="text-sm text-muted-foreground mb-4">Du har inga sajter ännu.</p>
          <Link href="/onboarding" className="text-sm underline">Skapa din första sajt</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sites.map(site => {
            const color = site.brand?.primary_color ?? "#0F1012";
            return (
              <div key={site.id} className="flex items-center gap-4 border rounded-lg px-5 py-4 bg-background">
                <div className="h-8 w-8 rounded-md flex-shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{site.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{site.subdomain}.aiwebb.se</div>
                </div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                  {new Date(site.created_at).toLocaleDateString("sv-SE")}
                </div>
                <div className="flex items-center gap-2">
                  {site.wp_url && (
                    <a
                      href={site.wp_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs px-3 py-1.5 border rounded-md hover:bg-secondary transition-colors"
                    >
                      Visa →
                    </a>
                  )}
                  <DeleteSiteButton siteId={site.id} siteName={site.name} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
