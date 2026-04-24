import { createClient } from "@/lib/supabase-server";
import { Topbar } from "@/components/layout/topbar";
import { PublishButton } from "@/components/layout/publish-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { updateContact } from "./actions";

export const metadata = { title: "Kontakt" };

export default async function KontaktPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: site } = await supabase.from("sites").select("contact, wp_url").eq("user_id", user!.id).maybeSingle();
  const contact = (site?.contact ?? {}) as Record<string, string>;

  return (
    <>
      <Topbar
        pageKicker="Inställningar"
        pageTitle="Kontaktuppgifter"
        previewUrl={site?.wp_url ?? undefined}
        publishButton={<PublishButton />}
      />
      <div className="p-6 max-w-2xl">
        <form action={updateContact}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Företagsuppgifter</CardTitle>
              <CardDescription>Visas i sidfot, kontaktformulär och Google-sökresultat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input id="phone" name="phone" type="tel" defaultValue={contact.phone ?? ""} placeholder="08-123 45 67" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-post</Label>
                <Input id="email" name="email" type="email" defaultValue={contact.email ?? ""} placeholder="info@foretaget.se" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adress</Label>
                <Textarea id="address" name="address" defaultValue={contact.address ?? ""} placeholder="Gatan 1, 111 22 Stockholm" rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hours">Öppettider</Label>
                <Textarea id="hours" name="hours" defaultValue={contact.hours ?? ""} placeholder="Mån–fre 09:00–17:00" rows={2} />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end mt-4">
            <Button type="submit" size="sm">Spara ändringar</Button>
          </div>
        </form>
      </div>
    </>
  );
}
