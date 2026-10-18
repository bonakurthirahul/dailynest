import { NextResponse } from "next/server";
import { requireOwnerApi } from "@/lib/auth/owner-api";

// GET /api/owner/overview — dashboard summary stats.
export async function GET() {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  const { admin } = auth;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  try {
    const [
      { data: allOrders },
      { data: todayPaid },
      { count: productCount },
    ] = await Promise.all([
      admin.from("orders").select("status, payment_status, created_at"),
      admin
        .from("orders")
        .select("total_in_paise")
        .eq("payment_status", "paid_at_store")
        .gte("created_at", startOfToday.toISOString()),
      admin.from("products").select("id", { count: "exact", head: true }),
    ]);

    // Low-stock list: stock <= threshold. Computed in JS because PostgREST
    // cannot compare two columns in a single filter.
    const { data: stockRows } = await admin
      .from("products")
      .select("id, name, unit_label, stock_quantity, low_stock_threshold")
      .eq("is_available", true)
      .limit(500);

    const lowStockList = (stockRows ?? [])
      .filter((p) => p.stock_quantity <= (p.low_stock_threshold ?? 10))
      .sort((a, b) => a.stock_quantity - b.stock_quantity)
      .slice(0, 12);

    const orders = allOrders ?? [];
    const byStatus = {
      pending: 0,
      accepted: 0,
      preparing: 0,
      ready: 0,
      collected: 0,
      rejected: 0,
      cancelled: 0,
    } as Record<string, number>;

    for (const o of orders) {
      byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;
    }

    const todaySalesInPaise = (todayPaid ?? []).reduce(
      (sum, o) => sum + (o.total_in_paise ?? 0),
      0
    );

    return NextResponse.json({
      totalOrders: orders.length,
      byStatus,
      todaySalesInPaise,
      lowStock: lowStockList,
      productCount: productCount ?? 0,
      openOrders:
        byStatus.pending + byStatus.accepted + byStatus.preparing + byStatus.ready,
    });
  } catch (err) {
    console.error("[owner/overview] error:", err);
    return NextResponse.json(
      { error: "Could not load dashboard overview." },
      { status: 500 }
    );
  }
}
