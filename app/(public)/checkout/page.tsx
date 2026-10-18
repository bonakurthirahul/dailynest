"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart, getClientRequestId, rotateClientRequestId } from "@/components/cart/cart-context";
import { createClient } from "@/lib/supabase/client";
import { effectivePriceInPaise, formatINR } from "@/lib/format";
import { PICKUP_ONLY_NOTICE } from "@/lib/constants";
import type { CreateOrderPayload } from "@/lib/types";

type ProfileLite = { full_name: string | null; phone: string | null };

export default function CheckoutPage() {
  const router = useRouter();
  const { lines, subtotalInPaise, ready, clearCart } = useCart();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the signed-in customer's saved profile where available.
  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (cancelled || !data.user) return;
      const { data: prof } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", data.user.id)
        .maybeSingle();
      if (cancelled || !prof) return;
      setProfile(prof as ProfileLite);
      if (prof.full_name) setName(prof.full_name);
      if (prof.phone) setPhone(prof.phone);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-16 sm:px-6">
        <div className="h-64 animate-pulse rounded-2xl bg-line/50" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-20 sm:px-6">
        <div className="card flex flex-col items-center gap-4 p-14 text-center">
          <span className="text-6xl" aria-hidden="true">🧺</span>
          <h1 className="text-2xl font-extrabold text-charcoal">Nothing to check out</h1>
          <p className="max-w-sm text-sm text-muted">
            Your cart is empty. Add a few essentials first.
          </p>
          <Link href="/shop" className="btn-primary mt-2">Browse groceries</Link>
        </div>
      </div>
    );
  }

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[0-9+\-\s()]{8,15}$/.test(trimmedPhone)) {
      setError("Please enter a valid contact phone number.");
      return;
    }

    setLoading(true);
    try {
      const payload: CreateOrderPayload = {
        items: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
        })),
        customerName: trimmedName,
        customerPhone: trimmedPhone,
        pickupNotes: notes.trim() || undefined,
        clientRequestId: getClientRequestId(),
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "We could not place your order. Please try again.");
        setLoading(false);
        return;
      }

      // Success — clear cart and rotate the idempotency key so the next
      // checkout is a brand-new order.
      clearCart();
      rotateClientRequestId();
      router.push(`/checkout/success?order=${encodeURIComponent(data.orderNumber)}`);
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-fresh">Step 2 of 2</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
          Checkout
        </h1>
        <p className="mt-2 text-charcoal-soft">
          Reserve your order for store pickup. Payment happens at the counter.
        </p>
      </header>

      <form onSubmit={placeOrder} className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          {/* Contact */}
          <section className="card p-6">
            <h2 className="text-lg font-extrabold text-charcoal">Your details</h2>
            <p className="mt-1 text-sm text-muted">
              We only use these to prepare and hand over your order.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                  Full name <span className="text-danger">*</span>
                </span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="field"
                  placeholder="Priya Sharma"
                  autoComplete="name"
                  required
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                  Phone number <span className="text-danger">*</span>
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="field"
                  placeholder="+91 98765 43210"
                  autoComplete="tel"
                  required
                />
              </label>
            </div>

            {!profile && (
              <p className="mt-4 text-xs text-muted">
                Tip:{" "}
                <Link href="/login" className="font-semibold text-forest hover:underline">
                  Sign in
                </Link>{" "}
                so we remember your details for next time.
              </p>
            )}
          </section>

          {/* Pickup notes */}
          <section className="card p-6">
            <h2 className="text-lg font-extrabold text-charcoal">Pickup notes</h2>
            <p className="mt-1 text-sm text-muted">
              Optional — tell us anything that helps us pack your order.
            </p>
            <label className="mt-4 block">
              <span className="sr-only">Pickup notes</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                className="field resize-y"
                placeholder="e.g. Please pack ripe bananas separately. I'll collect after 6 PM."
              />
            </label>
          </section>

          {/* Pickup info */}
          <section className="card border-fresh/30 bg-fresh/6 p-6">
            <h2 className="text-lg font-extrabold text-forest">Store pickup & payment</h2>
            <ul className="mt-3 space-y-2 text-sm text-charcoal-soft">
              <li className="flex gap-2.5">
                <span className="mt-0.5 text-fresh">✓</span>
                No home delivery — collect at the DailyNest counter.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 text-fresh">✓</span>
                No online payment — pay by cash or UPI when you collect.
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 text-fresh">✓</span>
                You will receive an order number to show at the counter.
              </li>
            </ul>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
            >
              {error}
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="card h-fit p-6 lg:sticky lg:top-[92px]">
          <h2 className="text-lg font-extrabold text-charcoal">Order summary</h2>

          <ul className="mt-4 max-h-64 space-y-2.5 overflow-y-auto pr-1 text-sm">
            {lines.map((line) => {
              const unit = effectivePriceInPaise(
                line.unitPriceInPaise,
                line.discountPriceInPaise
              );
              return (
                <li key={line.productId} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-charcoal-soft">
                    {line.quantity} × {line.name}
                  </span>
                  <span className="shrink-0 font-semibold text-charcoal">
                    {formatINR(unit * line.quantity)}
                  </span>
                </li>
              );
            })}
          </ul>

          <dl className="mt-4 space-y-2.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold text-charcoal">{formatINR(subtotalInPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-semibold text-charcoal">Free · pickup</dd>
            </div>
            <div className="mt-2 flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold text-charcoal">Pay at store</dt>
              <dd className="font-extrabold text-forest">{formatINR(subtotalInPaise)}</dd>
            </div>
          </dl>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary mt-5 w-full !py-3.5 !text-base"
          >
            {loading ? "Placing order…" : "Place order"}
          </button>

          <p className="mt-4 text-center text-xs leading-relaxed text-muted">
            {PICKUP_ONLY_NOTICE}
          </p>
        </aside>
      </form>
    </div>
  );
}
