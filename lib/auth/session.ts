import "server-only";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/types";
import { CUSTOMER_LOGIN_PATH, OWNER_LOGIN_PATH, OWNER_OUT_OF_CREDITS_PATH } from "@/lib/auth/paths";
import { hasSufficientOwnerCredits } from "@/lib/auth/credits";

export {
  OWNER_LOGIN_PATH,
  OWNER_DASHBOARD_PATH,
  CUSTOMER_LOGIN_PATH,
  OWNER_SETUP_PATH,
} from "@/lib/auth/paths";

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface SessionContext {
  user: AuthUser | null;
  profile: Profile | null;
}

/**
 * Fetch the authenticated user (if any) and their profile row.
 * Runs on the server only. RLS on `profiles` restricts customers to their
 * own row; the owner row is only readable by the owner themselves and by
 * server-side privileged queries.
 */
export async function getSessionContext(): Promise<SessionContext> {
  if (!isSupabaseConfigured()) return { user: null, profile: null };
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user: { id: user.id, email: user.email ?? null },
    profile: (profileRow as Profile | null) ?? null,
  };
}

export async function getRole(): Promise<UserRole | null> {
  const { profile } = await getSessionContext();
  return profile?.role ?? null;
}

export async function isOwner(): Promise<boolean> {
  return (await getRole()) === "owner";
}

export async function requireCustomer(): Promise<{ user: AuthUser; profile: Profile | null }> {
  const { user, profile } = await getSessionContext();
  if (!user) {
    redirect(CUSTOMER_LOGIN_PATH);
  }
  return { user, profile };
}

/**
 * Gate an owner Server Component / Route Handler.
 *
 * - Unauthenticated visitor      -> redirect to owner login.
 * - Authenticated non-owner      -> redirect to the customer login (safe
 *                                   redirect, never the owner dashboard).
 * - Owner                        -> proceeds.
 *
 * NOTE: This is the *server-side* enforcement layer. The hidden URL is only
 * obscurity; this check (plus RLS in the DB) is the actual security.
 */
export async function requireOwner(): Promise<{ user: AuthUser; profile: Profile }> {
  const { user, profile } = await getSessionContext();

  if (!user) {
    redirect(OWNER_LOGIN_PATH);
  }

  if (profile?.role !== "owner") {
    // A normal customer must never see owner content. Send them somewhere
    // safe rather than leaking that the route exists.
    redirect(CUSTOMER_LOGIN_PATH);
  }

  // Credits gate: the owner must hold a positive balance to use the
  // dashboard. See 00003_owner_credits.sql and lib/auth/credits.ts.
  if (!hasSufficientOwnerCredits(profile.credits)) {
    redirect(OWNER_OUT_OF_CREDITS_PATH);
  }

  return { user, profile: profile as Profile };
}
