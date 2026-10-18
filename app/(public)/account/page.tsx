import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatINR, formatDate, ORDER_STATUS_BADGE, ORDER_STATUS_LABEL } from "@/lib/format";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(5);

  const list = (orders as Order[]) ?? [];
  const active = list.filter((o) =>
    ["pending", "accepted", "preparing", "ready"].includes(o.status)
  );

  return (
    <div className="space-y-8">
      {/* Active orders */}
      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-charcoal">Active orders</h2>
          <Link href="/account/orders" className="text-sm font-semibold text-forest hover:underline">
            View all →
          </Link>
        </div>

        {active.length === 0 ? (
          <div className="card mt-4 p-8 text-center">
            <p className="text-sm text-muted">
              You have no active orders right now.{" "}
              <Link href="/shop" className="font-semibold text-forest hover:underline">
                Start shopping
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {active.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="card flex flex-wrap items-center justify-between gap-3 p-4 transition-shadow hover:shadow-lift"
                >
                  <div>
                    <p className="font-heading font-extrabold tracking-wide text-forest">
                      {order.order_number}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatDate(order.created_at)} · {order.item_count} items
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${ORDER_STATUS_BADGE[order.status]}`}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
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
      </section>

      {/* Quick links */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { href: "/shop", title: "Shop groceries", body: "Browse the full catalogue." },
          { href: "/account/orders", title: "Order history", body: "See every past order." },
          { href: "/account/profile", title: "Update profile", body: "Name, phone, password." },
        ].map((link) => (
          <Link key={link.href} href={link.href} className="card p-5 transition-shadow hover:shadow-lift">
            <p className="font-bold text-charcoal">{link.title}</p>
            <p className="mt-1 text-sm text-muted">{link.body}</p>
          </Link>
        ))}
      </section>

      {user?.email && (
        <p className="text-xs text-muted">
          Signed in as {user.email}. Store pickup only — pay at the counter.
        </p>
      )}
    </div>
  );
}
