import Link from "next/link";
import { Wordmark } from "@/components/brand/logo";
import { getStoreSettings } from "@/lib/data";

// Public site footer. Deliberately contains NO owner login link — the owner
// route is never published in navigation, footer, or sitemap.
export async function SiteFooter() {
  const settings = await getStoreSettings();

  const columns = [
    {
      heading: "Shop",
      links: [
        { href: "/shop", label: "All products" },
        { href: "/categories", label: "Categories" },
        { href: "/shop?featured=1", label: "Featured" },
        { href: "/shop?offers=1", label: "Offers & discounts" },
      ],
    },
    {
      heading: "Account",
      links: [
        { href: "/login", label: "Sign in" },
        { href: "/register", label: "Create account" },
        { href: "/account", label: "My account" },
        { href: "/account/orders", label: "Order history" },
      ],
    },
    {
      heading: "Help",
      links: [
        { href: "/store-info", label: "Store & pickup info" },
        { href: "/contact", label: "Contact us" },
        { href: "/track-order", label: "Track an order" },
      ],
    },
  ];

  return (
    <footer className="mt-20 border-t border-line bg-white">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-5 lg:px-8">
        <div className="lg:col-span-2">
          <Wordmark />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {settings?.tagline ??
              "Your Daily Needs, All in One Place."}{" "}
            Order online, collect at the store, and pay by cash or UPI at the
            counter. No delivery fees, no online payments — just fresh
            essentials, ready when you arrive.
          </p>

          <dl className="mt-6 space-y-2 text-sm text-charcoal-soft">
            <div>
              <dt className="sr-only">Address</dt>
              <dd>{settings?.address ?? "Store address coming soon."}</dd>
            </div>
            <div>
              <dt className="sr-only">Phone</dt>
              <dd>
                {settings?.contact_phone ? (
                  <a
                    href={`tel:${settings.contact_phone}`}
                    className="hover:text-forest"
                  >
                    {settings.contact_phone}
                  </a>
                ) : (
                  "Contact number coming soon."
                )}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Opening hours</dt>
              <dd>{settings?.opening_hours ?? "Opening hours coming soon."}</dd>
            </div>
          </dl>
        </div>

        {columns.map((col) => (
          <nav key={col.heading} aria-label={col.heading}>
            <h3 className="text-sm font-bold uppercase tracking-wider text-forest">
              {col.heading}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-charcoal-soft transition-colors hover:text-forest"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} DailyNest. Store pickup only · Pay at
            counter.
          </p>
          <p>Fresh essentials. Easy ordering. Convenient store pickup.</p>
        </div>
      </div>
    </footer>
  );
}
