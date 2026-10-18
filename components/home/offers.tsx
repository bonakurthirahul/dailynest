import Link from "next/link";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";

// "Genuine offers" strip — renders only real products that actually carry a
// discount price in the database. If there are none, the section is omitted
// rather than showing fabricated deals.
export function HomeOffers({ offers }: { offers: Product[] }) {
  if (offers.length === 0) return null;

  return (
    <section className="bg-gradient-to-br from-forest to-forest-dark">
      <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-fresh-light">
              Save on your basket
            </p>
            <h2 className="mt-1.5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Current offers & discounts
            </h2>
          </div>
          <Link
            href="/shop?offers=1"
            className="rounded-full border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            See all offers →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {offers.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
