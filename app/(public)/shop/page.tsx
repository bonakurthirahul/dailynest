import type { Metadata } from "next";
import { Suspense } from "react";
import { getCategories, getProducts } from "@/lib/data";
import { ShopClient } from "@/components/shop/shop-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop groceries",
  description:
    "Browse the full DailyNest catalogue — fresh produce, staples, dairy, snacks, and household essentials. Order online, collect in store.",
};

export default async function ShopPage() {
  // Fetch the full available catalogue once; the client component filters
  // instantly. Owner-managed products therefore appear without a rebuild.
  const [products, categories] = await Promise.all([
    getProducts({ limit: 500 }),
    getCategories(),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-fresh">Catalogue</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
          Shop groceries
        </h1>
        <p className="mt-3 max-w-2xl text-charcoal-soft">
          Everything in the store, in one place. Stock levels are updated live by
          the shop — order online and collect at the counter.
        </p>
      </header>

      <Suspense
        fallback={<div className="h-[24rem] animate-pulse rounded-2xl bg-line/50" />}
      >
        <ShopClient products={products} categories={categories} />
      </Suspense>
    </div>
  );
}
