import { NextResponse } from "next/server";
import { requireOwnerApi, apiError } from "@/lib/auth/owner-api";
import type { StoreSetting } from "@/lib/types";

// GET  — read store settings (public data, but written only by owner)
// PATCH — update store settings (owner only)
export async function GET() {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  try {
    const { data } = await auth.admin
      .from("store_settings")
      .select("*")
      .limit(1)
      .maybeSingle();
    return NextResponse.json({ settings: data ?? null });
  } catch (err) {
    console.error("[owner/settings] GET error:", err);
    return apiError("Could not load store settings.", "server_error", 500);
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

  const patch: Record<string, unknown> = {};

  if (body.storeName !== undefined) {
    const name = String(body.storeName).trim();
    if (name.length < 2) return apiError("Store name is too short.", "invalid_name");
    patch.store_name = name;
  }
  if (body.tagline !== undefined) patch.tagline = String(body.tagline).trim();
  if (body.address !== undefined) patch.address = String(body.address).trim();
  if (body.contactPhone !== undefined) {
    patch.contact_phone = String(body.contactPhone).trim();
  }
  if (body.contactEmail !== undefined) {
    patch.contact_email = String(body.contactEmail).trim() || null;
  }
  if (body.openingHours !== undefined) {
    patch.opening_hours = String(body.openingHours).trim();
  }
  if (body.pickupInstructions !== undefined) {
    patch.pickup_instructions = String(body.pickupInstructions).trim();
  }
  if (body.isOpen !== undefined) patch.is_open = Boolean(body.isOpen);

  if (Object.keys(patch).length === 0) {
    return apiError("Nothing to update.", "empty_patch");
  }

  try {
    const { data, error } = await auth.admin
      .from("store_settings")
      .update(patch)
      .eq("id", "00000000-0000-0000-0000-000000000000")
      .select("*")
      .maybeSingle();

    if (error) return apiError(error.message, "server_error", 500);
    return NextResponse.json({ ok: true, settings: data as StoreSetting });
  } catch (err) {
    console.error("[owner/settings] PATCH error:", err);
    return apiError("Could not update store settings.", "server_error", 500);
  }
}
