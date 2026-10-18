"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OWNER_LOGIN_PATH } from "@/lib/auth/paths";

interface SetupResponse {
  ok: boolean;
  created?: boolean;
  message?: string;
  error?: string;
}

// Operator-facing panel that triggers the server-side owner bootstrap.
// It NEVER receives or handles a password — the credentials live only in the
// server environment variables.
export function SetupPanel({
  configured,
  ownerExists,
}: {
  configured: boolean;
  ownerExists: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SetupResponse | null>(null);

  async function runSetup() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/setup/owner", { method: "POST" });
      const data = (await res.json()) as SetupResponse;
      setResult(data);

      if (data.ok) {
        setTimeout(() => router.push(OWNER_LOGIN_PATH), 1200);
      }
    } catch {
      setResult({ ok: false, error: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg animate-fade-up rounded-[1.25rem] bg-white p-8 shadow-lift">
      <div className="flex items-center gap-2.5">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-forest/10 text-forest">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 3 4 6.5v5c0 4.6 3.2 8.9 8 10 4.8-1.1 8-5.4 8-10v-5L12 3Z" />
          </svg>
        </span>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-charcoal">
            Initial owner setup
          </h1>
          <p className="text-xs text-muted">One-time, server-side provisioning</p>
        </div>
      </div>

      <div className="mt-6 space-y-4 text-sm leading-relaxed text-charcoal-soft">
        <p>
          This creates the single <strong>store owner</strong> account from the
          server-side environment variables{" "}
          <code className="rounded bg-ivory-dark px-1.5 py-0.5 text-xs">
            INITIAL_OWNER_EMAIL
          </code>{" "}
          and{" "}
          <code className="rounded bg-ivory-dark px-1.5 py-0.5 text-xs">
            INITIAL_OWNER_PASSWORD
          </code>
          . Those values never leave the server and are not shown here.
        </p>

        <ul className="space-y-2 rounded-xl border border-line bg-ivory p-4 text-xs">
          <li>• Idempotent — running it twice will not reset the owner password.</li>
          <li>• No owner password is stored in the repo or sent to the browser.</li>
          <li>• Change the password immediately after the first login.</li>
          <li>• Consider enabling multi-factor authentication in Supabase.</li>
        </ul>

        {!configured && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800">
            <strong>Not configured.</strong> Add{" "}
            <code>INITIAL_OWNER_EMAIL</code> and{" "}
            <code>INITIAL_OWNER_PASSWORD</code> to your server environment
            (for example <code>.env.local</code> locally, or your host&apos;s
            environment settings in production), then reload this page.
          </div>
        )}

        {ownerExists && (
          <div className="rounded-xl border border-fresh/30 bg-fresh/10 p-4 text-xs font-medium text-forest">
            An owner account already exists. Setup is locked to prevent
            unauthorised ownership claims.
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={runSetup}
          disabled={loading || !configured || ownerExists}
          className="btn-primary flex-1 !py-3"
        >
          {loading ? "Provisioning…" : "Create owner account"}
        </button>
        <a href={OWNER_LOGIN_PATH} className="btn-ghost !py-3">
          Owner login
        </a>
      </div>

      {result && (
        <div
          role="status"
          className={`mt-5 rounded-xl border p-4 text-sm font-medium ${
            result.ok
              ? "border-fresh/30 bg-fresh/10 text-forest"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {result.ok
            ? result.created
              ? "Owner account created. Redirecting to owner login…"
              : "Owner already provisioned. Redirecting to owner login…"
            : result.error ?? result.message ?? "Setup failed."}
        </div>
      )}

      <p className="mt-6 text-center text-xs text-muted">
        This page is not published in the public site, sitemap, or search.
      </p>
    </div>
  );
}
