import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCategories } from "@/lib/data";
import { CATEGORY_IMAGES, CATEGORY_FALLBACK_IMAGE } from "@/lib/images";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Explore every DailyNest grocery category — from fresh fruit and vegetables to cooking oils, spices, and household essentials.",
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-fresh">Browse</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
          Grocery categories
        </h1>
        <p className="mt-3 text-charcoal-soft">
          Ten carefully stocked aisles covering your everyday needs. Tap a
          category to see everything in stock right now.
        </p>
      </header>

      {categories.length === 0 ? (
        <div className="card p-14 text-center">
          <p className="text-lg font-bold text-charcoal">No categories yet</p>
          <p className="mt-2 text-sm text-muted">
            The store owner can add categories from the owner dashboard.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-[1.5rem] border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={CATEGORY_IMAGES[cat.slug] ?? CATEGORY_FALLBACK_IMAGE}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/15 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h2 className="text-lg font-bold text-white drop-shadow-sm">{cat.name}</h2>
                {cat.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-white/85">{cat.description}</p>
                )}
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-fresh-light">
                  Browse products
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 10h12M11 5l5 5-5 5" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
