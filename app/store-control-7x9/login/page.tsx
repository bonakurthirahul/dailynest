"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/brand/logo";
import { OWNER_DASHBOARD_PATH, OWNER_OUT_OF_CREDITS_PATH } from "@/lib/auth/paths";
import { hasSufficientOwnerCredits } from "@/lib/auth/credits";

// Owner login. Reachable only by typing the private URL — never linked from
// the public site. This is obscurity; real security is the server-side role
// check in requireOwner() + RLS in the database.
export default function OwnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Invalid owner credentials. Please try again.");
      return;
    }

    // Verify this account genuinely holds the owner role. A normal customer
    // must never reach the dashboard.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, credits")
      .eq("id", data.user!.id)
      .maybeSingle();

    if (profile?.role !== "owner") {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This account is not authorised as a store owner.");
      return;
    }

    // Credits gate: a valid owner without a sufficient balance cannot use
    // the dashboard — send them to the notice page instead.
    if (!hasSufficientOwnerCredits(profile?.credits)) {
      setLoading(false);
      router.push(OWNER_OUT_OF_CREDITS_PATH);
      router.refresh();
      return;
    }

    setLoading(false);
    router.push(OWNER_DASHBOARD_PATH);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-charcoal px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="flex justify-center">
          <Link href="/" aria-label="DailyNest home">
            <Wordmark tone="light" />
          </Link>
        </div>

        <div className="mt-8 rounded-[1.25rem] bg-white p-8 shadow-lift">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-forest/10 text-forest">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3 4 6.5v5c0 4.6 3.2 8.9 8 10 4.8-1.1 8-5.4 8-10v-5L12 3Z" />
              </svg>
            </span>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-charcoal">
                Store control
              </h1>
              <p className="text-xs text-muted">Authorised owner access only</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Owner email
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                placeholder="owner@store.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Password
              </span>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field !pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted hover:text-forest"
                >
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
              {loading ? "Verifying…" : "Sign in to dashboard"}
            </button>
          </form>

          <Link
            href="/forgot-password"
            className="mt-5 block text-center text-sm font-semibold text-forest hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-white/50">
          This page is not published in the public site, sitemap, or search.
        </p>
      </div>
    </div>
  );
}
