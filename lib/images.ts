// Verified editorial grocery photography (Unsplash). Used only for marketing
// surfaces (hero, brand story, category tiles, how-it-works). Real product
// images live in Supabase Storage and are set by the store owner.

const u = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HERO_IMAGE = u("photo-1542838132-92c53300491e", 1600);
export const STORY_IMAGE = u("photo-1578916171728-46686eac8d58", 1200);
export const PICKUP_IMAGE = u("photo-1604719312566-8912e9227c6a", 1200);
export const OFFERS_IMAGE = u("photo-1550989460-0adf9ea622e2", 1200);

export const CATEGORY_IMAGES: Record<string, string> = {
  "fruits-and-vegetables": u("photo-1540420773420-3366772f4999", 800),
  "rice-and-grains": u("photo-1586201375761-83865001e31c", 800),
  "pulses-and-dal": u("photo-1596797038530-2c107229654b", 800),
  "atta-and-flour": u("photo-1509440159596-0249088772ff", 800),
  "dairy-and-eggs": u("photo-1550583724-b2692b85b150", 800),
  "snacks-and-biscuits": u("photo-1558961363-fa8fdf82db35", 800),
  beverages: u("photo-1495474472287-4d71bcdd2085", 800),
  "personal-care": u("photo-1556228578-8c89e6adf883", 800),
  "household-essentials": u("photo-1563453392212-326f5e854473", 800),
  "cooking-oil-and-spices": u("photo-1596040033229-a9821ebd058d", 800),
};

export const CATEGORY_FALLBACK_IMAGE = u("photo-1542838132-92c53300491e", 800);

// How-it-works step illustrations (inline SVG-friendly photo backdrops).
export const STEP_IMAGES = [
  u("photo-1556742049-0cfed4f6a45d", 600),
  u("photo-1553530666-ba11a7da3888", 600),
  u("photo-1604719312566-8912e9227c6a", 600),
];
