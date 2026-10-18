import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Owner routes are intentionally excluded — they are private and noindexed.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const publicRoutes: Array<{ path: string; priority?: number; changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never" }> = [
    { path: "/", priority: 1.0, changeFrequency: "daily" },
    { path: "/shop", priority: 0.9, changeFrequency: "daily" },
    { path: "/categories", priority: 0.7, changeFrequency: "weekly" },
    { path: "/store-info", priority: 0.6, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
    { path: "/login", priority: 0.3, changeFrequency: "never" },
    { path: "/register", priority: 0.3, changeFrequency: "never" },
    { path: "/forgot-password", priority: 0.2, changeFrequency: "never" },
  ];

  return publicRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
