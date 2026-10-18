import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/session";
import {
  CUSTOMER_LOGIN_PATH,
  OWNER_DASHBOARD_PATH,
  OWNER_LOGIN_PATH,
} from "@/lib/auth/paths";
import { hasSufficientOwnerCredits, OWNER_MIN_CREDITS } from "@/lib/auth/credits";
import { SignOutButton } from "@/components/owner/sign-out-button";
import { Wordmark } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Credits required",
  robots: { index: false, follow: false },
};

// Shown when a verified owner's credit balance has dropped below the
// minimum required for dashboard access. requireOwner() and the owner API
// both redirect/403 here; the login page routes here after sign-in too.
export default async function OwnerOutOfCreditsPage() {
  const { user, profile } = await getSessionContext();

  if (!user) {
    redirect(OWNER_LOGIN_PATH);
  }

  if (profile?.role !== "owner") {
    redirect(CUSTOMER_LOGIN_PATH);
  }

  // Balance restored (e.g. credits were topped up in another tab) — resume.
  if (hasSufficientOwnerCredits(profile.credits)) {
    redirect(OWNER_DASHBOARD_PATH);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-charcoal px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="flex justify-center">
          <Link href="/" aria-label="DailyNest home">
            <Wordmark tone="light" />
          </Link>
        </div>

        <div className="mt-8 rounded-[1.25rem] bg-white p-8 shadow-lift">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
              </svg>
            </span>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-charcoal">
                Credits required
              </h1>
              <p className="text-xs text-muted">Owner dashboard access is paused</p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">
              Your credit balance is {profile.credits ?? 0}. At least{" "}
              {OWNER_MIN_CREDITS} credit{OWNER_MIN_CREDITS === 1 ? "" : "s"}{" "}
              is required to use the store control dashboard.
            </p>
            <p className="mt-2">
              Top up your balance, then reload this page — you are still signed
              in as {user.email ?? "the owner"}.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <Link
              href={OWNER_DASHBOARD_PATH}
              className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-forest/90"
            >
              I have topped up — retry
            </Link>
            <SignOutButton loginPath={OWNER_LOGIN_PATH} />
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/50">
          This page is not published in the public site, sitemap, or search.
        </p>
      </div>
    </div>
  );
}
