import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/store-control-7x9/",
        "/api/",
        "/account/",
        "/cart",
        "/checkout",
        "/track-order",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
