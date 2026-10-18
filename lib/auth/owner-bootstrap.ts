import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types";

// ============================================================================
// Owner bootstrap
// ============================================================================
// Creates (or finds) the single store-owner account using server-side
// environment variables. This is the ONLY path by which the owner role is
// ever granted — customers can never self-promote.
//
// Design goals:
//  • IDEMPOTENT — safe to run on every cold start; never overwrites an
//    existing owner, never resets a password that has already been changed.
//  • NO SECRETS IN THE REPO — reads INITIAL_OWNER_EMAIL / INITIAL_OWNER_PASSWORD
//    at runtime from the server environment only.
//  • FAIL LOUD — if credentials are missing, the caller gets a clear,
//    actionable error instead of a silently insecure account.
// ============================================================================

export type BootstrapResult =
  | { ok: true; created: boolean; email: string }
  | { ok: false; code: "not_configured" | "invalid_config" | "error"; message: string };

export async function bootstrapOwner(): Promise<BootstrapResult> {
  const email = (process.env.INITIAL_OWNER_EMAIL ?? "").trim();
  const password = process.env.INITIAL_OWNER_PASSWORD ?? "";

  if (!email || !password) {
    return {
      ok: false,
      code: "not_configured",
      message:
        "Owner bootstrap is not configured. Set INITIAL_OWNER_EMAIL and " +
        "INITIAL_OWNER_PASSWORD on the server (see docs/SETUP.md), then retry. " +
        "No owner account was created.",
    };
  }

  if (!email.includes("@") || password.length < 12) {
    return {
      ok: false,
      code: "invalid_config",
      message:
        "Owner bootstrap credentials look invalid. INITIAL_OWNER_EMAIL must be " +
        "a valid email and INITIAL_OWNER_PASSWORD must be at least 12 characters.",
    };
  }

  const admin = createAdminClient();

  // 1. Does an owner already exist? If so, do nothing (idempotent).
  const { data: existingOwners, error: ownerQueryError } = await admin
    .from("profiles")
    .select("id, role")
    .eq("role", "owner")
    .limit(1);

  if (ownerQueryError) {
    return {
      ok: false,
      code: "error",
      message: `Could not verify existing owner accounts: ${ownerQueryError.message}`,
    };
  }

  if (existingOwners && existingOwners.length > 0) {
    // Owner already provisioned — never recreate or reset.
    return { ok: true, created: false, email };
  }

  // 2. Check whether a user with this email already exists (e.g. signed up
  //    as a customer). We must NOT silently elevate an arbitrary account.
  const { data: byEmail } = await admin.auth.admin.listUsers();
  const matching = byEmail?.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let userId: string;

  if (matching) {
    // An account exists but is not the owner. Only elevate it if it is
    // currently un-owned AND we are explicitly bootstrapping — this is the
    // deliberate, one-time provisioning act by the operator.
    userId = matching.id;
  } else {
    // 3. Create the owner auth user.
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Store Owner" },
    });

    if (createError || !created.user) {
      return {
        ok: false,
        code: "error",
        message: `Could not create the owner account: ${createError?.message ?? "unknown error"}`,
      };
    }

    userId = created.user.id;
  }

  // 4. Grant the owner role + a starting credit balance. This uses the
  //    service role, which is the only caller permitted by the profiles RLS
  //    policy to insert a non-customer. Top up later via
  //    POST /api/internal/owner-credits (see docs/SETUP.md) or SQL.
  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      role: "owner",
      full_name: "Store Owner",
      credits: initialOwnerCredits(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    return {
      ok: false,
      code: "error",
      message: `Could not assign the owner role: ${profileError.message}`,
    };
  }

  return { ok: true, created: true, email };
}

/** True when bootstrap env vars are present (used to guide the setup page). */
export function isOwnerBootstrapConfigured(): boolean {
  return Boolean(
    (process.env.INITIAL_OWNER_EMAIL ?? "").trim() && process.env.INITIAL_OWNER_PASSWORD
  );
}

/**
 * Starting credit balance granted to the owner on first bootstrap.
 * Override with INITIAL_OWNER_CREDITS (default 100).
 */
export function initialOwnerCredits(): number {
  const parsed = Number.parseInt(process.env.INITIAL_OWNER_CREDITS ?? "", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 100;
}

/** Read-only status for the setup page — never returns the password. */
export async function getOwnerStatus(): Promise<{
  configured: boolean;
  ownerExists: boolean;
  ownerProfile: Profile | null;
}> {
  const configured = isOwnerBootstrapConfigured();

  if (!hasServiceRoleSafe()) {
    return { configured, ownerExists: false, ownerProfile: null };
  }

  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("profiles")
      .select("*")
      .eq("role", "owner")
      .limit(1);
    const owner = (data?.[0] as Profile | undefined) ?? null;
    return { configured, ownerExists: Boolean(owner), ownerProfile: owner };
  } catch {
    return { configured, ownerExists: false, ownerProfile: null };
  }
}

function hasServiceRoleSafe(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}
