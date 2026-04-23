import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase-klient för Server Components och Route Handlers.
 *
 * Varför cookies: Supabase sparar session-tokens som cookies. Next.js
 * Server Components kan inte läsa cookies via document.cookie (de körs
 * på server) — de läser via headers(). Det här är wrappern.
 *
 * Använd alltid createClient() ENV en gång per request, inte cache:a.
 */

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component kan inte sätta cookies — det är ok,
            // middleware tar hand om session-refresh
          }
        },
      },
    }
  );
}
