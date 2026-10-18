"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ProfileForm({
  email,
  fullName,
  phone,
}: {
  email: string;
  fullName: string;
  phone: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(fullName);
  const [tel, setTel] = useState(phone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("Your session expired. Please sign in again.");
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: name.trim() || null,
        phone: tel.trim() || null,
      })
      .eq("id", user.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwSaved(false);

    if (newPassword.length < 8) {
      setPwError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match.");
      return;
    }

    setPwSaving(true);
    const supabase = createClient();
    const { error: pwErrorResult } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setPwSaving(false);

    if (pwErrorResult) {
      setPwError(pwErrorResult.message);
      return;
    }

    setPwSaved(true);
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={saveProfile} className="card p-6">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
            Email address
          </span>
          <input type="email" value={email} disabled className="field opacity-70" />
          <p className="mt-1.5 text-xs text-muted">
            Email cannot be changed here. Contact support if it is incorrect.
          </p>
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
            Full name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="field"
            placeholder="Priya Sharma"
            autoComplete="name"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
            Phone number
          </span>
          <input
            type="tel"
            value={tel}
            onChange={(e) => setTel(e.target.value)}
            className="field"
            placeholder="+91 98765 43210"
            autoComplete="tel"
          />
        </label>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {saved && (
          <div role="status" className="mt-4 rounded-xl border border-fresh/30 bg-fresh/10 p-3.5 text-sm font-medium text-forest">
            Profile updated.
          </div>
        )}

        <button type="submit" disabled={saving} className="btn-primary mt-5">
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      <form onSubmit={changePassword} className="card p-6">
        <h3 className="font-bold text-charcoal">Change password</h3>
        <p className="mt-1 text-sm text-muted">
          Use at least 8 characters. You will stay signed in on this device.
        </p>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
            New password
          </span>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="field"
            autoComplete="new-password"
            minLength={8}
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
            Confirm new password
          </span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="field"
            autoComplete="new-password"
            minLength={8}
          />
        </label>

        {pwError && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
            {pwError}
          </div>
        )}
        {pwSaved && (
          <div role="status" className="mt-4 rounded-xl border border-fresh/30 bg-fresh/10 p-3.5 text-sm font-medium text-forest">
            Password updated.
          </div>
        )}

        <button type="submit" disabled={pwSaving} className="btn-primary mt-5">
          {pwSaving ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
