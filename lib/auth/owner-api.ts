import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasSufficientOwnerCredits } from "@/lib/auth/credits";
import type { Profile } from "@/lib/types";

// ============================================================================
// Owner API authorization
// ============================================================================
// Every owner-only Route Handler MUST call requireOwnerApi() before doing
// anything privileged. It returns either a clear 401/403 Response (to send
// straight back) or the verified owner context including the privileged
// service-role client.
//
// This is the server-side boundary that makes hidden URLs irrelevant: even a
// customer who guesses /api/owner/* gets a 403, because the session's role
// is checked here — not on the client.
// ============================================================================

export type OwnerApiContext =
  | { ok: true; userId: string; profile: Profile; admin: ReturnType<typeof createAdminClient> }
  | { ok: false; response: Response };

export async function requireOwnerApi(): Promise<OwnerApiContext> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: Response.json(
        { error: "Authentication required.", code: "unauthenticated" },
        { status: 401 }
      ),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || (profile as Profile).role !== "owner") {
    return {
      ok: false,
      response: Response.json(
        { error: "You are not authorised to perform this action.", code: "forbidden" },
        { status: 403 }
      ),
    };
  }

  // Credits gate: an owner without a sufficient balance may not use the API.
  if (!hasSufficientOwnerCredits((profile as Profile).credits)) {
    return {
      ok: false,
      response: Response.json(
        {
          error: "Insufficient credits. Top up your owner credits to continue.",
          code: "insufficient_credits",
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true,
    userId: user.id,
    profile: profile as Profile,
    admin: createAdminClient(),
  };
}

/** Standard JSON error helper. */
export function apiError(error: string, code: string, status = 400): Response {
  return Response.json({ error, code }, { status });
}
