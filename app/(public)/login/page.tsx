"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/brand/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
      setError(
        signInError.message === "Invalid login credentials"
          ? "That email and password combination did not match. Please try again."
          : signInError.message
      );
      return;
    }

    // Confirm the account is not an owner trying to use the customer portal.
    // (Owners use the separate /store-control-7x9/login route.)
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user!.id)
      .maybeSingle();

    setLoading(false);

    if (profile?.role === "owner") {
      setNotice(
        "This account is the store owner account. Redirecting you to the owner login…"
      );
      setTimeout(() => {
        router.push("/store-control-7x9/login");
      }, 900);
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-14 sm:px-6">
      <div className="animate-fade-up">
        <div className="flex justify-center">
          <Link href="/" aria-label="DailyNest home">
            <Wordmark />
          </Link>
        </div>

        <div className="card mt-8 p-8">
          <h1 className="text-center text-2xl font-extrabold tracking-tight text-charcoal">
            Welcome back
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Sign in to track orders and check out faster.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Email address
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="field"
                placeholder="you@example.com"
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
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="field !pr-12"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted hover:text-forest"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </label>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
                {error}
              </div>
            )}
            {notice && (
              <div role="status" className="rounded-xl border border-fresh/30 bg-fresh/10 p-3.5 text-sm font-medium text-forest">
                {notice}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link href="/forgot-password" className="font-semibold text-forest hover:underline">
              Forgot password?
            </Link>
            <Link href="/register" className="font-semibold text-forest hover:underline">
              Create account
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Store pickup only · Pay at the counter by cash or UPI.
        </p>
      </div>
    </div>
  );
}
