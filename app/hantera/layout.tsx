import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function HanteraLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const siteName = (user.user_metadata?.site_name as string) ?? "Min sajt";

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <Sidebar siteName={siteName} />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
