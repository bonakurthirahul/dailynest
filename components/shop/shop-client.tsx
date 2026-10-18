"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/product/product-card";

// Client-side shop controller. The parent Server Component passes the full
// active catalogue; this filters/searches instantly without a round trip and
// keeps the URL in sync so results are shareable.
export function ShopClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialCategory = searchParams.get("category") ?? "";
  const initialSearch = searchParams.get("q") ?? "";
  const initialSort = searchParams.get("sort") ?? "relevance";
  const initialOffers = searchParams.get("offers") === "1";

  const [query, setQuery] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState(initialSort);
  const [offersOnly, setOffersOnly] = useState(initialOffers);
  const [debouncedQuery, setDebouncedQuery] = useState(initialSearch);
  const firstRender = useRef(true);

  // Debounce the search box so we don't thrash the URL.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const t = setTimeout(() => setDebouncedQuery(query), 220);
    return () => clearTimeout(t);
  }, [query]);

  // Keep the URL shareable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (sort !== "relevance") params.set("sort", sort);
    if (offersOnly) params.set("offers", "1");
    const qs = params.toString();
    router.replace(qs ? `/shop?${qs}` : "/shop", { scroll: false });
  }, [category, debouncedQuery, sort, offersOnly, router]);

  const filtered = useMemo(() => {
    const term = debouncedQuery.trim().toLowerCase();
    let list = products.filter((p) => {
      if (offersOnly && p.discount_price_in_paise == null) return false;
      if (!term) return true;
      const hay = `${p.name} ${p.description ?? ""} ${p.category?.name ?? ""}`.toLowerCase();
      return hay.includes(term);
    });

    switch (sort) {
      case "price_asc":
        list = [...list].sort((a, b) => effective(a) - effective(b));
        break;
      case "price_desc":
        list = [...list].sort((a, b) => effective(b) - effective(a));
        break;
      case "name":
        list = [...list].sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        break;
    }
    return list;
  }, [products, debouncedQuery, offersOnly, sort]);

  const activeCategoryName = useMemo(
    () => categories.find((c) => c.slug === category)?.name ?? null,
    [categories, category]
  );

  const resetFilters = useCallback(() => {
    setQuery("");
    setCategory("");
    setSort("relevance");
    setOffersOnly(false);
  }, []);

  return (
    <div>
      {/* Toolbar */}
      <div className="card sticky top-[72px] z-20 mb-8 p-4 backdrop-blur">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search products</span>
            <svg
              viewBox="0 0 24 24"
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.2-3.2" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search atta, dal, milk, soap…"
              className="field !pl-11"
              aria-label="Search products"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="cat-select">Category</label>
            <select
              id="cat-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field !w-auto min-w-[11rem]"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="sort-select">Sort by</label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="field !w-auto"
            >
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name">Name A–Z</option>
            </select>

            <button
              type="button"
              onClick={() => setOffersOnly((v) => !v)}
              aria-pressed={offersOnly}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                offersOnly
                  ? "border-forest bg-forest text-white"
                  : "border-line bg-white text-charcoal-soft hover:border-forest hover:text-forest"
              }`}
            >
              Offers only
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <p aria-live="polite">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
            {activeCategoryName && (
              <>
                {" "}
                in <span className="font-semibold text-forest">{activeCategoryName}</span>
              </>
            )}
            {debouncedQuery.trim() && (
              <>
                {" "}
                matching “<span className="font-semibold text-forest">{debouncedQuery.trim()}</span>”
              </>
            )}
          </p>
          {(category || debouncedQuery || offersOnly || sort !== "relevance") && (
            <button
              type="button"
              onClick={resetFilters}
              className="font-semibold text-forest hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-14 text-center">
          <span className="text-5xl" aria-hidden="true">🛒</span>
          <h2 className="text-lg font-bold text-charcoal">No products found</h2>
          <p className="max-w-sm text-sm text-muted">
            Try a different search term, or clear your filters to browse the
            full catalogue.
          </p>
          <button type="button" onClick={resetFilters} className="btn-primary mt-2">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function effective(p: Product): number {
  return p.discount_price_in_paise != null && p.discount_price_in_paise > 0
    ? p.discount_price_in_paise
    : p.price_in_paise;
}
