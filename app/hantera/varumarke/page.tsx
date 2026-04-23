import { createClient } from "@/lib/supabase-server";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateBrand } from "./actions";

export const metadata = { title: "Varumärke" };

export default async function VarumarkePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: site } = await supabase
    .from("sites")
    .select("brand")
    .eq("user_id", user!.id)
    .maybeSingle();

  const brand = site?.brand ?? {};

  return (
    <>
      <Topbar pageKicker="Inställningar" pageTitle="Varumärke" />

      <div className="p-6 max-w-2xl space-y-6">
        <form action={updateBrand}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Identitet</CardTitle>
              <CardDescription>
                Grundläggande om ditt varumärke. Används på hela sajten.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Företagsnamn</Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={brand.name ?? ""}
                  placeholder="Tennisgrus.se"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="primary_color">Primär färg</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="primary_color"
                    name="primary_color"
                    type="color"
                    defaultValue={brand.primary_color ?? "#0F1012"}
                    className="w-16 h-9 p-1 cursor-pointer"
                  />
                  <Input
                    type="text"
                    defaultValue={brand.primary_color ?? "#0F1012"}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    className="w-28 font-mono text-xs"
                    readOnly
                  />
                  <span className="text-xs text-muted-foreground">
                    Används för knappar, länkar och accenter
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tonalitet</Label>
                <select
                  id="tone"
                  name="tone"
                  defaultValue={brand.tone ?? "professional"}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                >
                  <option value="professional">Proffsig & saklig</option>
                  <option value="warm">Personlig & varm</option>
                  <option value="direct">Modern & direkt</option>
                  <option value="playful">Lekfull & avslappnad</option>
                </select>
                <p className="text-xs text-muted-foreground">
                  Påverkar hur AI skriver om innehållet åt dig.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-4">
            <Button type="submit" size="sm">
              Spara ändringar
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
