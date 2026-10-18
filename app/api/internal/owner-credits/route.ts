import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// ============================================================================
// POST /api/internal/owner-credits
// ============================================================================
// Sets or tops up the owner's credit balance. The owner dashboard and
// /api/owner/* are gated on this balance (see lib/auth/credits.ts).
//
// SECURITY:
//  • Requires the OWNER_CREDITS_API_KEY env var on the server, sent as
//    `Authorization: Bearer <key>`. If the env var is unset the endpoint
//    is disabled (503) — it can never be used anonymously.
//  • Uses the service-role client (the only writer of the credits column,
//    enforced by column-level grants in 00003_owner_credits.sql).
//
// Body (JSON):
//   { "email": "owner@store.com", "credits": 250 }   → set absolute balance
//   { "email": "owner@store.com", "add": 100 }       → increment balance
// ============================================================================

export async function POST(request: Request) {
  try {
    const apiKey = (process.env.OWNER_CREDITS_API_KEY ?? "").trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Credits API is disabled. Set OWNER_CREDITS_API_KEY on the server first.",
        },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get("authorization") ?? "";
    if (authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { ok: false, error: "Invalid API key." },
        { status: 401 }
      );
    }

    let body: { email?: unknown; credits?: unknown; add?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Request body must be valid JSON." },
        { status: 400 }
      );
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { ok: false, error: "A valid owner email is required." },
        { status: 400 }
      );
    }

    const hasCredits = body.credits !== undefined;
    const hasAdd = body.add !== undefined;
    if (hasCredits === hasAdd) {
      return NextResponse.json(
        { ok: false, error: 'Provide exactly one of "credits" (set) or "add" (increment).' },
        { status: 400 }
      );
    }

    const amount = Number(hasCredits ? body.credits : body.add);
    if (!Number.isInteger(amount) || amount < 0) {
      return NextResponse.json(
        { ok: false, error: "Amount must be a non-negative integer." },
        { status: 400 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { ok: false, error: "Server is missing SUPABASE_SERVICE_ROLE_KEY." },
        { status: 500 }
      );
    }

    const admin = createAdminClient();

    // Resolve the owner's user id from their email (service-role only).
    const { data: users, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json(
        { ok: false, error: `Could not list users: ${listError.message}` },
        { status: 500 }
      );
    }

    const target = users?.users.find(
      (u) => u.email?.toLowerCase() === email
    );
    if (!target) {
      return NextResponse.json(
        { ok: false, error: `No account found for ${email}.` },
        { status: 404 }
      );
    }

    // Confirm the account is the owner before touching credits.
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role, credits")
      .eq("id", target.id)
      .maybeSingle();

    if (!profile || profile.role !== "owner") {
      return NextResponse.json(
        { ok: false, error: `${email} is not an owner account.` },
        { status: 403 }
      );
    }

    const nextCredits = hasAdd
      ? (profile.credits ?? 0) + amount
      : amount;

    const { data: updated, error: updateError } = await admin
      .from("profiles")
      .update({ credits: nextCredits })
      .eq("id", target.id)
      .select("credits")
      .single();

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: `Could not update credits: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      email,
      previousCredits: profile.credits ?? 0,
      credits: updated.credits,
    });
  } catch (err) {
    console.error("[owner-credits] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Credits update failed unexpectedly. Check server logs." },
      { status: 500 }
    );
  }
}
