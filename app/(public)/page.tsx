import Image from "next/image";
import Link from "next/link";
import { getCategories, getFeaturedProducts, getProducts, getStoreSettings } from "@/lib/data";
import { ProductCard } from "@/components/product/product-card";
import { HERO_IMAGE, STORY_IMAGE, OFFERS_IMAGE, CATEGORY_IMAGES, CATEGORY_FALLBACK_IMAGE } from "@/lib/images";
import { HomeOffers } from "@/components/home/offers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featured, essentials, settings] = await Promise.all([
    getCategories(),
    getFeaturedProducts(8),
    getProducts({ limit: 8 }),
    getStoreSettings(),
  ]);

  const offers = essentials.filter((p) => p.discount_price_in_paise != null).slice(0, 4);

  return (
    <div className="animate-fade-up">
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden bg-ivory">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-2 lg:gap-8 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="relative z-10 max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-fresh/40 bg-fresh/12 px-3.5 py-1.5 text-[0.78rem] font-semibold text-forest">
              <span className="h-1.5 w-1.5 rounded-full bg-fresh" />
              Fresh essentials · Easy ordering · Store pickup
            </span>

            <h1 className="mt-5 text-[2.6rem] font-extrabold leading-[1.05] tracking-tight text-charcoal sm:text-5xl lg:text-[3.4rem]">
              Your Daily Needs,
              <br />
              <span className="text-forest">All in One Place.</span>
            </h1>

            <p className="mt-5 max-w-lg text-[1.05rem] leading-relaxed text-charcoal-soft">
              Skip the queue. Browse fresh groceries from your neighbourhood
              kirana store, place your order online, and collect it ready-packed
              at the counter. Pay by cash or UPI when you pick up.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/shop" className="btn-primary !px-7 !py-3.5 text-base">
                Shop Now
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 10h12M11 5l5 5-5 5" />
                </svg>
              </Link>
              <Link href="/store-info" className="btn-ghost !px-6 !py-3.5 text-base">
                How pickup works
              </Link>
            </div>

            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Delivery</dt>
                <dd className="mt-1 text-sm font-bold text-charcoal">Store pickup only</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Payment</dt>
                <dd className="mt-1 text-sm font-bold text-charcoal">Cash or UPI</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-muted">Waiting</dt>
                <dd className="mt-1 text-sm font-bold text-charcoal">Ready when you arrive</dd>
              </div>
            </dl>
          </div>

          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-lift lg:aspect-square">
              <Image
                src={HERO_IMAGE}
                alt="Fresh vegetables and groceries arranged at a market stall"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-forest/25 via-transparent to-transparent" />
            </div>

            {/* Floating card */}
            <div className="absolute -bottom-6 left-4 max-w-[16rem] rounded-2xl border border-line bg-white/95 p-4 shadow-lift backdrop-blur sm:left-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-fresh/15 text-forest">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 7 9 18l-5-5" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-bold text-charcoal">Order reserved</p>
                  <p className="text-xs text-muted">Collect at the counter · Pay in store</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================= CATEGORIES ========================= */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-fresh">Shop by category</p>
            <h2 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
              Everyday aisles, organised
            </h2>
          </div>
          <Link href="/categories" className="text-sm font-semibold text-forest hover:underline">
            View all categories →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.slice(0, 10).map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-line bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="relative aspect-[5/4] overflow-hidden">
                <Image
                  src={CATEGORY_IMAGES[cat.slug] ?? CATEGORY_FALLBACK_IMAGE}
                  alt={cat.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/55 to-transparent" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="text-[0.82rem] font-bold leading-tight text-white drop-shadow-sm">
                  {cat.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ========================= FEATURED ========================= */}
      {featured.length > 0 && (
        <section className="bg-white">
          <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-fresh">Handpicked</p>
                <h2 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
                  Featured this week
                </h2>
              </div>
              <Link href="/shop?featured=1" className="text-sm font-semibold text-forest hover:underline">
                See all featured →
              </Link>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================== OFFERS =========================== */}
      <HomeOffers offers={offers} />

      {/* ====================== HOW PICKUP WORKS ===================== */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-fresh">Simple by design</p>
          <h2 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
            How store pickup works
          </h2>
          <p className="mt-3 text-charcoal-soft">
            No delivery vans, no surge fees, no online card payments. Just fresh
            groceries, packed and waiting when you walk in.
          </p>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              step: "1",
              title: "Fill your basket",
              body: "Browse the catalogue, search for what you need, and add items to your cart. Stock levels are shown live.",
              icon: (
                <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.55L21 8H6M10 20h.01M17 20h.01" />
              ),
            },
            {
              step: "2",
              title: "Place your order online",
              body: "Confirm with your name and phone. Your order is reserved against live stock and you get an order number.",
              icon: (
                <path d="M9 12h6M9 16h6M8 3h8a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
              ),
            },
            {
              step: "3",
              title: "Collect & pay in store",
              body: "Show your order number at the counter, pay by cash or UPI, and take your groceries home. No delivery fee.",
              icon: (
                <path d="M20 7 9 18l-5-5M4 7v10a2 2 0 0 0 2 2h12" />
              ),
            },
          ].map((item) => (
            <li key={item.step} className="card relative p-6">
              <span className="absolute right-5 top-5 text-5xl font-extrabold text-fresh/20" aria-hidden="true">
                {item.step}
              </span>
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-fresh/12 text-forest">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {item.icon}
                </svg>
              </span>
              <h3 className="mt-4 text-lg font-bold text-charcoal">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
            </li>
          ))}
        </ol>

        <p className="mt-8 rounded-2xl border border-fresh/30 bg-fresh/8 px-5 py-4 text-sm font-medium text-forest">
          Your order is reserved for store pickup. Pay by cash or UPI at the
          counter when you collect it.
        </p>
      </section>

      {/* ========================= BRAND STORY ======================= */}
      <section className="bg-white">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-20">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] shadow-lift">
            <Image
              src={STORY_IMAGE}
              alt="A neighbourhood grocery store with stocked shelves"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-fresh">Our story</p>
            <h2 className="mt-1.5 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
              A modern front for a trusted kirana
            </h2>
            <p className="mt-4 leading-relaxed text-charcoal-soft">
              DailyNest started with a simple observation: the neighbourhood
              kirana store already has the freshest produce and the friendliest
              service — it just needed a modern way to take orders.
            </p>
            <p className="mt-4 leading-relaxed text-charcoal-soft">
              We keep everything you already love about shopping local: real
              people, fair prices, and groceries you can inspect before you pay.
              What we add is the convenience of ordering ahead, so your basket is
              packed and waiting when you arrive.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "No delivery fees or surge pricing",
                "No online payments or card details stored",
                "Stock updated in real time by the store",
              ].map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-charcoal-soft">
                  <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-fresh" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0l-3.5-3.5a1 1 0 1 1 1.4-1.4l2.8 2.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
                  </svg>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ======================== STORE INFO ========================= */}
      <section className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="card p-7 lg:col-span-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-charcoal">
              Visit {settings?.store_name ?? "DailyNest"}
            </h2>
            <p className="mt-2 text-charcoal-soft">{settings?.tagline}</p>
            <dl className="mt-6 grid gap-5 sm:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-fresh">Address</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-charcoal-soft">
                  {settings?.address ?? "Add your store address in the owner dashboard."}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-fresh">Opening hours</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-charcoal-soft">
                  {settings?.opening_hours ?? "Coming soon."}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-fresh">Contact</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-charcoal-soft">
                  {settings?.contact_phone ? (
                    <a href={`tel:${settings.contact_phone}`} className="hover:text-forest">
                      {settings.contact_phone}
                    </a>
                  ) : (
                    "Coming soon."
                  )}
                </dd>
              </div>
            </dl>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/store-info" className="btn-ghost">Store & pickup info</Link>
              <Link href="/contact" className="btn-ghost">Contact us</Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] shadow-soft">
            <Image
              src={OFFERS_IMAGE}
              alt="Grocery bags ready for store pickup"
              fill
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-fresh-light">Pickup only</p>
              <p className="mt-1.5 text-lg font-bold leading-snug text-white">
                Order ahead. Walk in. Walk out with fresh groceries.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
