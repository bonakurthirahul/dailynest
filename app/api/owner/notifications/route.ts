import { NextResponse } from "next/server";
import { requireOwnerApi, apiError } from "@/lib/auth/owner-api";
import type { Notification } from "@/lib/types";

// GET — list recent notifications (newest first)
export async function GET(request: Request) {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10) || 100, 500);

  try {
    const { data, error } = await auth.admin
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return apiError(error.message, "server_error", 500);
    return NextResponse.json({ notifications: (data ?? []) as Notification[] });
  } catch (err) {
    console.error("[owner/notifications] GET error:", err);
    return apiError("Could not load notifications.", "server_error", 500);
  }
}

// PATCH — mark one or all as read
export async function PATCH(request: Request) {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    // empty body = mark all read
  }

  try {
    if (body.all === true) {
      const { error } = await auth.admin
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);
      if (error) return apiError(error.message, "server_error", 500);
      return NextResponse.json({ ok: true });
    }

    const id = body.notificationId ?? body.id;
    if (typeof id !== "string" || id.length === 0) {
      return apiError("Provide notificationId or { all: true }.", "bad_request");
    }

    const { error } = await auth.admin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) return apiError(error.message, "server_error", 500);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[owner/notifications] PATCH error:", err);
    return apiError("Could not update notifications.", "server_error", 500);
  }
}

// DELETE — clear all notifications (or one via ?id=)
export async function DELETE(request: Request) {
  const auth = await requireOwnerApi();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  try {
    if (id) {
      const { error } = await auth.admin.from("notifications").delete().eq("id", id);
      if (error) return apiError(error.message, "server_error", 500);
    } else {
      const { error } = await auth.admin.from("notifications").delete().neq("id", "");
      if (error) return apiError(error.message, "server_error", 500);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[owner/notifications] DELETE error:", err);
    return apiError("Could not delete notifications.", "server_error", 500);
  }
}
