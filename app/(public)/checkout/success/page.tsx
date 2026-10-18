import type { Metadata } from "next";
import { Suspense } from "react";
import { SuccessPanel } from "@/components/checkout/success-panel";

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false },
};

export default function CheckoutSuccessPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
      <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-line/50" />}>
        <SuccessPanel />
      </Suspense>
    </div>
  );
}
