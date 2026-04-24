import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function HanteraLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: site } = await supabase
    .from("sites")
    .select("name, wp_url, subdomain")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const siteName = site?.name ?? "Min sajt";
  const siteUrl = site?.wp_url ?? undefined;

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <Sidebar siteName={siteName} siteUrl={siteUrl} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
