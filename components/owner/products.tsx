"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { formatINR } from "@/lib/format";
import type { Category, Product } from "@/lib/types";

interface FormState {
  id?: string;
  name: string;
  description: string;
  unitLabel: string;
  categoryId: string;
  priceRupees: string;
  discountRupees: string;
  stockQuantity: string;
  lowStockThreshold: string;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  unitLabel: "",
  categoryId: "",
  priceRupees: "",
  discountRupees: "",
  stockQuantity: "0",
  lowStockThreshold: "10",
  imageUrl: "",
  isAvailable: true,
  isFeatured: false,
};

export function OwnerProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/owner/products"),
        fetch("/api/owner/categories"),
      ]);
      if (!prodRes.ok) throw new Error("failed");
      const prodJson = (await prodRes.json()) as { products: Product[] };
      setProducts(prodJson.products);
      if (catRes.ok) {
        const catJson = (await catRes.json()) as { categories: Category[] };
        setCategories(catJson.categories);
      }
      setError(null);
    } catch {
      setError("Could not load products.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch
    load();
  }, [load]);

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(term) ||
      (p.description ?? "").toLowerCase().includes(term) ||
      (p.category?.name ?? "").toLowerCase().includes(term)
    );
  });

  function openCreate() {
    setForm(EMPTY_FORM);
    setFormOpen(true);
    setNotice(null);
  }

  function openEdit(product: Product) {
    setForm({
      id: product.id,
      name: product.name,
      description: product.description ?? "",
      unitLabel: product.unit_label ?? "",
      categoryId: product.category_id ?? "",
      priceRupees: (product.price_in_paise / 100).toFixed(2),
      discountRupees:
        product.discount_price_in_paise != null
          ? (product.discount_price_in_paise / 100).toFixed(2)
          : "",
      stockQuantity: String(product.stock_quantity),
      lowStockThreshold: String(product.low_stock_threshold),
      imageUrl: product.image_url ?? "",
      isAvailable: product.is_available,
      isFeatured: product.is_featured,
    });
    setFormOpen(true);
    setNotice(null);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/owner/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Upload failed.");
      } else {
        setForm((f) => ({ ...f, imageUrl: json.url }));
      }
    } catch {
      setError("Upload failed. Check your connection.");
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const price = Math.round(parseFloat(form.priceRupees || "0") * 100);
    if (!Number.isFinite(price) || price < 0) {
      setError("Please enter a valid price.");
      return;
    }

    const discountRaw = form.discountRupees.trim();
    const discount = discountRaw ? Math.round(parseFloat(discountRaw) * 100) : null;
    if (discount != null && discount >= price) {
      setError("Discount price must be lower than the regular price.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        productId: form.id,
        name: form.name.trim(),
        description: form.description.trim(),
        unitLabel: form.unitLabel.trim(),
        categoryId: form.categoryId || null,
        priceInPaise: price,
        discountPriceInPaise: discount,
        stockQuantity: parseInt(form.stockQuantity || "0", 10) || 0,
        lowStockThreshold: parseInt(form.lowStockThreshold || "10", 10) || 10,
        imageUrl: form.imageUrl.trim(),
        isAvailable: form.isAvailable,
        isFeatured: form.isFeatured,
      };

      const res = await fetch("/api/owner/products", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json?.error ?? "Could not save the product.");
      } else {
        setNotice(form.id ? "Product updated." : "Product added.");
        setFormOpen(false);
        await load();
      }
    } catch {
      setError("Network error saving the product.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAvailability(product: Product) {
    try {
      await fetch("/api/owner/products", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          isAvailable: !product.is_available,
        }),
      });
      await load();
    } catch {
      setError("Could not update availability.");
    }
  }

  async function remove(product: Product) {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/owner/products?id=${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json?.error ?? "Could not delete the product.");
      } else {
        await load();
      }
    } catch {
      setError("Network error deleting the product.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-charcoal">Products</h1>
          <p className="mt-1 text-sm text-muted">
            {products.length} products in your catalogue.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          + Add product
        </button>
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

      {/* Form */}
      {formOpen && (
        <form onSubmit={save} className="card animate-fade-up space-y-4 p-6">
          <h2 className="text-lg font-extrabold text-charcoal">
            {form.id ? "Edit product" : "Add product"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="field"
                required
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Description
              </span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="field resize-y"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Unit label
              </span>
              <input
                type="text"
                value={form.unitLabel}
                onChange={(e) => setForm((f) => ({ ...f, unitLabel: e.target.value }))}
                className="field"
                placeholder="1 kg / 500 g / 6 pcs"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Category
              </span>
              <select
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                className="field"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Price (₹)
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.priceRupees}
                onChange={(e) => setForm((f) => ({ ...f, priceRupees: e.target.value }))}
                className="field"
                required
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Discount price (₹) — optional
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.discountRupees}
                onChange={(e) => setForm((f) => ({ ...f, discountRupees: e.target.value }))}
                className="field"
                placeholder="Leave blank for no discount"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Stock quantity
              </span>
              <input
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(e) => setForm((f) => ({ ...f, stockQuantity: e.target.value }))}
                className="field"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Low-stock alert threshold
              </span>
              <input
                type="number"
                min="0"
                value={form.lowStockThreshold}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))
                }
                className="field"
              />
            </label>
          </div>

          {/* Image */}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Product image
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-fresh/15 file:px-4 file:py-2 file:font-semibold file:text-forest"
                />
              </div>
              {uploading && (
                <p className="mt-1.5 text-xs font-medium text-forest">Uploading…</p>
              )}
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Or image URL
              </span>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="field"
                placeholder="https://…"
              />
            </label>
          </div>

          {form.imageUrl && (
            <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-line bg-ivory-dark">
              <Image src={form.imageUrl} alt="Preview" fill sizes="160px" className="object-cover" unoptimized />
            </div>
          )}

          <div className="flex flex-wrap gap-6">
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal-soft">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))}
                className="h-4 w-4 accent-[#245C43]"
              />
              Available for sale
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal-soft">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                className="h-4 w-4 accent-[#245C43]"
              />
              Feature on homepage
            </label>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : form.id ? "Save changes" : "Add product"}
            </button>
            <button type="button" onClick={() => setFormOpen(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search products…"
        className="field max-w-md"
        aria-label="Search products"
      />

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-line/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-14 text-center">
          <p className="font-bold text-charcoal">No products found</p>
          <p className="mt-1 text-sm text-muted">
            Add your first product to start building the catalogue.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((product) => (
            <li key={product.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ivory-dark">
                {product.image_url ? (
                  <Image
                    src={product.image_url}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl" aria-hidden="true">
                    🥬
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold text-charcoal">{product.name}</p>
                  {product.is_featured && (
                    <span className="rounded-full bg-fresh/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-forest">
                      Featured
                    </span>
                  )}
                  {!product.is_available && (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-muted">
                      Hidden
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {product.category?.name ?? "Uncategorised"}
                  {product.unit_label && ` · ${product.unit_label}`}
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
                  <span className="font-bold text-forest">
                    {formatINR(
                      product.discount_price_in_paise ?? product.price_in_paise
                    )}
                  </span>
                  {product.discount_price_in_paise != null && (
                    <span className="text-muted line-through">
                      {formatINR(product.price_in_paise)}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      product.stock_quantity <= (product.low_stock_threshold || 10)
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {product.stock_quantity} in stock
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleAvailability(product)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-charcoal-soft transition-colors hover:border-forest hover:text-forest"
                >
                  {product.is_available ? "Disable" : "Enable"}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(product)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-charcoal-soft transition-colors hover:border-forest hover:text-forest"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(product)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:border-danger hover:text-danger"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
