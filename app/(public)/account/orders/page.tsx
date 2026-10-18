import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR, formatDate, ORDER_STATUS_BADGE, ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Order history" };

export default async function OrderHistoryPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const list = (orders as Order[]) ?? [];

  return (
    <div>
      <h2 className="text-lg font-extrabold text-charcoal">All orders</h2>

      {list.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center gap-3 p-12 text-center">
          <span className="text-5xl" aria-hidden="true">🧾</span>
          <p className="font-bold text-charcoal">No orders yet</p>
          <p className="max-w-sm text-sm text-muted">
            When you place an order it will appear here with live status updates.
          </p>
          <Link href="/shop" className="btn-primary mt-2">
            Browse groceries
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((order) => (
            <li key={order.id}>
              <Link
                href={`/account/orders/${order.id}`}
                className="card flex flex-wrap items-center justify-between gap-4 p-5 transition-shadow hover:shadow-lift"
              >
                <div className="min-w-0">
                  <p className="font-heading font-extrabold tracking-wide text-forest">
                    {order.order_number}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDate(order.created_at)} · {order.item_count} items
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-bold ${ORDER_STATUS_BADGE[order.status]}`}
                  >
                    {ORDER_STATUS_LABEL[order.status]}
                  </span>
                  <span className="rounded-full border border-line bg-ivory px-3 py-1 text-xs font-semibold text-charcoal-soft">
                    {PAYMENT_STATUS_LABEL[order.payment_status]}
                  </span>
                  <span className="font-extrabold text-charcoal">
                    {formatINR(order.total_in_paise)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
