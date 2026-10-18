"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AccountHeader({
  fullName,
  email,
}: {
  fullName?: string | null;
  email?: string | null;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wider text-fresh">
          My account
        </p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal">
          {fullName || email || "Welcome"}
        </h1>
        {fullName && email && (
          <p className="mt-1 text-sm text-muted">{email}</p>
        )}
      </div>

      <button type="button" onClick={signOut} className="btn-ghost !py-2.5 text-sm">
        Sign out
      </button>
    </div>
  );
}
