import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export const metadata = { title: "Logga in" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-secondary/30">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-lg">a</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Välkommen tillbaka</h1>
          <p className="mt-1 text-sm text-muted-foreground">Logga in för att hantera din sajt</p>
        </div>

        <form action={login} className="space-y-4 bg-background rounded-lg border p-6">
          <div className="space-y-2">
            <Label htmlFor="email">E-post</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="din@epost.se" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lösenord</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <Button type="submit" className="w-full">Logga in</Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Ny här?{" "}
          <Link href="/signup" className="underline hover:text-foreground">Skapa konto gratis</Link>
        </p>
      </div>
    </div>
  );
}
