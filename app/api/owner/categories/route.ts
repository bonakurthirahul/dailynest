import { NextResponse } from "next/server";
import { requireOwnerApi, apiError } from "@/lib/auth/owner-api";
import type { Category } from "@/lib/types";

// ============================================================================
// /api/owner/categories
//   GET    — list all categories (including inactive)
//   POST   — create a category
//   PATCH  — update a category
//   DELETE — remove a category (products keep existing, category_id nulls)
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

export async function GET() {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  try {
    const { data } = await auth.admin
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });
    return NextResponse.json({ categories: data ?? [] });
  } catch (err) {
    console.error("[owner/categories] GET error:", err);
    return apiError("Could not load categories.", "server_error", 500);
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
  if (name.length < 2) return apiError("Category name is required.", "invalid_name");

  const slug = slugify(String(body.slug || name));
  if (!slug) return apiError("Could not generate a category slug.", "invalid_slug");

  const { data: clash } = await auth.admin
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (clash) return apiError("A category with this name already exists.", "slug_exists", 409);

  try {
    const { data, error } = await auth.admin
      .from("categories")
      .insert({
        name,
        slug,
        description: String(body.description ?? "").trim() || null,
        image_url: String(body.imageUrl ?? "").trim() || null,
        sort_order: Math.round(Number(body.sortOrder ?? 0)) || 0,
        is_active: body.isActive !== false,
      })
      .select("*")
      .single();

    if (error) return apiError(error.message, "server_error", 500);
    return NextResponse.json({ ok: true, category: data as Category }, { status: 201 });
  } catch (err) {
    console.error("[owner/categories] POST error:", err);
    return apiError("Could not create the category.", "server_error", 500);
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

  const categoryId = String(body.categoryId ?? "");
  if (!categoryId) return apiError("Missing categoryId.", "bad_request");

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) patch.name = String(body.name).trim();
  if (body.description !== undefined) {
    patch.description = String(body.description).trim() || null;
  }
  if (body.imageUrl !== undefined) patch.image_url = String(body.imageUrl).trim() || null;
  if (body.sortOrder !== undefined) patch.sort_order = Math.round(Number(body.sortOrder)) || 0;
  if (body.isActive !== undefined) patch.is_active = Boolean(body.isActive);

  try {
    const { data, error } = await auth.admin
      .from("categories")
      .update(patch)
      .eq("id", categoryId)
      .select("*")
      .single();

    if (error) return apiError(error.message, "server_error", 500);
    return NextResponse.json({ ok: true, category: data as Category });
  } catch (err) {
    console.error("[owner/categories] PATCH error:", err);
    return apiError("Could not update the category.", "server_error", 500);
  }
}

export async function DELETE(request: Request) {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(request.url);
  const categoryId = searchParams.get("id");
  if (!categoryId) return apiError("Missing category id.", "bad_request");

  try {
    const { error } = await auth.admin
      .from("categories")
      .delete()
      .eq("id", categoryId);
    if (error) return apiError(error.message, "server_error", 500);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[owner/categories] DELETE error:", err);
    return apiError("Could not delete the category.", "server_error", 500);
  }
}
