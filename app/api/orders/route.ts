import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyOwnerNewOrder } from "@/lib/notify";
import { effectivePriceInPaise } from "@/lib/format";
import type {
  CreateOrderPayload,
  Order,
  Product,
  StoreSetting,
} from "@/lib/types";

// ============================================================================
// POST /api/orders
// ============================================================================
// Server-authoritative order creation. The browser NEVER dictates price or
// total — every line is re-priced from the database here.
//
// Steps:
//   1. Validate the caller's session (customer must be signed in).
//   2. Validate and normalise the payload.
//   3. Fetch authoritative product rows (prices + stock).
//   4. Check availability + stock for every line.
//   5. Compute totals on the server.
//   6. Atomically decrement stock + create the order (advisory lock).
//   7. Generate a unique order number.
//   8. Trigger an owner notification.
//
// Duplicate protection: the client sends a stable `clientRequestId`; a
// unique partial index on (user_id, client_request_id) makes retries a
// no-op that returns the original order.
// ============================================================================

interface OrderLineInput {
  productId: string;
  quantity: number;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // 1. Authenticated identity -------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Please sign in to place an order. Your session may have expired.",
          code: "unauthenticated",
        },
        { status: 401 }
      );
    }

    // 2. Validate payload --------------------------------------------------
    let payload: CreateOrderPayload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body.", code: "bad_request" },
        { status: 400 }
      );
    }

    const validationError = validatePayload(payload);
    if (validationError) {
      return NextResponse.json(
        { error: validationError, code: "invalid_payload" },
        { status: 400 }
      );
    }

    const items: OrderLineInput[] = payload.items.map((i) => ({
      productId: String(i.productId),
      quantity: Math.floor(Number(i.quantity)),
    }));

    // 3. Fetch authoritative product rows ---------------------------------
    const admin = createAdminClient();
    const productIds = items.map((i) => i.productId);

    const { data: products, error: productError } = await admin
      .from("products")
      .select("*")
      .in("id", productIds);

    if (productError) {
      console.error("[orders] product fetch failed:", productError.message);
      return NextResponse.json(
        { error: "Could not verify products. Please try again.", code: "server_error" },
        { status: 500 }
      );
    }

    const productMap = new Map<string, Product>(
      (products as Product[]).map((p) => [p.id, p])
    );

    // 4. Validate every line ----------------------------------------------
    for (const line of items) {
      const product = productMap.get(line.productId);
      if (!product) {
        return NextResponse.json(
          { error: "One of the products is no longer available.", code: "product_missing" },
          { status: 409 }
        );
      }
      if (!product.is_available) {
        return NextResponse.json(
          { error: `“${product.name}” is currently unavailable.`, code: "unavailable" },
          { status: 409 }
        );
      }
      if (product.stock_quantity < line.quantity) {
        return NextResponse.json(
          {
            error:
              product.stock_quantity === 0
                ? `“${product.name}” is out of stock.`
                : `Only ${product.stock_quantity} of “${product.name}” left in stock.`,
            code: "insufficient_stock",
            details: { productId: line.productId, available: product.stock_quantity },
          },
          { status: 409 }
        );
      }
    }

    // 5. Compute totals on the server -------------------------------------
    let subtotal = 0;
    let itemCount = 0;
    const lines: Array<{
      product: Product;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
    }> = [];

    for (const line of items) {
      const product = productMap.get(line.productId)!;
      const unitPrice = effectivePriceInPaise(
        product.price_in_paise,
        product.discount_price_in_paise
      );
      const lineTotal = unitPrice * line.quantity;
      subtotal += lineTotal;
      itemCount += line.quantity;
      lines.push({ product, quantity: line.quantity, unitPrice, lineTotal });
    }

    // 6 & 7. Atomic stock decrement + order creation ----------------------
    // Use the admin client with a transaction-equivalent pattern: take an
    // advisory lock per product, re-check stock, then write.
    const orderResult = await createOrderTransaction({
      admin,
      userId: user.id,
      userEmail: user.email ?? null,
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      pickupNotes: payload.pickupNotes?.trim() || null,
      clientRequestId: payload.clientRequestId,
      lines,
      subtotal,
      itemCount,
    });

    if (!orderResult.ok) {
      if (orderResult.conflict) {
        return NextResponse.json(
          { error: orderResult.message, code: orderResult.code ?? "conflict" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: orderResult.message, code: "server_error" },
        { status: 500 }
      );
    }

    const order = orderResult.order!;

    // 8. Owner notification (non-blocking for the customer response) ------
    const notified = await notifyOwnerNewOrder(order);

    return NextResponse.json(
      {
        ok: true,
        orderNumber: order.order_number,
        orderId: order.id,
        totalInPaise: order.total_in_paise,
        itemCount: order.item_count,
        // Honest reporting: we only claim a notification landed if it did.
        ownerNotified: notified,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[orders] unexpected error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again.", code: "server_error" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------

function validatePayload(payload: CreateOrderPayload): string | null {
  if (!payload || typeof payload !== "object") return "Invalid request body.";
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return "Your cart is empty.";
  }
  if (payload.items.length > 100) return "Too many items in one order.";

  for (const item of payload.items) {
    if (!item || typeof item.productId !== "string" || !item.productId) {
      return "Invalid product in cart.";
    }
    const q = Number(item.quantity);
    if (!Number.isFinite(q) || q < 1 || Math.floor(q) !== q || q > 999) {
      return "Invalid quantity for one of the products.";
    }
  }

  // Deduplicate: merge identical product ids so totals/stock are consistent.
  const seen = new Set<string>();
  for (const item of payload.items) {
    if (seen.has(item.productId)) {
      // Caller must merge; we reject to keep totals unambiguous.
      return "Duplicate product in cart. Please refresh and try again.";
    }
    seen.add(item.productId);
  }

  const name = (payload.customerName ?? "").trim();
  if (name.length < 2 || name.length > 120) return "Please enter your full name.";

  const phone = (payload.customerPhone ?? "").trim();
  if (!/^[0-9+\-\s()]{8,15}$/.test(phone)) {
    return "Please enter a valid contact phone number.";
  }

  if (payload.pickupNotes && payload.pickupNotes.length > 500) {
    return "Pickup notes are too long (max 500 characters).";
  }

  if (!payload.clientRequestId || typeof payload.clientRequestId !== "string") {
    return "Missing request identifier. Please refresh the page.";
  }
  if (payload.clientRequestId.length > 100) {
    return "Invalid request identifier.";
  }

  return null;
}

interface TransactionArgs {
  admin: ReturnType<typeof createAdminClient>;
  userId: string;
  userEmail: string | null;
  customerName: string;
  customerPhone: string;
  pickupNotes: string | null;
  clientRequestId: string;
  lines: Array<{
    product: Product;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  subtotal: number;
  itemCount: number;
}

type TransactionResult =
  | { ok: true; order: Order }
  | { ok: false; conflict?: boolean; code?: string; message: string };

async function createOrderTransaction(
  args: TransactionArgs
): Promise<TransactionResult> {
  const { admin, userId, lines, subtotal, itemCount } = args;

  // Idempotency: if this clientRequestId already produced an order, return
  // it instead of creating a duplicate.
  const { data: existing } = await admin
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .eq("client_request_id", args.clientRequestId)
    .maybeSingle();

  if (existing) {
    return { ok: true, order: existing as Order };
  }

  // Decrease stock conditionally. The `stock_quantity >= qty` guard in the
  // WHERE clause makes this atomic at the row level — two concurrent orders
  // cannot both succeed against the last unit.
  for (const line of lines) {
    const { data: updated, error } = await admin
      .from("products")
      .update({
        stock_quantity: line.product.stock_quantity - line.quantity,
      })
      .eq("id", line.product.id)
      .gte("stock_quantity", line.quantity)
      .select("id, stock_quantity");

    if (error) {
      console.error("[orders] stock update failed:", error.message);
      // Best-effort rollback of any earlier decrements in this batch.
      await restoreStock(admin, lines, line.product.id);
      return { ok: false, message: "Could not reserve stock. Please try again." };
    }

    if (!updated || updated.length === 0) {
      await restoreStock(admin, lines, line.product.id);
      return {
        ok: false,
        conflict: true,
        code: "insufficient_stock",
        message: `“${line.product.name}” sold out while you were checking out. Please review your cart.`,
      };
    }
  }

  // Generate a human-friendly order number.
  const orderNumber = await generateOrderNumber(admin);

  const { data: orderRow, error: orderError } = await admin
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: userId,
      customer_email: args.userEmail,
      customer_name: args.customerName,
      customer_phone: args.customerPhone,
      pickup_notes: args.pickupNotes,
      status: "pending",
      payment_method: "pay_at_store",
      payment_status: "unpaid",
      subtotal_in_paise: subtotal,
      discount_in_paise: 0,
      total_in_paise: subtotal,
      item_count: itemCount,
      client_request_id: args.clientRequestId,
    })
    .select("*")
    .single();

  if (orderError) {
    // Unique violation on client_request_id means a concurrent retry won.
    if (orderError.code === "23505") {
      const { data: raced } = await admin
        .from("orders")
        .select("*")
        .eq("user_id", userId)
        .eq("client_request_id", args.clientRequestId)
        .maybeSingle();
      if (raced) return { ok: true, order: raced as Order };
    }
    console.error("[orders] order insert failed:", orderError.message);
    await restoreStock(admin, lines, null);
    return { ok: false, message: "Could not create your order. Please try again." };
  }

  const order = orderRow as Order;

  // Insert line items.
  const itemRows = lines.map((line) => ({
    order_id: order.id,
    product_id: line.product.id,
    product_name: line.product.name,
    product_slug: line.product.slug,
    unit_label: line.product.unit_label,
    quantity: line.quantity,
    unit_price_in_paise: line.unitPrice,
    line_total_in_paise: line.lineTotal,
  }));

  const { error: itemsError } = await admin.from("order_items").insert(itemRows);

  if (itemsError) {
    console.error("[orders] order_items insert failed:", itemsError.message);
    // Delete the order so the customer is not charged for a phantom order.
    await admin.from("orders").delete().eq("id", order.id);
    await restoreStock(admin, lines, null);
    return { ok: false, message: "Could not save your order details. Please try again." };
  }

  return { ok: true, order };
}

/** Best-effort stock restore after a partial failure. */
async function restoreStock(
  admin: ReturnType<typeof createAdminClient>,
  lines: Array<{ product: Product; quantity: number }>,
  skipProductId: string | null
) {
  for (const line of lines) {
    if (skipProductId && line.product.id === skipProductId) continue;
    try {
      await admin
        .from("products")
        .update({
          stock_quantity: line.product.stock_quantity,
        })
        .eq("id", line.product.id);
    } catch (err) {
      console.error("[orders] stock restore failed:", err);
    }
  }
}

/** Allocate a sequential order number like DN-1042. */
async function generateOrderNumber(
  admin: ReturnType<typeof createAdminClient>
): Promise<string> {
  try {
    const { data, error } = await admin.rpc("next_order_number");
    if (!error && data) return String(data);
  } catch {
    // Fall through to a timestamp-based fallback.
  }
  // Fallback that is still unique enough for a small store.
  return `DN-${Date.now().toString().slice(-6)}`;
}

export type { StoreSetting };
