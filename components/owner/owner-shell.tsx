"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { LogoMark } from "@/components/brand/logo";
import { OwnerNotificationBell } from "@/components/owner/notification-bell";

const NAV = [
  {
    href: "/store-control-7x9/dashboard",
    label: "Overview",
    icon: (
      <path d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z" />
    ),
  },
  {
    href: "/store-control-7x9/dashboard/orders",
    label: "Orders",
    icon: (
      <path d="M8 4h8a2 2 0 0 1 2 2v14l-6-3-6 3V6a2 2 0 0 1 2-2Z" />
    ),
  },
  {
    href: "/store-control-7x9/dashboard/products",
    label: "Products",
    icon: (
      <path d="M20 7 9 18l-5-5" />
    ),
  },
  {
    href: "/store-control-7x9/dashboard/categories",
    label: "Categories",
    icon: <path d="M4 6h16M4 12h16M4 18h10" />,
  },
  {
    href: "/store-control-7x9/dashboard/inventory",
    label: "Inventory",
    icon: (
      <path d="M20 7 12 3 4 7v10l8 4 8-4V7Zm0 0-8 4m0 0L4 7m8 4v10" />
    ),
  },
  {
    href: "/store-control-7x9/dashboard/notifications",
    label: "Notifications",
    icon: (
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    ),
  },
  {
    href: "/store-control-7x9/dashboard/settings",
    label: "Settings",
    icon: (
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7.5 7.5 0 0 0-1.7-1L15 3H9l-.3 2.6a7.5 7.5 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7.4 7.4 0 0 0 0 2l-2 1.5 2 3.4 2.3-1c.5.4 1.1.7 1.7 1L9 21h6l.3-2.6c.6-.3 1.2-.6 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" />
    ),
  },
];

export function OwnerShell({
  children,
  ownerName,
  credits,
}: {
  children: React.ReactNode;
  ownerName?: string | null;
  ownerEmail?: string;
  credits?: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close drawer on route change
    setMobileOpen(false);
  }, [pathname]);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/store-control-7x9/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-ivory-dark">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-line bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[72px] items-center gap-2.5 border-b border-line px-5">
          <LogoMark className="h-8 w-8" />
          <div className="leading-tight">
            <p className="font-heading text-base font-extrabold text-charcoal">DailyNest</p>
            <p className="text-[0.62rem] font-semibold uppercase tracking-wider text-fresh">
              Store control
            </p>
          </div>
        </div>

        <nav aria-label="Owner dashboard" className="flex flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active =
              item.href === "/store-control-7x9/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-forest text-white shadow-sm"
                    : "text-charcoal-soft hover:bg-fresh/10 hover:text-forest"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {item.icon}
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute inset-x-0 bottom-0 border-t border-line p-4">
          <p className="truncate text-sm font-semibold text-charcoal">
            {ownerName ?? "Store Owner"}
          </p>
          {typeof credits === "number" && (
            <p
              className={`mt-1 text-xs font-semibold ${
                credits <= 0 ? "text-danger" : "text-fresh"
              }`}
            >
              Credits: {credits}
            </p>
          )}
          <button
            type="button"
            onClick={signOut}
            className="mt-2 w-full rounded-xl border border-line px-3 py-2 text-sm font-semibold text-muted transition-colors hover:border-danger hover:text-danger"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-charcoal/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-[72px] items-center justify-between gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-charcoal-soft lg:hidden"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-fresh">
                Owner dashboard
              </p>
              <p className="font-heading font-bold text-charcoal">Store control</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <OwnerNotificationBell />
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1.5 rounded-full border border-line px-3.5 py-2 text-sm font-semibold text-charcoal-soft transition-colors hover:border-forest hover:text-forest sm:inline-flex"
            >
              View store
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M8 4H4v12h12v-4M12 4h4v4M16 4l-7 7" />
              </svg>
            </Link>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
