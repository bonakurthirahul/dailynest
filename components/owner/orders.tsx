"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  formatINR,
  formatDate,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/format";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "collected", label: "Collected" },
  { key: "rejected", label: "Rejected" },
  { key: "cancelled", label: "Cancelled" },
];

// Owner actions available from each status.
const ACTIONS: Partial<Record<OrderStatus, Array<{ status: OrderStatus; label: string; primary?: boolean; danger?: boolean }>>> = {
  pending: [
    { status: "accepted", label: "Accept", primary: true },
    { status: "rejected", label: "Reject", danger: true },
  ],
  accepted: [
    { status: "preparing", label: "Start preparing", primary: true },
    { status: "cancelled", label: "Cancel", danger: true },
  ],
  preparing: [
    { status: "ready", label: "Mark ready", primary: true },
    { status: "cancelled", label: "Cancel", danger: true },
  ],
  ready: [{ status: "collected", label: "Mark collected", primary: true }],
};

export function OwnerOrders() {
  const searchParams = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get("status") ?? "all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(
    searchParams.get("order")
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    try {
      const qs = filter === "all" ? "" : `?status=${filter}`;
      const res = await fetch(`/api/owner/orders${qs}`);
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as { orders: Order[] };
      setOrders(json.orders);
      setError(null);
    } catch {
      setError("Could not load orders.");
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time fetch
    setLoading(true);
     
    load();
  }, [load]);

  // Realtime: refresh whenever an order is inserted or updated.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("owner-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => load()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load]);

  async function transition(order: Order, next: OrderStatus, reason?: string) {
    setBusyId(order.id);
    try {
      const res = await fetch("/api/owner/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, status: next, reason }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Could not update the order.");
      } else {
        await load();
      }
    } catch {
      setError("Network error updating the order.");
    } finally {
      setBusyId(null);
      setRejectTarget(null);
      setRejectReason("");
    }
  }

  async function togglePaid(order: Order) {
    setBusyId(order.id);
    const next = order.payment_status === "paid_at_store" ? "unpaid" : "paid_at_store";
    try {
      const res = await fetch("/api/owner/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, paymentStatus: next }),
      });
      if (!res.ok) {
        const json = await res.json();
        setError(json?.error ?? "Could not update payment status.");
      } else {
        await load();
      }
    } catch {
      setError("Network error updating payment.");
    } finally {
      setBusyId(null);
    }
  }

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: orders.length };
    for (const o of orders) map[o.status] = (map[o.status] ?? 0) + 1;
    return map;
  }, [orders]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-charcoal">Orders</h1>
        <p className="mt-1 text-sm text-muted">
          New orders appear here instantly. Accept, prepare, and mark them ready
          for pickup.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              filter === f.key
                ? "border-forest bg-forest text-white"
                : "border-line bg-white text-charcoal-soft hover:border-forest hover:text-forest"
            }`}
          >
            {f.label}
            {counts[f.key] != null && (
              <span className="ml-1.5 opacity-70">({counts[f.key]})</span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-line/60" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-14 text-center">
          <span className="text-5xl" aria-hidden="true">🧾</span>
          <p className="mt-3 font-bold text-charcoal">No orders here</p>
          <p className="mt-1 text-sm text-muted">
            {filter === "all"
              ? "Orders will appear the moment a customer places one."
              : `No orders with the “${filter}” status right now.`}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const isOpen = expanded === order.id;
            const actions = ACTIONS[order.status] ?? [];
            return (
              <li key={order.id} className="card overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  aria-expanded={isOpen}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-5 text-left"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-heading font-extrabold tracking-wide text-forest">
                        {order.order_number}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${ORDER_STATUS_BADGE[order.status]}`}
                      >
                        {ORDER_STATUS_LABEL[order.status]}
                      </span>
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                          order.payment_status === "paid_at_store"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-line bg-ivory text-muted"
                        }`}
                      >
                        {PAYMENT_STATUS_LABEL[order.payment_status]}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-muted">
                      {order.customer_name} · {order.item_count} items ·{" "}
                      {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold text-charcoal">
                      {formatINR(order.total_in_paise)}
                    </span>
                    <svg
                      viewBox="0 0 20 20"
                      className={`h-5 w-5 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m5 7.5 5 5 5-5" />
                    </svg>
                  </div>
                </button>

                {isOpen && (
                  <OrderPanel
                    order={order}
                    actions={actions}
                    busy={busyId === order.id}
                    onTransition={transition}
                    onTogglePaid={togglePaid}
                    onReject={(o) => setRejectTarget(o)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Reject order"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lift">
            <h2 className="text-lg font-extrabold text-charcoal">
              Reject {rejectTarget.order_number}?
            </h2>
            <p className="mt-2 text-sm text-muted">
              The customer will be notified. Nothing was paid online, so there is
              no refund to process.
            </p>
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-semibold text-charcoal-soft">
                Reason (optional)
              </span>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                maxLength={300}
                className="field resize-y"
                placeholder="e.g. Item out of stock today."
              />
            </label>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="btn-ghost flex-1"
              >
                Keep order
              </button>
              <button
                type="button"
                onClick={() => transition(rejectTarget, "rejected", rejectReason)}
                disabled={busyId === rejectTarget.id}
                className="flex-1 rounded-full bg-danger px-5 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {busyId === rejectTarget.id ? "Rejecting…" : "Reject order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderPanel({
  order,
  actions,
  busy,
  onTransition,
  onTogglePaid,
  onReject,
}: {
  order: Order;
  actions: Array<{ status: OrderStatus; label: string; primary?: boolean; danger?: boolean }>;
  busy: boolean;
  onTransition: (order: Order, next: OrderStatus, reason?: string) => void;
  onTogglePaid: (order: Order) => void;
  onReject: (order: Order) => void;
}) {
  const [items, setItems] = useState<OrderItem[]>(order.order_items ?? []);
  const [loadingItems, setLoadingItems] = useState(!order.order_items);

  useEffect(() => {
    if (!loadingItems) return;
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from("order_items")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (!cancelled) {
          setItems((data as OrderItem[]) ?? []);
          setLoadingItems(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [order.id, loadingItems]);

  return (
    <div className="border-t border-line bg-ivory/60 p-5">
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <div>
          <h3 className="text-sm font-bold text-charcoal">Items</h3>
          {loadingItems ? (
            <div className="mt-3 h-20 animate-pulse rounded-xl bg-line/60" />
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-charcoal">{item.product_name}</p>
                    {item.unit_label && (
                      <p className="text-xs text-muted">Per {item.unit_label}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="text-sm text-muted">× {item.quantity}</span>
                    <span className="font-bold text-charcoal">
                      {formatINR(item.line_total_in_paise)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {order.pickup_notes && (
            <div className="mt-4 rounded-xl border border-line bg-white p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Pickup notes
              </p>
              <p className="mt-1 text-sm text-charcoal-soft">{order.pickup_notes}</p>
            </div>
          )}

          {order.status_reason && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                Rejection / cancellation reason
              </p>
              <p className="mt-1 text-sm text-red-700">{order.status_reason}</p>
            </div>
          )}
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer</p>
            <p className="mt-1 font-bold text-charcoal">{order.customer_name}</p>
            <a
              href={`tel:${order.customer_phone}`}
              className="mt-0.5 block text-sm font-semibold text-forest hover:underline"
            >
              {order.customer_phone}
            </a>
            {order.customer_email && (
              <p className="mt-0.5 text-xs text-muted">{order.customer_email}</p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Total</p>
            <p className="mt-1 text-2xl font-extrabold text-forest">
              {formatINR(order.total_in_paise)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {PAYMENT_STATUS_LABEL[order.payment_status]}
            </p>

            <button
              type="button"
              onClick={() => onTogglePaid(order)}
              disabled={busy}
              className={`mt-3 w-full rounded-xl border px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                order.payment_status === "paid_at_store"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-line text-charcoal-soft hover:border-forest hover:text-forest"
              }`}
            >
              {busy
                ? "Saving…"
                : order.payment_status === "paid_at_store"
                  ? "Mark as unpaid"
                  : "Mark as paid at store"}
            </button>
            <p className="mt-2 text-[0.68rem] leading-relaxed text-muted">
              Only the store owner can record an in-store payment.
            </p>
          </div>

          {actions.length > 0 && (
            <div className="rounded-xl border border-line bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Actions</p>
              <div className="mt-2 flex flex-col gap-2">
                {actions.map((action) =>
                  action.danger && action.status === "rejected" ? (
                    <button
                      key={action.status}
                      type="button"
                      onClick={() => onReject(order)}
                      disabled={busy}
                      className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      {action.label}
                    </button>
                  ) : (
                    <button
                      key={action.status}
                      type="button"
                      onClick={() => onTransition(order, action.status)}
                      disabled={busy}
                      className={`rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                        action.danger
                          ? "border border-line text-muted hover:border-danger hover:text-danger"
                          : action.primary
                            ? "bg-forest text-white hover:bg-forest-dark"
                            : "border border-line text-charcoal-soft hover:border-forest hover:text-forest"
                      }`}
                    >
                      {busy ? "Working…" : action.label}
                    </button>
                  )
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
