import { signup } from "../login/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export const metadata = { title: "Kom igång" };

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-secondary/30">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-lg">a</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Skapa ditt konto</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bygg din hemsida med AI på under 2 minuter
          </p>
        </div>

        <form action={signup} className="space-y-4 bg-background rounded-lg border p-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="full_name">Förnamn</Label>
              <Input id="full_name" name="full_name" required placeholder="Peter" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Efternamn</Label>
              <Input id="last_name" name="last_name" placeholder="Persson" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company_name">Företagsnamn</Label>
            <Input id="company_name" name="company_name" required placeholder="Mitt Företag AB" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="din@epost.se" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required placeholder="Minst 8 tecken" />
          </div>

          <Button type="submit" className="w-full">
            Skapa konto och bygg min sajt →
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Har du redan konto?{" "}
          <Link href="/login" className="underline hover:text-foreground">Logga in</Link>
        </p>
      </div>
    </div>
  );
}
