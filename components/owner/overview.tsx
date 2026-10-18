"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatINR } from "@/lib/format";

interface Overview {
  totalOrders: number;
  byStatus: Record<string, number>;
  todaySalesInPaise: number;
  lowStock: Array<{
    id: string;
    name: string;
    unit_label: string | null;
    stock_quantity: number;
    low_stock_threshold: number;
  }>;
  productCount: number;
  openOrders: number;
}

export function OwnerOverview() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/owner/overview");
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as Overview;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Could not load the dashboard overview.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    // Refresh when a new order arrives in realtime.
    const supabase = createClient();
    const channel = supabase
      .channel("owner-overview")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        () => load()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-line/60" />
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center text-sm font-medium text-red-700">
        {error ?? "Something went wrong."}
      </div>
    );
  }

  const stats = [
    {
      label: "Pending orders",
      value: data.byStatus.pending ?? 0,
      href: "/store-control-7x9/dashboard/orders?status=pending",
      accent: "text-amber-600",
    },
    {
      label: "Being prepared",
      value: (data.byStatus.accepted ?? 0) + (data.byStatus.preparing ?? 0),
      href: "/store-control-7x9/dashboard/orders?status=preparing",
      accent: "text-indigo-600",
    },
    {
      label: "Ready for pickup",
      value: data.byStatus.ready ?? 0,
      href: "/store-control-7x9/dashboard/orders?status=ready",
      accent: "text-emerald-600",
    },
    {
      label: "Collected",
      value: data.byStatus.collected ?? 0,
      href: "/store-control-7x9/dashboard/orders?status=collected",
      accent: "text-neutral-500",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-charcoal">Overview</h1>
        <p className="mt-1 text-sm text-muted">
          Live snapshot of your store. Updates automatically when new orders
          arrive.
        </p>
      </div>

      {/* Headline stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Today&apos;s sales (paid at store)
          </p>
          <p className="mt-2 text-3xl font-extrabold text-forest">
            {formatINR(data.todaySalesInPaise)}
          </p>
          <p className="mt-1 text-xs text-muted">Recorded store payments today</p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Total orders
          </p>
          <p className="mt-2 text-3xl font-extrabold text-charcoal">{data.totalOrders}</p>
          <p className="mt-1 text-xs text-muted">{data.openOrders} still open</p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Products
          </p>
          <p className="mt-2 text-3xl font-extrabold text-charcoal">{data.productCount}</p>
          <p className="mt-1 text-xs text-muted">In your catalogue</p>
        </div>

        <div className="card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            Low stock
          </p>
          <p className="mt-2 text-3xl font-extrabold text-danger">{data.lowStock.length}</p>
          <p className="mt-1 text-xs text-muted">At or below threshold</p>
        </div>
      </div>

      {/* Status breakdown */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href} className="card p-5 transition-shadow hover:shadow-lift">
            <p className="text-sm font-semibold text-muted">{stat.label}</p>
            <p className={`mt-2 text-4xl font-extrabold ${stat.accent}`}>{stat.value}</p>
          </Link>
        ))}
      </div>

      {/* Low stock */}
      <section className="card p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-charcoal">Low-stock products</h2>
          <Link
            href="/store-control-7x9/dashboard/inventory"
            className="text-sm font-semibold text-forest hover:underline"
          >
            Manage inventory →
          </Link>
        </div>

        {data.lowStock.length === 0 ? (
          <p className="mt-4 text-sm text-muted">
            Everything is comfortably in stock. Nice work.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {data.lowStock.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <p className="font-semibold text-charcoal">{p.name}</p>
                  {p.unit_label && <p className="text-xs text-muted">{p.unit_label}</p>}
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${
                    p.stock_quantity === 0
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {p.stock_quantity === 0 ? "Out of stock" : `${p.stock_quantity} left`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
