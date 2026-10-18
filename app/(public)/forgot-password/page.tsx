"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/brand/logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${window.location.origin}/reset-password` }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-14 sm:px-6">
      <div className="flex justify-center">
        <Link href="/" aria-label="DailyNest home">
          <Wordmark />
        </Link>
      </div>

      <div className="card animate-fade-up mt-8 p-8">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fresh/15 text-forest">
              <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
              </svg>
            </span>
            <h1 className="mt-5 text-xl font-extrabold text-charcoal">Check your email</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              If an account exists for{" "}
              <span className="font-semibold text-charcoal">{email}</span>, we sent
              a password reset link. It expires shortly for your security.
            </p>
            <Link href="/login" className="btn-primary mt-6 w-full !py-3.5">
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-center text-2xl font-extrabold tracking-tight text-charcoal">
              Reset your password
            </h1>
            <p className="mt-2 text-center text-sm text-muted">
              Enter your email and we will send you a secure reset link.
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

              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm">
              Remembered it?{" "}
              <Link href="/login" className="font-semibold text-forest hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
