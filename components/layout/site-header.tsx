import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { getStoreSettings } from "@/lib/data";
import { CustomerHeaderActions } from "@/components/layout/header-actions";

// Public site header. Server Component so it can read live store settings
// and the viewer's session; the cart badge / auth buttons hydrate on the
// client via CustomerHeaderActions.
export async function SiteHeader() {
  const settings = await getStoreSettings();

  const nav = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/categories", label: "Categories" },
    { href: "/store-info", label: "Store Info" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="DailyNest home" className="shrink-0">
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3.5 py-2 text-[0.92rem] font-medium text-charcoal-soft transition-colors hover:bg-fresh/12 hover:text-forest"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <CustomerHeaderActions isStoreOpen={settings?.is_open ?? true} />
      </div>

      {/* Mobile nav */}
      <nav
        aria-label="Primary mobile"
        className="flex gap-1 overflow-x-auto border-t border-line px-4 py-2 lg:hidden"
      >
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium text-charcoal-soft"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
