import { createClient } from "@/lib/supabase-server";
import { Topbar } from "@/components/layout/topbar";
import { SectionList } from "@/components/sektioner/section-list";
import { PublishButton } from "@/components/layout/publish-button";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import type { Section } from "@/lib/payload";

export default async function HanteraPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: site } = await supabase
    .from("sites")
    .select("id, name, wp_url, sections")
    .eq("user_id", user!.id)
    .maybeSingle();

  const sections = (site?.sections ?? []) as Section[];
  const previewUrl = site?.wp_url ?? undefined;

  return (
    <>
      <Topbar
        pageKicker="Redigerar"
        pageTitle="Startsida"
        previewUrl={previewUrl}
        publishButton={<PublishButton />}
      />
      <div className="p-6 max-w-3xl">
        {sections.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <h2 className="text-sm font-medium mb-1">Din sida är tom</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Låt AI bygga din sajt på under 2 minuter.
            </p>
            <Button size="sm" asChild>
              <Link href="/onboarding">Starta onboarding</Link>
            </Button>
          </div>
        ) : (
          <>
            <SectionList sections={sections} />
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-3.5 w-3.5" />
              Lägg till sektion
            </Button>
          </>
        )}
      </div>
    </>
  );
}
