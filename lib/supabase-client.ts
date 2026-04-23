"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase-klient för Client Components (använder useState, useEffect osv).
 * Lever i browsern. Har bara tillgång till anon-nyckeln (publikt ok).
 */

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
