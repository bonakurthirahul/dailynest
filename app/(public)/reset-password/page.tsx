"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/brand/logo";

// Landing page for the emailed password-reset link. Supabase delivers a
// session in the URL hash; once the component mounts we exchange it and let
// the user set a new password.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Detect the recovery session once on mount.
  useEffect(() => {
    const supabase = createClient();
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also allow manual password update when a session already exists.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setLoading(false);
      setError(updateError.message);
      return;
    }

    setLoading(false);
    router.push("/login?reset=1");
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-14 sm:px-6">
      <div className="flex justify-center">
        <Link href="/" aria-label="DailyNest home">
          <Wordmark />
        </Link>
      </div>

      <div className="card animate-fade-up mt-8 p-8">
        <h1 className="text-center text-2xl font-extrabold tracking-tight text-charcoal">
          Set a new password
        </h1>
        <p className="mt-2 text-center text-sm text-muted">
          Choose a strong password you have not used before.
        </p>

        {!ready && (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm font-medium text-amber-700">
            Waiting for your secure reset link. If you opened this page directly,
            request a new link from the{" "}
            <Link href="/forgot-password" className="font-semibold underline">
              forgot password
            </Link>{" "}
            page.
          </p>
        )}

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
              New password
            </span>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field !pr-12"
                placeholder="At least 8 characters"
                autoComplete="new-password"
                minLength={8}
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

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
              Confirm password
            </span>
            <input
              type={show ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="field"
              placeholder="Repeat the password"
              autoComplete="new-password"
              required
            />
          </label>

          {error && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !ready} className="btn-primary w-full !py-3.5">
            {loading ? "Updating…" : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
