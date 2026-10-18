import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/data";
import { ProductPurchase } from "@/components/product/product-purchase";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description ?? `${product.name} at DailyNest.`,
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  // Related products from the same category (excluding this one).
  const related = product.category
    ? (await getProducts({ categorySlug: product.category.slug, limit: 8 })).filter(
        (p) => p.id !== product.id
      )
    : [];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-forest">Home</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="hover:text-forest">Shop</Link>
          </li>
          {product.category && (
            <>
              <li aria-hidden="true">/</li>
              <li>
                <Link
                  href={`/shop?category=${product.category.slug}`}
                  className="hover:text-forest"
                >
                  {product.category.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden="true">/</li>
          <li className="font-medium text-charcoal">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-line bg-ivory-dark shadow-soft">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-8xl" aria-hidden="true">🥬</span>
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {product.category && (
            <Link
              href={`/shop?category=${product.category.slug}`}
              className="text-sm font-semibold uppercase tracking-wider text-fresh hover:underline"
            >
              {product.category.name}
            </Link>
          )}

          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-charcoal sm:text-4xl">
            {product.name}
          </h1>

          {product.description && (
            <p className="mt-4 leading-relaxed text-charcoal-soft">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            <ProductPurchase product={product} />
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-charcoal">
              You may also need
            </h2>
            <Link
              href={`/shop?category=${product.category?.slug ?? ""}`}
              className="text-sm font-semibold text-forest hover:underline"
            >
              View category →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.slice(0, 4).map((p) => (
              <RelatedCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function RelatedCard({
  product,
}: {
  product: Awaited<ReturnType<typeof getProducts>>[number];
}) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group card flex flex-col overflow-hidden transition-shadow hover:shadow-lift"
    >
      <div className="relative aspect-square bg-ivory-dark">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 45vw, 22vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-4xl" aria-hidden="true">🛒</span>
          </div>
        )}
      </div>
      <div className="p-3.5">
        <p className="line-clamp-2 text-sm font-bold text-charcoal group-hover:text-forest">
          {product.name}
        </p>
        {product.unit_label && (
          <p className="mt-0.5 text-xs text-muted">{product.unit_label}</p>
        )}
      </div>
    </Link>
  );
}
