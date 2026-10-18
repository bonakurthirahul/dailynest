import { createBrowserClient } from "@supabase/ssr";

// Browser (public) Supabase client.
// Only ever uses the public anon key — safe to ship to the browser because
// every privileged operation is gated by Row Level Security + server checks.

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Surface a clear, actionable error instead of failing silently.
    throw new Error(
      "Missing Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.example)."
    );
  }

  return createBrowserClient(url, anonKey);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
