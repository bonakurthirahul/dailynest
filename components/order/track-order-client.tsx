"use client";

import { useState } from "react";
import { OrderTimeline } from "@/components/order/order-timeline";
import { formatINR, formatDate, ORDER_STATUS_LABEL } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

interface TrackResult {
  orderNumber: string;
  status: OrderStatus;
  itemCount: number;
  totalInPaise: number;
  createdAt: string;
}

export function TrackOrderClient() {
  const [orderNumber, setOrderNumber] = useState("");
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const q = orderNumber.trim();
    if (!q) {
      setError("Please enter an order number.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders/track?order=${encodeURIComponent(q)}`
      );
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Order not found.");
        setLoading(false);
        return;
      }

      setResult(data as TrackResult);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={lookup} className="card p-6">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
            Order number
          </span>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              className="field flex-1 font-heading tracking-widest"
              placeholder="DN-1042"
              aria-label="Order number"
            />
            <button type="submit" disabled={loading} className="btn-primary !py-3">
              {loading ? "Checking…" : "Track order"}
            </button>
          </div>
        </label>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
      </form>

      {result && (
        <div className="card animate-fade-up mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Order</p>
              <p className="font-heading text-xl font-extrabold tracking-wide text-forest">
                {result.orderNumber}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Status</p>
              <p className="font-bold text-charcoal">{ORDER_STATUS_LABEL[result.status]}</p>
            </div>
          </div>

          <p className="mt-3 text-sm text-muted">
            Placed {formatDate(result.createdAt)} · {result.itemCount} items ·{" "}
            {formatINR(result.totalInPaise)} payable at store
          </p>

          <div className="mt-6">
            <OrderTimeline status={result.status} />
          </div>
        </div>
      )}
    </div>
  );
}
