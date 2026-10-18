"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { OrderTimeline } from "@/components/order/order-timeline";
import { formatINR, formatDate, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";
import type { Order, OrderItem } from "@/lib/types";

// Live order detail for the customer. Subscribes to Supabase Realtime so the
// status updates the moment the owner transitions it — no refresh needed.
export function OrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function load() {
      const { data: orderRow } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (cancelled) return;

      if (!orderRow) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setOrder(orderRow as Order);

      const { data: itemRows } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true });

      if (cancelled) return;
      setItems((itemRows as OrderItem[]) ?? []);
      setLoading(false);
    }

    load();

    // Realtime: watch this order row for status/total changes.
    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          if (!cancelled && payload.new) setOrder(payload.new as Order);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (loading) {
    return <div className="h-80 animate-pulse rounded-2xl bg-line/50" />;
  }

  if (notFound || !order) {
    return (
      <div className="card p-10 text-center">
        <p className="font-bold text-charcoal">Order not found</p>
        <p className="mt-2 text-sm text-muted">
          This order does not exist or is not linked to your account.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-6">
        {/* Status */}
        <section className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Order</p>
              <p className="font-heading text-xl font-extrabold tracking-wide text-forest">
                {order.order_number}
              </p>
            </div>
            <span className="rounded-full border border-line bg-ivory px-3 py-1 text-xs font-semibold text-charcoal-soft">
              {PAYMENT_STATUS_LABEL[order.payment_status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted">Placed {formatDate(order.created_at)}</p>

          <div className="mt-6">
            <OrderTimeline status={order.status} />
          </div>
        </section>

        {/* Items */}
        <section className="card p-6">
          <h2 className="text-lg font-extrabold text-charcoal">Items</h2>
          <ul className="mt-4 divide-y divide-line">
            {items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-3">
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
          <div className="mt-3 flex justify-between border-t border-line pt-4">
            <span className="font-bold text-charcoal">Total</span>
            <span className="font-extrabold text-forest">
              {formatINR(order.total_in_paise)}
            </span>
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="card border-fresh/30 bg-fresh/6 p-5">
          <h3 className="font-bold text-forest">Pickup & payment</h3>
          <p className="mt-2 text-sm leading-relaxed text-charcoal-soft">
            Collect this order at the DailyNest counter. Show order number{" "}
            <span className="font-bold text-forest">{order.order_number}</span> and
            pay {formatINR(order.total_in_paise)} by cash or UPI.
          </p>
        </div>

        {order.pickup_notes && (
          <div className="card p-5">
            <h3 className="font-bold text-charcoal">Your pickup notes</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{order.pickup_notes}</p>
          </div>
        )}

        <div className="card p-5">
          <h3 className="font-bold text-charcoal">Current status</h3>
          <p className="mt-2 text-2xl font-extrabold text-forest">
            {ORDER_STATUS_LABEL[order.status]}
          </p>
          <p className="mt-1 text-xs text-muted">Updates automatically in real time.</p>
        </div>
      </aside>
    </div>
  );
}
