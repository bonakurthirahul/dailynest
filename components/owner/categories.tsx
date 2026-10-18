"use client";

import { useCallback, useEffect, useState } from "react";
import type { Category } from "@/lib/types";

export function OwnerCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", description: "", imageUrl: "" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/owner/categories");
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as { categories: Category[] };
      setCategories(json.categories);
      setError(null);
    } catch {
      setError("Could not load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", imageUrl: "" });
    setShowForm(true);
    setNotice(null);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? "",
      imageUrl: cat.image_url ?? "",
    });
    setShowForm(true);
    setNotice(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);

    const slug =
      form.slug.trim() ||
      form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    setSaving(true);
    try {
      const payload = {
        categoryId: editing?.id,
        name: form.name.trim(),
        slug,
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
      };

      const res = await fetch("/api/owner/categories", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json?.error ?? "Could not save the category.");
      } else {
        setNotice(editing ? "Category updated." : "Category added.");
        setShowForm(false);
        await load();
      }
    } catch {
      setError("Network error saving the category.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(cat: Category) {
    if (
      !window.confirm(
        `Delete “${cat.name}”? Products in this category will become uncategorised.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/owner/categories?id=${cat.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json?.error ?? "Could not delete the category.");
      } else {
        await load();
      }
    } catch {
      setError("Network error deleting the category.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-charcoal">Categories</h1>
          <p className="mt-1 text-sm text-muted">
            {categories.length} categories in your store.
          </p>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary">
          + Add category
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

      {showForm && (
        <form onSubmit={save} className="card animate-fade-up space-y-4 p-6">
          <h2 className="text-lg font-extrabold text-charcoal">
            {editing ? "Edit category" : "Add category"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="field"
                required
                minLength={2}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                URL slug (optional)
              </span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="field"
                placeholder="auto-generated from name"
                pattern="[a-z0-9-]*"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Description (optional)
              </span>
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="field resize-y"
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Image URL (optional)
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

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving…" : editing ? "Save changes" : "Add category"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-line/60" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="card p-14 text-center">
          <p className="font-bold text-charcoal">No categories yet</p>
          <p className="mt-1 text-sm text-muted">
            Add categories to organise your store and help customers browse.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <li key={cat.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-charcoal">{cat.name}</h3>
                  <p className="mt-0.5 text-xs text-muted">/{cat.slug}</p>
                </div>
              </div>

              {cat.description && (
                <p className="mt-2 text-sm text-muted line-clamp-2">{cat.description}</p>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-charcoal-soft transition-colors hover:border-forest hover:text-forest"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(cat)}
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
