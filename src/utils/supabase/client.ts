// ====================================================================
// AVIORA — Supabase Browser Client
// For use in Client Components (useEffect, event handlers, etc.).
// ====================================================================

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
