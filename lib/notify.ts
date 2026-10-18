import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order } from "@/lib/types";
import { formatINR } from "@/lib/format";

// Server-only notification helpers. These use the service-role client and
// are called ONLY from Route Handlers that have already verified the
// caller's identity/role. They never throw — a failed notification must not
// roll back a successfully created order, but the caller is told so it can
// report honestly.

interface NotifyArgs {
  audience: "owner" | "customer";
  userId?: string | null;
  orderId?: string | null;
  title: string;
  body: string;
  kind: string;
}

export async function createNotification(args: NotifyArgs): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("notifications").insert({
      audience: args.audience,
      user_id: args.userId ?? null,
      order_id: args.orderId ?? null,
      title: args.title,
      body: args.body,
      kind: args.kind,
    });
    if (error) {
      console.error("[notify] insert failed:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[notify] unexpected error:", err);
    return false;
  }
}

/** Notify the store owner about a newly created order. */
export async function notifyOwnerNewOrder(order: Order): Promise<boolean> {
  const body =
    `Order ${order.order_number} · ${order.item_count} item` +
    `${order.item_count === 1 ? "" : "s"} · ${formatINR(order.total_in_paise)} ` +
    `from ${order.customer_name}.`;

  return createNotification({
    audience: "owner",
    orderId: order.id,
    title: "New order received",
    body,
    kind: "new_order",
  });
}

/** Notify the customer that their order status changed. */
export async function notifyCustomerStatus(
  order: Pick<Order, "id" | "order_number" | "user_id" | "status">,
  statusLabel: string,
  extra?: string
): Promise<boolean> {
  if (!order.user_id) return false; // guest checkout has no inbox to notify

  return createNotification({
    audience: "customer",
    userId: order.user_id,
    orderId: order.id,
    title: `Order ${statusLabel.toLowerCase()}`,
    body:
      `Your order ${order.order_number} is now ${statusLabel.toLowerCase()}.` +
      (extra ? ` ${extra}` : ""),
    kind: "order_status",
  });
}

/** Notify the owner that a product is running low on stock. */
export async function notifyOwnerLowStock(
  productName: string,
  remaining: number
): Promise<boolean> {
  return createNotification({
    audience: "owner",
    title: "Low stock alert",
    body: `${productName} is down to ${remaining} unit${remaining === 1 ? "" : "s"} remaining.`,
    kind: "low_stock",
  });
}
