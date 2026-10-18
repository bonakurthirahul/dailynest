"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Minimal client-side sign-out used outside the owner shell. */
export function SignOutButton({
  loginPath,
  label = "Sign out",
}: {
  loginPath: string;
  label?: string;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(loginPath);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-muted transition-colors hover:border-danger hover:text-danger"
    >
      {label}
    </button>
  );
}
