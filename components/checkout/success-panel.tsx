"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PICKUP_ONLY_NOTICE } from "@/lib/constants";

export function SuccessPanel() {
  const params = useSearchParams();
  const orderNumber = params.get("order");

  return (
    <div className="card animate-fade-up p-10 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-fresh/15 text-forest">
        <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>

      <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-charcoal sm:text-3xl">
        Order received
      </h1>

      {orderNumber ? (
        <p className="mt-3 text-charcoal-soft">
          Your order number is
        </p>
      ) : (
        <p className="mt-3 text-charcoal-soft">
          Your order has been placed successfully.
        </p>
      )}

      {orderNumber && (
        <p className="mt-2 inline-block rounded-xl border border-line bg-ivory px-6 py-3 font-heading text-2xl font-extrabold tracking-widest text-forest">
          {orderNumber}
        </p>
      )}

      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-muted">
        {PICKUP_ONLY_NOTICE} We will notify you as soon as the store accepts and
        starts preparing your order.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/account/orders" className="btn-primary">
          View my orders
        </Link>
        <Link href="/shop" className="btn-ghost">
          Continue shopping
        </Link>
      </div>

      {orderNumber && (
        <p className="mt-6 text-xs text-muted">
          Tip: keep this number handy for the counter.{" "}
          <Link href={`/track-order/${encodeURIComponent(orderNumber)}`} className="font-semibold text-forest hover:underline">
            Track this order
          </Link>
        </p>
      )}
    </div>
  );
}
