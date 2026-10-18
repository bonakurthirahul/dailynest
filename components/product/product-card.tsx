"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { discountPercent, effectivePriceInPaise, formatINR } from "@/lib/format";
import { useCart } from "@/components/cart/cart-context";

// Product card used across the homepage, shop, and category grids.
export function ProductCard({ product }: { product: Product }) {
  const { addLine, getLine } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const inCart = Boolean(getLine(product.id));
  const unitPrice = effectivePriceInPaise(
    product.price_in_paise,
    product.discount_price_in_paise
  );
  const off = discountPercent(
    product.price_in_paise,
    product.discount_price_in_paise
  );
  const out = product.stock_quantity <= 0;

  function handleAdd() {
    addLine({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      unitLabel: product.unit_label,
      imageUrl: product.image_url,
      unitPriceInPaise: product.price_in_paise,
      discountPriceInPaise: product.discount_price_in_paise,
      stockQuantity: product.stock_quantity,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  }

  return (
    <article className="group card flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lift">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-ivory-dark"
      >
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 22vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-5xl" aria-hidden="true">
              🥬
            </span>
          </div>
        )}

        {off != null && (
          <span className="absolute left-3 top-3 rounded-full bg-forest px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-wide text-white shadow-sm">
            {off}% off
          </span>
        )}
        {out && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70">
            <span className="rounded-full border border-line bg-white px-4 py-1.5 text-sm font-semibold text-muted">
              Out of stock
            </span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.category && (
          <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-fresh">
            {product.category.name}
          </p>
        )}

        <h3 className="mt-1 line-clamp-2 text-[0.98rem] font-bold leading-snug text-charcoal">
          <Link href={`/product/${product.slug}`} className="hover:text-forest">
            {product.name}
          </Link>
        </h3>

        {product.unit_label && (
          <p className="mt-0.5 text-xs text-muted">{product.unit_label}</p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col">
            {off != null && (
              <span className="text-xs text-muted line-through">
                {formatINR(product.price_in_paise)}
              </span>
            )}
            <span className="text-lg font-extrabold text-forest">
              {formatINR(unitPrice)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            disabled={out}
            aria-label={`Add ${product.name} to cart`}
            className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-semibold transition-all duration-200 ${
              out
                ? "cursor-not-allowed bg-line text-muted"
                : justAdded
                  ? "bg-fresh text-white"
                  : inCart
                    ? "border border-forest bg-fresh/15 text-forest"
                    : "bg-forest text-white hover:bg-forest-dark"
            }`}
          >
            {out ? (
              "Sold out"
            ) : justAdded ? (
              <>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z"
                    clipRule="evenodd"
                  />
                </svg>
                Added
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M10 4v12M4 10h12" />
                </svg>
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
