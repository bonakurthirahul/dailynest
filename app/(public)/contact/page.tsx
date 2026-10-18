import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with DailyNest — phone, email, and store address.",
};

export default async function ContactPage() {
  const settings = await getStoreSettings();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
      <header className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-fresh">We&apos;re here to help</p>
        <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
          Contact DailyNest
        </h1>
        <p className="mx-auto mt-3 max-w-md text-charcoal-soft">
          Questions about an order, a product, or store pickup? Reach us
          directly and we&apos;ll get back to you.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-fresh/12 text-forest">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.4 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2Z" />
            </svg>
          </span>
          <h2 className="mt-4 font-bold text-charcoal">Phone</h2>
          {settings?.contact_phone ? (
            <a
              href={`tel:${settings.contact_phone}`}
              className="mt-1.5 block text-lg font-extrabold text-forest hover:underline"
            >
              {settings.contact_phone}
            </a>
          ) : (
            <p className="mt-1.5 text-sm text-muted">Coming soon.</p>
          )}
          <p className="mt-2 text-xs text-muted">Fastest for order questions.</p>
        </div>

        <div className="card p-6 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-fresh/12 text-forest">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 6h16v12H4zM4 7l8 6 8-6" />
            </svg>
          </span>
          <h2 className="mt-4 font-bold text-charcoal">Email</h2>
          {settings?.contact_email ? (
            <a
              href={`mailto:${settings.contact_email}`}
              className="mt-1.5 block text-lg font-extrabold text-forest hover:underline"
            >
              {settings.contact_email}
            </a>
          ) : (
            <p className="mt-1.5 text-sm text-muted">Coming soon.</p>
          )}
          <p className="mt-2 text-xs text-muted">For detailed or written requests.</p>
        </div>
      </div>

      <div className="card mt-6 p-7">
        <h2 className="text-lg font-extrabold text-charcoal">Store address</h2>
        <p className="mt-2 leading-relaxed text-charcoal-soft">
          {settings?.address ?? "Store address coming soon."}
        </p>
        <p className="mt-4 text-sm text-muted">
          Opening hours: {settings?.opening_hours ?? "Coming soon."}
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-fresh/30 bg-fresh/8 p-5 text-sm leading-relaxed text-forest">
        DailyNest supports store pickup only. There is no home delivery, and no
        payment is taken through this website — you pay by cash or UPI at the
        counter when you collect your order.
      </div>
    </div>
  );
}
