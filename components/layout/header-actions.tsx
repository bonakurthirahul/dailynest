"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { CartButton } from "@/components/cart/cart-button";

// Client half of the public header: cart badge + account/auth affordance.
// Reads the live session so logged-out visitors see "Sign in" and logged-in
// customers see their account menu entry.
export function CustomerHeaderActions({
  isStoreOpen,
}: {
  isStoreOpen: boolean;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      if (cancelled) return;
      setUser(data.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled) setUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="flex items-center gap-2.5">
      {!isStoreOpen && (
        <span className="hidden items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Store closed
        </span>
      )}

      <CartButton />

      {loading ? (
        <span
          className="h-10 w-24 animate-pulse rounded-full bg-line/70"
          aria-hidden="true"
        />
      ) : user ? (
        <Link
          href="/account"
          className="btn-primary hidden !py-2 !px-4 text-sm sm:inline-flex"
        >
          My Account
        </Link>
      ) : (
        <Link
          href="/login"
          className="btn-primary hidden !py-2 !px-4 text-sm sm:inline-flex"
        >
          Sign in
        </Link>
      )}
    </div>
  );
}
