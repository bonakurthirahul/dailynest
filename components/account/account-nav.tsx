"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Order history" },
  { href: "/account/profile", label: "Profile" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Account" className="flex gap-1 overflow-x-auto border-b border-line">
      {NAV.map((item) => {
        const active =
          item.href === "/account"
            ? pathname === "/account"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
              active
                ? "border-forest text-forest"
                : "border-transparent text-muted hover:text-charcoal"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
