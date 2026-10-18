import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrderClient } from "@/components/order/track-order-client";

export const metadata: Metadata = {
  title: "Track an order",
  description: "Check the live status of a DailyNest order using its order number.",
};

export default function TrackOrderPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-14 sm:px-6">
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-fresh">Order tracking</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
          Track your order
        </h1>
        <p className="mx-auto mt-3 max-w-md text-charcoal-soft">
          Enter the order number from your confirmation to see live status. No
          sign-in required for your own order number.
        </p>
      </header>

      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-line/50" />}>
        <TrackOrderClient />
      </Suspense>
    </div>
  );
}
