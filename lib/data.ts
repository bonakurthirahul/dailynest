import { cache } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Category, Product, StoreSetting } from "@/lib/types";

// Server-side catalogue reads. These use the RLS-scoped server client, so
// they are safe to call from any Server Component. The catalogue is public
// data (anon + authenticated can read via RLS).
//
// When Supabase env vars are missing the functions return empty/null so the
// UI still renders (with empty states) instead of crashing.

const DEMO_SETTINGS: StoreSetting = {
  id: "00000000-0000-0000-0000-000000000000",
  store_name: "DailyNest",
  tagline: "Your Daily Needs, All in One Place.",
  address: "Add your store address in Settings.",
  contact_phone: "+91 00000 00000",
  contact_email: null,
  opening_hours: "Mon–Sun 7:00 AM – 9:00 PM",
  pickup_instructions: "Show your order number at the counter.",
  is_open: true,
  updated_at: new Date().toISOString(),
};

export const getStoreSettings = cache(async (): Promise<StoreSetting | null> => {
  if (!isSupabaseConfigured()) return DEMO_SETTINGS;
  const supabase = await createClient();
  const { data } = await supabase
    .from("store_settings")
    .select("*")
    .limit(1)
    .maybeSingle();
  return (data as StoreSetting | null) ?? DEMO_SETTINGS;
});

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data as Category[]) ?? [];
});

export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Category | null) ?? null;
});

export interface ProductQueryOptions {
  categorySlug?: string;
  search?: string;
  featured?: boolean;
  limit?: number;
}

export const getProducts = cache(
  async (options: ProductQueryOptions = {}): Promise<Product[]> => {
    if (!isSupabaseConfigured()) return [];
    const { categorySlug, search, featured, limit = 60 } = options;
    const supabase = await createClient();

    let query = supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_available", true)
      .order("name", { ascending: true })
      .limit(limit);

    if (categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", categorySlug)
        .maybeSingle();
      if (cat) {
        query = query.eq("category_id", cat.id);
      } else {
        return [];
      }
    }

    if (featured) {
      query = query.eq("is_featured", true);
    }

    if (search && search.trim().length > 0) {
      const term = search.trim();
      // Simple, index-friendly containment search across name + description.
      query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const { data } = await query;
    return (data as Product[]) ?? [];
  }
);

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(*)")
    .eq("slug", slug)
    .maybeSingle();
  return (data as Product | null) ?? null;
});

export const getFeaturedProducts = cache(
  async (limit = 8): Promise<Product[]> => {
    if (!isSupabaseConfigured()) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_available", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as Product[]) ?? [];
  }
);

export const getProductsByIds = cache(
  async (ids: string[]): Promise<Product[]> => {
    if (ids.length === 0) return [];
    if (!isSupabaseConfigured()) return [];
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .in("id", ids);
    return (data as Product[]) ?? [];
  }
);
