"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useCart } from "@/components/cart/cart-context";
import {
  discountPercent,
  effectivePriceInPaise,
  formatINR,
} from "@/lib/format";
import { PICKUP_ONLY_NOTICE } from "@/lib/constants";

// Add-to-cart panel on the product detail page.
export function ProductPurchase({ product }: { product: Product }) {
  const { addLine, getLine, setQuantity } = useCart();
  const router = useRouter();

  const out = product.stock_quantity <= 0;
  const inCartLine = getLine(product.id);
  const existingQty = inCartLine?.quantity ?? 0;

  const maxQty = Math.max(product.stock_quantity, 1);
  const [qty, setQty] = useState(1);

  const unitPrice = effectivePriceInPaise(
    product.price_in_paise,
    product.discount_price_in_paise
  );
  const off = discountPercent(
    product.price_in_paise,
    product.discount_price_in_paise
  );

  function handleAdd() {
    addLine(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        unitLabel: product.unit_label,
        imageUrl: product.image_url,
        unitPriceInPaise: product.price_in_paise,
        discountPriceInPaise: product.discount_price_in_paise,
        stockQuantity: product.stock_quantity,
      },
      qty
    );
  }

  return (
    <div className="card p-6">
      {off != null && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-forest px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          {off}% off · Save {formatINR(product.price_in_paise - unitPrice)}
        </span>
      )}

      <div className="mt-4 flex items-end gap-3">
        <span className="text-4xl font-extrabold tracking-tight text-forest">
          {formatINR(unitPrice)}
        </span>
        {off != null && (
          <span className="pb-1.5 text-base text-muted line-through">
            {formatINR(product.price_in_paise)}
          </span>
        )}
      </div>

      {product.unit_label && (
        <p className="mt-1.5 text-sm text-muted">
          Per {product.unit_label}
        </p>
      )}

      {/* Stock */}
      <div className="mt-5">
        {out ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700">
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Currently out of stock
          </p>
        ) : product.stock_quantity <= (product.low_stock_threshold || 10) ? (
          <p className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse-dot" />
            Only {product.stock_quantity} left
          </p>
        ) : (
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            In stock
          </p>
        )}
      </div>

      {/* Quantity + add */}
      {!out && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center rounded-full border border-line bg-white">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
              className="flex h-11 w-11 items-center justify-center rounded-l-full text-lg font-bold text-charcoal-soft transition-colors hover:bg-ivory disabled:opacity-40"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-bold tabular-nums text-charcoal" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              aria-label="Increase quantity"
              className="flex h-11 w-11 items-center justify-center rounded-r-full text-lg font-bold text-charcoal-soft transition-colors hover:bg-ivory disabled:opacity-40"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="btn-primary flex-1 !py-3.5 !text-base"
          >
            Add to cart · {formatINR(unitPrice * qty)}
          </button>
        </div>
      )}

      {existingQty > 0 && (
        <p className="mt-3 text-sm text-muted">
          {existingQty} already in your cart.{" "}
          <button
            type="button"
            onClick={() => setQuantity(product.id, existingQty + qty)}
            className="font-semibold text-forest hover:underline"
          >
            Add {qty} more
          </button>
        </p>
      )}

      <button
        type="button"
        onClick={() => router.push("/cart")}
        className="btn-ghost mt-3 w-full !py-3"
      >
        Go to cart
      </button>

      <p className="mt-5 rounded-xl border border-fresh/30 bg-fresh/8 p-3.5 text-xs leading-relaxed text-forest">
        {PICKUP_ONLY_NOTICE}
      </p>
    </div>
  );
}
