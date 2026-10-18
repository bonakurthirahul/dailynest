import type { Metadata } from "next";
import Image from "next/image";
import { getStoreSettings } from "@/lib/data";
import { PICKUP_IMAGE } from "@/lib/images";
import { PickupSteps } from "@/components/store/pickup-steps";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Store & pickup info",
  description:
    "DailyNest store address, opening hours, and how store pickup works. Order online, collect at the counter, pay by cash or UPI.",
};

export default async function StoreInfoPage() {
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-fresh">Visit us</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
          Store & pickup information
        </h1>
        <p className="mt-3 text-charcoal-soft">
          DailyNest is a pickup-only store. Order online, then collect your
          groceries at the counter at a time that suits you.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Store details */}
        <section className="card p-7">
          <h2 className="text-xl font-extrabold text-charcoal">
            {settings?.store_name ?? "DailyNest"}
          </h2>
          <p className="mt-1 text-sm text-muted">{settings?.tagline}</p>

          <dl className="mt-6 space-y-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-fresh">Address</dt>
              <dd className="mt-1.5 leading-relaxed text-charcoal-soft">
                {settings?.address ?? "Store address coming soon."}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-fresh">Opening hours</dt>
              <dd className="mt-1.5 leading-relaxed text-charcoal-soft">
                {settings?.opening_hours ?? "Coming soon."}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-fresh">Contact</dt>
              <dd className="mt-1.5 leading-relaxed text-charcoal-soft">
                {settings?.contact_phone ? (
                  <a href={`tel:${settings.contact_phone}`} className="font-semibold text-forest hover:underline">
                    {settings.contact_phone}
                  </a>
                ) : (
                  "Coming soon."
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-fresh">Availability</dt>
              <dd className="mt-1.5">
                <span
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-semibold ${
                    settings?.is_open
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      settings?.is_open ? "bg-emerald-500" : "bg-amber-500 animate-pulse-dot"
                    }`}
                  />
                  {settings?.is_open ? "Open for orders" : "Currently closed"}
                </span>
              </dd>
            </div>
          </dl>

          {settings?.pickup_instructions && (
            <div className="mt-6 rounded-xl border border-fresh/30 bg-fresh/8 p-4">
              <h3 className="text-sm font-bold text-forest">Pickup instructions</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-charcoal-soft">
                {settings.pickup_instructions}
              </p>
            </div>
          )}
        </section>

        {/* Image */}
        <div className="relative min-h-[18rem] overflow-hidden rounded-[1.5rem] shadow-soft">
          <Image
            src={PICKUP_IMAGE}
            alt="Groceries packed and ready for pickup at the counter"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-transparent to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-fresh-light">Pickup only</p>
            <p className="mt-1.5 text-lg font-bold leading-snug text-white">
              Your order is packed and waiting at the counter.
            </p>
          </div>
        </div>
      </div>

      <PickupSteps />
    </div>
  );
}
