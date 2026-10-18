import { NextResponse } from "next/server";
import { requireOwnerApi, apiError } from "@/lib/auth/owner-api";
import { notifyOwnerLowStock } from "@/lib/notify";
import type { Product } from "@/lib/types";

// ============================================================================
// /api/owner/products
//   GET    — list all products (including unavailable), with search
//   POST   — create a product
//   PATCH  — update a product (price, stock, availability, featured, etc.)
//   DELETE — remove a product
// ============================================================================

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function GET(request: Request) {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("q") ?? "").trim();
  const includeUnavailable = searchParams.get("all") !== "0";

  try {
    let query = auth.admin
      .from("products")
      .select("*, category:categories(*)")
      .order("name", { ascending: true })
      .limit(500);

    if (!includeUnavailable) query = query.eq("is_available", true);

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data } = await query;
    return NextResponse.json({ products: data ?? [] });
  } catch (err) {
    console.error("[owner/products] GET error:", err);
    return apiError("Could not load products.", "server_error", 500);
  }
}

export async function POST(request: Request) {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.", "bad_request");
  }

  const name = String(body.name ?? "").trim();
  if (name.length < 2) return apiError("Product name is required.", "invalid_name");

  const price = Math.round(Number(body.priceInPaise));
  if (!Number.isFinite(price) || price < 0) {
    return apiError("A valid price is required.", "invalid_price");
  }

  const discount =
    body.discountPriceInPaise == null || body.discountPriceInPaise === ""
      ? null
      : Math.round(Number(body.discountPriceInPaise));

  if (discount != null && discount >= price) {
    return apiError("Discount price must be lower than the regular price.", "invalid_discount");
  }

  const stock = Math.max(0, Math.round(Number(body.stockQuantity ?? 0)) || 0);
  const threshold = Math.max(
    0,
    Math.round(Number(body.lowStockThreshold ?? 10)) || 10
  );

  const slug = slugify(String(body.slug || name));
  if (!slug) return apiError("Could not generate a product slug.", "invalid_slug");

  // Ensure slug uniqueness.
  const { data: clash } = await auth.admin
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (clash) {
    return apiError("A product with a similar name already exists.", "slug_exists", 409);
  }

  try {
    const { data, error } = await auth.admin
      .from("products")
      .insert({
        name,
        slug,
        description: String(body.description ?? "").trim() || null,
        image_url: String(body.imageUrl ?? "").trim() || null,
        unit_label: String(body.unitLabel ?? "").trim() || null,
        category_id: body.categoryId ? String(body.categoryId) : null,
        price_in_paise: price,
        discount_price_in_paise: discount,
        stock_quantity: stock,
        low_stock_threshold: threshold,
        is_available: body.isAvailable !== false,
        is_featured: body.isFeatured === true,
      })
      .select("*, category:categories(*)")
      .single();

    if (error) return apiError(error.message, "server_error", 500);
    return NextResponse.json({ ok: true, product: data as Product }, { status: 201 });
  } catch (err) {
    console.error("[owner/products] POST error:", err);
    return apiError("Could not create the product.", "server_error", 500);
  }
}

export async function PATCH(request: Request) {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid request body.", "bad_request");
  }

  const productId = String(body.productId ?? "");
  if (!productId) return apiError("Missing productId.", "bad_request");

  const { data: existing } = await auth.admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .maybeSingle();

  if (!existing) return apiError("Product not found.", "not_found", 404);
  const current = existing as Product;

  const patch: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (name.length < 2) return apiError("Product name is too short.", "invalid_name");
    patch.name = name;
  }
  if (body.description !== undefined) {
    patch.description = String(body.description).trim() || null;
  }
  if (body.imageUrl !== undefined) {
    patch.image_url = String(body.imageUrl).trim() || null;
  }
  if (body.unitLabel !== undefined) {
    patch.unit_label = String(body.unitLabel).trim() || null;
  }
  if (body.categoryId !== undefined) {
    patch.category_id = body.categoryId ? String(body.categoryId) : null;
  }

  if (body.priceInPaise !== undefined) {
    const price = Math.round(Number(body.priceInPaise));
    if (!Number.isFinite(price) || price < 0) {
      return apiError("A valid price is required.", "invalid_price");
    }
    patch.price_in_paise = price;
  }

  if (body.discountPriceInPaise !== undefined) {
    const discount =
      body.discountPriceInPaise == null || body.discountPriceInPaise === ""
        ? null
        : Math.round(Number(body.discountPriceInPaise));
    const finalPrice =
      patch.price_in_paise !== undefined
        ? (patch.price_in_paise as number)
        : current.price_in_paise;
    if (discount != null && discount >= finalPrice) {
      return apiError(
        "Discount price must be lower than the regular price.",
        "invalid_discount"
      );
    }
    patch.discount_price_in_paise = discount;
  }

  if (body.stockQuantity !== undefined) {
    const stock = Math.max(0, Math.round(Number(body.stockQuantity)) || 0);
    patch.stock_quantity = stock;
  }

  if (body.lowStockThreshold !== undefined) {
    patch.low_stock_threshold = Math.max(
      0,
      Math.round(Number(body.lowStockThreshold)) || 0
    );
  }

  if (body.isAvailable !== undefined) patch.is_available = Boolean(body.isAvailable);
  if (body.isFeatured !== undefined) patch.is_featured = Boolean(body.isFeatured);

  try {
    const { data, error } = await auth.admin
      .from("products")
      .update(patch)
      .eq("id", productId)
      .select("*, category:categories(*)")
      .single();

    if (error) return apiError(error.message, "server_error", 500);

    // Low-stock alert if the update dropped stock to/below the threshold.
    const updated = data as Product;
    if (
      updated.stock_quantity <= (updated.low_stock_threshold ?? 10) &&
      current.stock_quantity > (current.low_stock_threshold ?? 10)
    ) {
      await notifyOwnerLowStock(updated.name, updated.stock_quantity);
    }

    return NextResponse.json({ ok: true, product: updated });
  } catch (err) {
    console.error("[owner/products] PATCH error:", err);
    return apiError("Could not update the product.", "server_error", 500);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const productId = searchParams.get("id");
  if (!productId) return apiError("Missing product id.", "bad_request");

  try {
    const { error } = await auth.admin.from("products").delete().eq("id", productId);
    if (error) return apiError(error.message, "server_error", 500);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[owner/products] DELETE error:", err);
    return apiError("Could not delete the product.", "server_error", 500);
  }
}
