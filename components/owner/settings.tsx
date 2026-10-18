"use client";

import { useEffect, useState } from "react";
import type { StoreSetting } from "@/lib/types";

export function OwnerSettings() {
  const [settings, setSettings] = useState<StoreSetting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/owner/settings");
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as { settings: StoreSetting | null };
        if (!cancelled) setSettings(json.settings);
      } catch {
        if (!cancelled) setError("Could not load store settings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!settings) return;

    setError(null);
    setNotice(null);
    setSaving(true);

    try {
      const res = await fetch("/api/owner/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: settings.store_name,
          tagline: settings.tagline,
          address: settings.address,
          contactPhone: settings.contact_phone,
          contactEmail: settings.contact_email,
          openingHours: settings.opening_hours,
          pickupInstructions: settings.pickup_instructions,
          isOpen: settings.is_open,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Could not save settings.");
      } else {
        setSettings(json.settings as StoreSetting);
        setNotice("Settings saved.");
      }
    } catch {
      setError("Network error saving settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-line/60" />
        <div className="card h-96 animate-pulse rounded-2xl bg-line/60" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="card p-8 text-center text-sm font-medium text-red-700">
        {error ?? "Store settings not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-charcoal">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          Store details shown to customers and used for pickup orders.
        </p>
      </div>

      {notice && (
        <div role="status" className="rounded-xl border border-fresh/30 bg-fresh/10 p-4 text-sm font-medium text-forest">
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={save} className="card space-y-5 p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
              Store name
            </span>
            <input
              type="text"
              value={settings.store_name}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, store_name: e.target.value } : s))
              }
              className="field"
              required
              minLength={2}
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">Tagline</span>
            <input
              type="text"
              value={settings.tagline ?? ""}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, tagline: e.target.value } : s))
              }
              className="field"
              placeholder="Your Daily Needs, All in One Place."
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">Address</span>
            <textarea
              value={settings.address ?? ""}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, address: e.target.value } : s))
              }
              rows={2}
              className="field resize-y"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
              Contact phone
            </span>
            <input
              type="tel"
              value={settings.contact_phone}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, contact_phone: e.target.value } : s))
              }
              className="field"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
              Contact email (optional)
            </span>
            <input
              type="email"
              value={settings.contact_email ?? ""}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, contact_email: e.target.value } : s))
              }
              className="field"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
              Opening hours
            </span>
            <input
              type="text"
              value={settings.opening_hours ?? ""}
              onChange={(e) =>
                setSettings((s) => (s ? { ...s, opening_hours: e.target.value } : s))
              }
              className="field"
              placeholder="Mon–Sat 7:00 AM – 9:00 PM, Sun 8:00 AM – 2:00 PM"
            />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
              Pickup instructions
            </span>
            <textarea
              value={settings.pickup_instructions ?? ""}
              onChange={(e) =>
                setSettings((s) =>
                  s ? { ...s, pickup_instructions: e.target.value } : s
                )
              }
              rows={3}
              className="field resize-y"
              placeholder="e.g. Show your order number at the counter. Bring your own bag if possible."
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal-soft">
          <input
            type="checkbox"
            checked={settings.is_open}
            onChange={(e) =>
              setSettings((s) => (s ? { ...s, is_open: e.target.checked } : s))
            }
            className="h-4 w-4 accent-[#245C43]"
          />
          Store is open for orders
        </label>

        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
    </div>
  );
}
