"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-context";

export function CartButton() {
  const { itemCount, ready } = useCart();
  // Avoid a hydration flash by rendering a stable shell until hydrated.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration-safe mount flag
    setMounted(true);
  }, []);

  const count = mounted && ready ? itemCount : 0;

  return (
    <Link
      href="/cart"
      aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-white text-charcoal transition-colors hover:border-forest hover:text-forest"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.55L21 8H6" />
        <circle cx="10" cy="20" r="1.4" />
        <circle cx="17.5" cy="20" r="1.4" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-forest px-1 text-[0.68rem] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
