import { NextResponse } from "next/server";
import { requireOwnerApi, apiError } from "@/lib/auth/owner-api";
import { notifyCustomerStatus } from "@/lib/notify";
import type { Order, OrderStatus } from "@/lib/types";

// ============================================================================
// /api/owner/orders
//   GET    — list orders (filterable by status)
//   PATCH  — transition an order's status / payment status
// ============================================================================

// Allowed status transitions (server-enforced workflow).
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["collected"],
  collected: [],
  rejected: [],
  cancelled: [],
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  collected: "Collected",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export async function GET(request: Request) {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const orderId = searchParams.get("order");

  try {
    // Fetch a single order by id
    if (orderId) {
      const { data } = await auth.admin
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      if (!data) return apiError("Order not found.", "not_found", 404);
      const order = data as unknown as Order;
      const { data: items } = await auth.admin
        .from("order_items")
        .select("*")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true });
      return NextResponse.json({ order: { ...order, order_items: items ?? [] } });
    }

    // List orders, optionally filtered by status
    let query = auth.admin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data } = await query;
    return NextResponse.json({ orders: data ?? [] });
  } catch (err) {
    console.error("[owner/orders] GET error:", err);
    return apiError("Could not load orders.", "server_error", 500);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  let body: {
    orderId?: string;
    status?: string;
    paymentStatus?: string;
    reason?: string;
  };
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.", "bad_request");
  }

  const { orderId, status, paymentStatus, reason } = body;

  if (!orderId) return apiError("Missing orderId.", "bad_request");

  try {
    // Fetch the current order.
    const { data: orderRow } = await auth.admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (!orderRow) return apiError("Order not found.", "not_found", 404);
    const order = orderRow as Order;

    // --- Status transition --------------------------------------------
    if (status) {
      const next = status as OrderStatus;
      const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(next)) {
        return apiError(
          `Cannot move an order from “${STATUS_LABEL[order.status]}” to “${STATUS_LABEL[next] ?? next}”.`,
          "invalid_transition"
        );
      }

      const { error: updateError } = await auth.admin
        .from("orders")
        .update({
          status: next,
          status_reason:
            next === "rejected" || next === "cancelled"
              ? (reason?.slice(0, 300) ?? null)
              : null,
        })
        .eq("id", orderId);

      if (updateError) {
        return apiError("Could not update the order status.", "server_error", 500);
      }

      // Notify the customer (best-effort, honest reporting in logs).
      await notifyCustomerStatus(
        { ...order, status: next },
        STATUS_LABEL[next],
        next === "rejected" && reason ? `Reason: ${reason}` : undefined
      );
    }

    // --- Payment status ------------------------------------------------
    // Only an owner may mark an order paid. A customer has no route here at
    // all (requireOwnerApi already rejected them).
    if (paymentStatus) {
      if (!["unpaid", "paid_at_store"].includes(paymentStatus)) {
        return apiError("Invalid payment status.", "bad_request");
      }

      const { error: payError } = await auth.admin
        .from("orders")
        .update({ payment_status: paymentStatus })
        .eq("id", orderId);

      if (payError) {
        return apiError("Could not update payment status.", "server_error", 500);
      }
    }

    // Return the refreshed order with items.
    const { data: refreshed } = await auth.admin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    const { data: items } = await auth.admin
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    return NextResponse.json({
      ok: true,
      order: { ...(refreshed as Order), order_items: items ?? [] },
    });
  } catch (err) {
    console.error("[owner/orders] PATCH error:", err);
    return apiError("Could not update the order.", "server_error", 500);
  }
}
