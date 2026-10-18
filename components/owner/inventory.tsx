"use client";

import { useCallback, useEffect, useState } from "react";
import type { Product } from "@/lib/types";

// Inline stock editor for quick inventory top-ups and corrections.
export function OwnerInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/owner/products");
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as { products: Product[] };
      setProducts(json.products);
      setError(null);
    } catch {
      setError("Could not load inventory.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch
    load();
  }, [load]);

  async function saveStock(product: Product) {
    const raw = edits[product.id] ?? String(product.stock_quantity);
    const qty = parseInt(raw, 10);
    if (!Number.isFinite(qty) || qty < 0) {
      setError("Stock must be a whole number of 0 or more.");
      return;
    }

    setSavingId(product.id);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/owner/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, stockQuantity: qty }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json?.error ?? "Could not update stock.");
      } else {
        setNotice(`Updated stock for ${product.name}.`);
        setEdits((e) => {
          const next = { ...e };
          delete next[product.id];
          return next;
        });
        await load();
      }
    } catch {
      setError("Network error updating stock.");
    } finally {
      setSavingId(null);
    }
  }

  async function adjust(product: Product, delta: number) {
    const next = Math.max(0, product.stock_quantity + delta);
    setSavingId(product.id);
    setError(null);
    setNotice(null);

    try {
      const res = await fetch("/api/owner/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, stockQuantity: next }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json?.error ?? "Could not update stock.");
      } else {
        setNotice(`${product.name}: stock set to ${next}.`);
        await load();
      }
    } catch {
      setError("Network error updating stock.");
    } finally {
      setSavingId(null);
    }
  }

  const lowStock = products.filter(
    (p) => p.stock_quantity <= (p.low_stock_threshold || 10)
  );
  const inStock = products.filter(
    (p) => p.stock_quantity > (p.low_stock_threshold || 10)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-charcoal">Inventory</h1>
        <p className="mt-1 text-sm text-muted">
          Track stock levels. Customers see “out of stock” automatically and
          cannot order.
        </p>
      </div>

      {notice && (
        <div role="status" className="rounded-xl border border-fresh/30 bg-fresh/10 p-4 text-sm font-medium text-forest">
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-line/60" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="card p-14 text-center">
          <span className="text-5xl" aria-hidden="true">📦</span>
          <p className="mt-3 font-bold text-charcoal">No products yet</p>
          <p className="mt-1 text-sm text-muted">
            Add products first, then manage their stock here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {lowStock.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-extrabold text-danger">
                Needs attention ({lowStock.length})
              </h2>
              <ul className="space-y-2">
                {lowStock.map((p) => (
                  <StockRow
                    key={p.id}
                    product={p}
                    edits={edits}
                    setEdits={setEdits}
                    saving={savingId === p.id}
                    onSave={saveStock}
                    onAdjust={adjust}
                  />
                ))}
              </ul>
            </section>
          )}

          {inStock.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-extrabold text-charcoal">
                Healthy stock ({inStock.length})
              </h2>
              <ul className="space-y-2">
                {inStock.map((p) => (
                  <StockRow
                    key={p.id}
                    product={p}
                    edits={edits}
                    setEdits={setEdits}
                    saving={savingId === p.id}
                    onSave={saveStock}
                    onAdjust={adjust}
                  />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function StockRow({
  product,
  edits,
  setEdits,
  saving,
  onSave,
  onAdjust,
}: {
  product: Product;
  edits: Record<string, string>;
  setEdits: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  saving: boolean;
  onSave: (p: Product) => void;
  onAdjust: (p: Product, delta: number) => void;
}) {
  const value = edits[product.id] ?? String(product.stock_quantity);
  const isLow = product.stock_quantity <= (product.low_stock_threshold || 10);

  return (
    <li className="card flex flex-wrap items-center gap-3 p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-bold text-charcoal">{product.name}</p>
          {product.stock_quantity === 0 && (
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-bold text-red-700">
              Out of stock
            </span>
          )}
          {isLow && product.stock_quantity > 0 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700">
              Low stock
            </span>
          )}
        </div>
        {product.unit_label && (
          <p className="text-xs text-muted">{product.unit_label}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onAdjust(product, -1)}
          disabled={saving || product.stock_quantity === 0}
          aria-label={`Decrease stock for ${product.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg font-bold text-charcoal-soft transition-colors hover:border-forest hover:text-forest disabled:opacity-40"
        >
          −
        </button>

        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) =>
            setEdits((edits) => ({ ...edits, [product.id]: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave(product);
          }}
          disabled={saving}
          aria-label={`Stock quantity for ${product.name}`}
          className="field w-20 text-center"
        />

        <button
          type="button"
          onClick={() => onAdjust(product, 1)}
          disabled={saving}
          aria-label={`Increase stock for ${product.name}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg font-bold text-charcoal-soft transition-colors hover:border-forest hover:text-forest disabled:opacity-40"
        >
          +
        </button>

        <button
          type="button"
          onClick={() => onSave(product)}
          disabled={saving || value === String(product.stock_quantity)}
          className="rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white transition-opacity hover:bg-forest-dark disabled:opacity-40"
        >
          {saving ? "…" : "Save"}
        </button>
      </div>
    </li>
  );
}
