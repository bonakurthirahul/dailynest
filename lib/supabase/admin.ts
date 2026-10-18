import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Server-only privileged client using the service-role key.
//
// SECURITY:
//  - Marked with `server-only` so it can never be imported into a Client
//    Component bundle (Next.js will fail the build if attempted).
//  - The service-role key bypasses RLS. It is used ONLY inside Route
//    Handlers that independently verify the caller's session + role before
//    performing any privileged write. Never call it without that check.
//  - This key must never be prefixed with NEXT_PUBLIC_.

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing server-only Supabase configuration. Set " +
        "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local " +
        "(see .env.example)."
    );
  }

  return createSupabaseClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
