"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/brand/logo";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);

  const passwordTooShort = password.length > 0 && password.length < 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(signUpError.message);
      return;
    }

    // Save the phone number to the profile (the trigger creates the row).
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName.trim(), phone: phone.trim() || null })
        .eq("id", data.user.id);
    }

    setLoading(false);

    // If email confirmation is enabled in Supabase, there is no session yet.
    if (!data.session) {
      setNeedsVerification(true);
      return;
    }

    router.push("/account");
    router.refresh();
  }

  if (needsVerification) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col px-4 py-14 sm:px-6">
        <div className="flex justify-center">
          <Link href="/" aria-label="DailyNest home">
            <Wordmark />
          </Link>
        </div>
        <div className="card animate-fade-up mt-8 p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-fresh/15 text-forest">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
            </svg>
          </span>
          <h1 className="mt-5 text-xl font-extrabold text-charcoal">Verify your email</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            We sent a confirmation link to{" "}
            <span className="font-semibold text-charcoal">{email}</span>. Click it
            to activate your account, then sign in.
          </p>
          <Link href="/login" className="btn-primary mt-6 w-full !py-3.5">
            Go to sign in
          </Link>
        </div>
      </div>
    );
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
            Create your account
          </h1>
          <p className="mt-2 text-center text-sm text-muted">
            Save your details and track every order.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Full name
              </span>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="field"
                placeholder="Priya Sharma"
                autoComplete="name"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Phone number
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="field"
                placeholder="+91 98765 43210"
                autoComplete="tel"
              />
            </label>

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
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                  minLength={8}
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
              {passwordTooShort && (
                <p className="mt-1.5 text-xs font-medium text-danger">
                  Password must be at least 8 characters.
                </p>
              )}
            </label>

            {error && (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full !py-3.5">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-forest hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          By creating an account you agree to be contacted about your orders.
        </p>
      </div>
    </div>
  );
}
