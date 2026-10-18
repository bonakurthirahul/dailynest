// ============================================================================
// Owner credits gate — shared, pure logic (safe for client AND server).
// ============================================================================
// The store owner must hold at least OWNER_MIN_CREDITS to use the owner
// dashboard and /api/owner/*. Enforced in:
//   • middleware.ts                    (UX redirect)
//   • lib/auth/session.ts requireOwner (server boundary)
//   • lib/auth/owner-api.ts            (API boundary)
//   • app/store-control-7x9/login      (login form)
// ============================================================================

/** Minimum credit balance required for owner (admin) access. */
export const OWNER_MIN_CREDITS = 1;

/**
 * True when the owner has enough credits to use the dashboard.
 *
 * Graceful degradation: if `credits` is not a number at all (the
 * 00003_owner_credits.sql migration has not been applied yet, so the column
 * does not exist), we fail OPEN to avoid locking operators out on deploy.
 * Once the column exists, an insufficient balance fails CLOSED.
 */
export function hasSufficientOwnerCredits(credits: number | null | undefined): boolean {
  if (typeof credits !== "number") return true;
  return credits >= OWNER_MIN_CREDITS;
}
