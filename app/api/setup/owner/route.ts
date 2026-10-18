import { NextResponse } from "next/server";
import { bootstrapOwner } from "@/lib/auth/owner-bootstrap";
import { createClient } from "@/lib/supabase/server";
import { OWNER_LOGIN_PATH } from "@/lib/auth/paths";

// ============================================================================
// POST /api/setup/owner
// ============================================================================
// Triggers the one-time, server-side owner bootstrap.
//
// SECURITY:
//  • Reads INITIAL_OWNER_EMAIL / INITIAL_OWNER_PASSWORD only on the server.
//  • Idempotent: refuses to overwrite an existing owner or reset a password.
//  • Requires the service-role key to be configured; otherwise fails loudly.
//  • Never returns the password or any auth secret.
//
// This endpoint is intentionally unauthenticated because it is the
// provisioning hook an operator runs once after deploying. It is safe to
// leave in place because it cannot create a second owner, cannot change an
// existing owner's password, and cannot be used to elevate a customer.
// ============================================================================

export async function POST() {
  try {
    // Guard: this only works when the server is fully configured.
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Server is missing SUPABASE_SERVICE_ROLE_KEY. Configure it first (see docs/SETUP.md).",
        },
        { status: 500 }
      );
    }

    // Extra guard: refuse to run if someone is already signed in as a
    // non-owner trying to grant themselves the role.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profile && profile.role !== "owner") {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Signed-in customers cannot run owner setup. Sign out and retry.",
          },
          { status: 403 }
        );
      }
    }

    const result = await bootstrapOwner();

    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.message, code: result.code },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      created: result.created,
      message: result.created
        ? `Owner account ready for ${result.email}.`
        : "Owner already provisioned.",
      loginPath: OWNER_LOGIN_PATH,
    });
  } catch (err) {
    console.error("[setup] unexpected error:", err);
    return NextResponse.json(
      { ok: false, error: "Setup failed unexpectedly. Check server logs." },
      { status: 500 }
    );
  }
}
