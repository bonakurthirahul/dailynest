"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/cart-context";
import { effectivePriceInPaise, formatINR } from "@/lib/format";
import { PICKUP_ONLY_NOTICE } from "@/lib/constants";

export default function CartPage() {
  const { lines, itemCount, subtotalInPaise, ready, setQuantity, removeLine } =
    useCart();

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
          <span className="text-6xl" aria-hidden="true">🛒</span>
          <h1 className="text-2xl font-extrabold text-charcoal">Your cart is empty</h1>
          <p className="max-w-sm text-sm text-muted">
            Add some fresh essentials and they will show up here, ready to
            reserve for store pickup.
          </p>
          <Link href="/shop" className="btn-primary mt-2">
            Browse groceries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-fresh">Step 1 of 2</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
          Your cart
        </h1>
        <p className="mt-2 text-charcoal-soft">
          {itemCount} {itemCount === 1 ? "item" : "items"} reserved for store
          pickup.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        {/* Lines */}
        <ul className="space-y-3">
          {lines.map((line) => {
            const unit = effectivePriceInPaise(
              line.unitPriceInPaise,
              line.discountPriceInPaise
            );
            return (
              <li key={line.productId} className="card flex gap-4 p-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ivory-dark">
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt={line.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl" aria-hidden="true">
                      🥬
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/product/${line.slug}`}
                        className="line-clamp-1 font-bold text-charcoal hover:text-forest"
                      >
                        {line.name}
                      </Link>
                      {line.unitLabel && (
                        <p className="mt-0.5 text-xs text-muted">Per {line.unitLabel}</p>
                      )}
                    </div>
                    <p className="shrink-0 font-extrabold text-forest">
                      {formatINR(unit * line.quantity)}
                    </p>
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-3">
                    <div className="inline-flex items-center rounded-full border border-line">
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity - 1)}
                        aria-label={`Decrease ${line.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-l-full font-bold text-charcoal-soft hover:bg-ivory"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-bold tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(line.productId, line.quantity + 1)}
                        disabled={line.quantity >= line.stockQuantity}
                        aria-label={`Increase ${line.name}`}
                        className="flex h-9 w-9 items-center justify-center rounded-r-full font-bold text-charcoal-soft hover:bg-ivory disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeLine(line.productId)}
                      className="text-sm font-semibold text-muted transition-colors hover:text-danger"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Summary */}
        <aside className="card h-fit p-6 lg:sticky lg:top-[92px]">
          <h2 className="text-lg font-extrabold text-charcoal">Order summary</h2>

          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-semibold text-charcoal">{formatINR(subtotalInPaise)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-semibold text-charcoal">Store pickup · Free</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Payment</dt>
              <dd className="font-semibold text-charcoal">At counter</dd>
            </div>
            <div className="mt-3 flex justify-between border-t border-line pt-3 text-base">
              <dt className="font-bold text-charcoal">Total</dt>
              <dd className="font-extrabold text-forest">{formatINR(subtotalInPaise)}</dd>
            </div>
          </dl>

          <Link href="/checkout" className="btn-primary mt-5 w-full !py-3.5 !text-base">
            Proceed to checkout
          </Link>

          <Link
            href="/shop"
            className="mt-3 block text-center text-sm font-semibold text-forest hover:underline"
          >
            Continue shopping
          </Link>

          <p className="mt-5 rounded-xl border border-fresh/30 bg-fresh/8 p-3.5 text-xs leading-relaxed text-forest">
            {PICKUP_ONLY_NOTICE}
          </p>
        </aside>
      </div>
    </div>
  );
}
