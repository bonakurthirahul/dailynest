import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getOwnerStatus, isOwnerBootstrapConfigured } from "@/lib/auth/owner-bootstrap";
import { SetupPanel } from "@/components/owner/setup-panel";
import { OWNER_DASHBOARD_PATH, OWNER_LOGIN_PATH } from "@/lib/auth/paths";

export const dynamic = "force-dynamic";

// Not indexed; not in sitemap. This page is an operator convenience for the
// one-time owner bootstrap — it is not linked from anywhere public.
export const metadata: Metadata = {
  title: "Owner setup",
  robots: { index: false, follow: false },
};

export default async function OwnerSetupPage() {
  let signedInUserId: string | null = null;

  // If an owner is already signed in, send them to the dashboard.
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      signedInUserId = user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.role === "owner") redirect(OWNER_DASHBOARD_PATH);
    }
  }

  const status = await getOwnerStatus();
  const configured = isOwnerBootstrapConfigured();

  // Already provisioned -> point to login instead of exposing setup.
  if (status.ownerExists && !signedInUserId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-charcoal px-4 py-12">
        <div className="w-full max-w-md rounded-[1.25rem] bg-white p-8 text-center shadow-lift">
          <h1 className="text-xl font-extrabold text-charcoal">Owner already configured</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            A store owner account already exists. For security, setup is locked.
            Use the private owner login instead.
          </p>
          <a href={OWNER_LOGIN_PATH} className="btn-primary mt-6 inline-flex">
            Go to owner login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-charcoal px-4 py-12">
      <SetupPanel configured={configured} ownerExists={status.ownerExists} />
    </div>
  );
}
