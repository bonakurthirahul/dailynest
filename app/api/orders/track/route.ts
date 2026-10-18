import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// GET /api/orders/track?order=DN-1042
// ============================================================================
// Public, minimal order-status lookup by order number.
//
// SECURITY: this deliberately returns ONLY non-PII status information. It
// never returns customer name, phone, email, pickup notes, or the itemised
// list. Order numbers are also cross-checked to be recent so sequential
// enumeration of old orders yields nothing useful. Full order details
// require the signed-in owner or the order's own customer (enforced by RLS
// on the authenticated routes).
// ============================================================================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNumber = (searchParams.get("order") ?? "").trim();

  if (!orderNumber || orderNumber.length > 40) {
    return NextResponse.json(
      { error: "Please provide a valid order number.", code: "bad_request" },
      { status: 400 }
    );
  }

  try {
    const admin = createAdminClient();

    const { data: order } = await admin
      .from("orders")
      .select("order_number, status, item_count, total_in_paise, created_at")
      .eq("order_number", orderNumber)
      .maybeSingle();

    if (!order) {
      return NextResponse.json(
        { error: "No order found with that number.", code: "not_found" },
        { status: 404 }
      );
    }

    // Only surface orders from the last 30 days to limit enumeration value.
    const created = new Date(order.created_at).getTime();
    if (Date.now() - created > 30 * 24 * 60 * 60 * 1000) {
      return NextResponse.json(
        { error: "No order found with that number.", code: "not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      orderNumber: order.order_number,
      status: order.status,
      itemCount: order.item_count,
      totalInPaise: order.total_in_paise,
      createdAt: order.created_at,
    });
  } catch (err) {
    console.error("[track] error:", err);
    return NextResponse.json(
      { error: "Could not look up the order. Please try again.", code: "server_error" },
      { status: 500 }
    );
  }
}
