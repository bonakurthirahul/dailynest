-- ============================================================================
-- DailyNest — Seed Data
-- ============================================================================
-- Seeds the 10 grocery categories and a set of realistic starter products.
--
-- SECURITY NOTE: this file contains NO owner credentials and NO passwords.
-- The owner account is created only via the server-side bootstrap route
-- (INITIAL_OWNER_EMAIL / INITIAL_OWNER_PASSWORD env vars) or manually in
-- the Supabase dashboard. See docs/SETUP.md.
--
-- Run AFTER the migrations:
--   psql "$SUPABASE_DB_URL" -f supabase/seed.sql
-- or paste into the Supabase SQL editor.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- CATEGORIES
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, description, sort_order, is_active)
values
  ('Fruits and Vegetables', 'fruits-and-vegetables', 'Fresh seasonal produce, restocked daily.', 1, true),
  ('Rice and Grains', 'rice-and-grains', 'Basmati, sona masoori, and everyday staples.', 2, true),
  ('Pulses and Dal', 'pulses-and-dal', 'Toor, moong, chana, and masoor dals.', 3, true),
  ('Atta and Flour', 'atta-and-flour', 'Whole wheat atta, maida, and multigrain flour.', 4, true),
  ('Dairy and Eggs', 'dairy-and-eggs', 'Milk, curd, butter, paneer, and fresh eggs.', 5, true),
  ('Snacks and Biscuits', 'snacks-and-biscuits', 'Chips, namkeen, cookies, and tea-time bites.', 6, true),
  ('Beverages', 'beverages', 'Tea, coffee, juice, and soft drinks.', 7, true),
  ('Personal Care', 'personal-care', 'Daily hygiene, hair, and skin essentials.', 8, true),
  ('Household Essentials', 'household-essentials', 'Cleaning, laundry, and home care products.', 9, true),
  ('Cooking Oil and Spices', 'cooking-oil-and-spices', 'Edible oils, masalas, and whole spices.', 10, true)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- PRODUCTS
-- ---------------------------------------------------------------------------
-- Prices are stored in integer paise (₹1 = 100 paise).
-- Each insert resolves the category by slug; if a category is missing the
-- product is skipped (category_id stays null) rather than erroring.
insert into public.products
  (category_id, name, slug, description, unit_label,
   price_in_paise, discount_price_in_paise, stock_quantity,
   low_stock_threshold, is_available, is_featured)
select
  c.id, v.name, v.slug, v.description, v.unit_label,
  v.price_in_paise, v.discount_price_in_paise, v.stock_quantity,
  v.low_stock_threshold, true, v.is_featured
from (values
  -- Fruits and Vegetables
  ('fruits-and-vegetables', 'Fresh Banana', 'fresh-banana', 'Naturally ripened Robusta bananas.', '1 dozen', 5500, null, 120, 15, false),
  ('fruits-and-vegetables', 'Tomato (Hybrid)', 'tomato-hybrid', 'Firm, juicy hybrid tomatoes.', '1 kg', 3200, 2700, 90, 15, true),
  ('fruits-and-vegetables', 'Onion', 'onion', 'Medium sized red onions.', '1 kg', 3800, null, 150, 20, false),
  ('fruits-and-vegetables', 'Green Capsicum', 'green-capsicum', 'Crunchy green bell pepper.', '500 g', 4500, null, 40, 10, false),
  ('fruits-and-vegetables', 'Apple (Shimla)', 'apple-shimla', 'Crisp Shimla apples.', '1 kg', 16500, 14900, 60, 10, true),
  ('fruits-and-vegetables', 'Potato', 'potato', 'Fresh farm potatoes.', '1 kg', 2800, null, 200, 25, false),

  -- Rice and Grains
  ('rice-and-grains', 'Basmati Rice (Premium)', 'basmati-rice-premium', 'Long grain aged basmati.', '5 kg', 64500, 58500, 75, 10, true),
  ('rice-and-grains', 'Sona Masoori Rice', 'sona-masoori-rice', 'Everyday sona masoori rice.', '5 kg', 38500, null, 90, 10, false),
  ('rice-and-grains', 'Brown Rice', 'brown-rice', 'Unpolished brown rice.', '1 kg', 12500, null, 45, 8, false),
  ('rice-and-grains', 'Poha (Flattened Rice)', 'poha-flattened-rice', 'Thick poha for breakfast.', '1 kg', 6500, null, 60, 10, false),

  -- Pulses and Dal
  ('pulses-and-dal', 'Toor Dal (Arhar)', 'toor-dal-arhar', 'Premium unpolished toor dal.', '1 kg', 14500, 13200, 80, 12, true),
  ('pulses-and-dal', 'Moong Dal', 'moong-dal', 'Split yellow moong dal.', '1 kg', 12800, null, 70, 12, false),
  ('pulses-and-dal', 'Chana Dal', 'chana-dal', 'Bengal gram split dal.', '1 kg', 9800, null, 65, 10, false),
  ('pulses-and-dal', 'Masoor Dal', 'masoor-dal', 'Red lentils, quick cooking.', '1 kg', 11200, null, 55, 10, false),
  ('pulses-and-dal', 'Rajma (Kidney Beans)', 'rajma-kidney-beans', 'Chitra rajma, high protein.', '1 kg', 16500, 15200, 40, 8, false),

  -- Atta and Flour
  ('atta-and-flour', 'Whole Wheat Atta', 'whole-wheat-atta', 'Chakki fresh ground atta.', '5 kg', 28500, 25900, 100, 15, true),
  ('atta-and-flour', 'Maida (Refined Flour)', 'maida-refined-flour', 'Fine refined wheat flour.', '1 kg', 4800, null, 70, 10, false),
  ('atta-and-flour', 'Besan (Gram Flour)', 'besan-gram-flour', 'Stone ground besan.', '1 kg', 7200, null, 50, 10, false),
  ('atta-and-flour', 'Multigrain Atta', 'multigrain-atta', 'Blend of wheat, dal, and millets.', '5 kg', 34500, null, 35, 8, false),

  -- Dairy and Eggs
  ('dairy-and-eggs', 'Toned Milk', 'toned-milk', 'Pasteurised toned milk pouch.', '500 ml', 2800, null, 200, 30, true),
  ('dairy-and-eggs', 'Fresh Curd', 'fresh-curd', 'Thick set fresh curd.', '400 g', 3500, null, 90, 15, false),
  ('dairy-and-eggs', 'Farm Eggs', 'farm-eggs', 'Fresh farm raised eggs.', '6 pcs', 5400, 4800, 120, 20, true),
  ('dairy-and-eggs', 'White Butter', 'white-butter', 'Homemade white butter.', '200 g', 8500, null, 30, 8, false),
  ('dairy-and-eggs', 'Paneer', 'paneer', 'Fresh malai paneer.', '200 g', 9500, 8500, 45, 10, false),

  -- Snacks and Biscuits
  ('snacks-and-biscuits', 'Marie Biscuits', 'marie-biscuits', 'Light tea-time Marie biscuits.', '250 g', 3200, null, 150, 20, false),
  ('snacks-and-biscuits', 'Masala Chips', 'masala-chips', 'Crunchy masala potato chips.', '90 g', 2000, null, 180, 25, false),
  ('snacks-and-biscuits', 'Salted Namkeen', 'salted-namkeen', 'Classic assorted namkeen mix.', '400 g', 6800, 5900, 60, 12, true),
  ('snacks-and-biscuits', 'Dark Chocolate Cookies', 'dark-chocolate-cookies', 'Crunchy dark choco cookies.', '150 g', 7500, null, 40, 10, false),
  ('snacks-and-biscuits', 'Roasted Peanuts', 'roasted-peanuts', 'Salted roasted peanuts.', '500 g', 5500, null, 55, 10, false),

  -- Beverages
  ('beverages', 'Assam Tea', 'assam-tea', 'Strong Assam CTC tea.', '250 g', 14500, 12900, 70, 12, true),
  ('beverages', 'Filter Coffee Powder', 'filter-coffee-powder', 'South Indian filter coffee blend.', '200 g', 16500, null, 45, 10, false),
  ('beverages', 'Mixed Fruit Juice', 'mixed-fruit-juice', 'No added sugar fruit juice.', '1 L', 9500, 8500, 50, 10, false),
  ('beverages', 'Soft Drink (Cola)', 'soft-drink-cola', 'Chilled cola bottle.', '750 ml', 4000, null, 120, 20, false),

  -- Personal Care
  ('personal-care', 'Herbal Shampoo', 'herbal-shampoo', 'Anti-hairfall herbal shampoo.', '340 ml', 24500, 21900, 35, 8, true),
  ('personal-care', 'Toothpaste (Mint)', 'toothpaste-mint', 'Mint freshness toothpaste.', '200 g', 8500, null, 80, 15, false),
  ('personal-care', 'Bath Soap', 'bath-soap', 'Moisturising bath soap.', '4 x 125 g', 14500, 12500, 90, 15, false),
  ('personal-care', 'Hand Sanitizer', 'hand-sanitizer', '70% alcohol hand sanitizer.', '200 ml', 9900, null, 60, 10, false),

  -- Household Essentials
  ('household-essentials', 'Dishwash Liquid', 'dishwash-liquid', 'Lemon dishwash concentrate.', '750 ml', 17500, 15500, 55, 10, true),
  ('household-essentials', 'Detergent Powder', 'detergent-powder', 'Front & top load detergent.', '1 kg', 13500, null, 85, 15, false),
  ('household-essentials', 'Floor Cleaner', 'floor-cleaner', 'Disinfectant floor cleaner.', '1 L', 15500, null, 45, 10, false),
  ('household-essentials', 'Toilet Cleaner', 'toilet-cleaner', ' Thick toilet cleaner.', '1 L', 12500, 11200, 40, 10, false),

  -- Cooking Oil and Spices
  ('cooking-oil-and-spices', 'Sunflower Oil', 'sunflower-oil', 'Refined sunflower cooking oil.', '1 L', 14500, 13200, 100, 15, true),
  ('cooking-oil-and-spices', 'Groundnut Oil', 'groundnut-oil', 'Cold pressed groundnut oil.', '1 L', 18500, null, 50, 10, false),
  ('cooking-oil-and-spices', 'Turmeric Powder', 'turmeric-powder', 'Pure ground turmeric.', '200 g', 5500, null, 65, 10, false),
  ('cooking-oil-and-spices', 'Coriander Powder', 'coriander-powder', 'Aromatic coriander powder.', '200 g', 4800, 4200, 60, 10, false),
  ('cooking-oil-and-spices', 'Garam Masala', 'garam-masala', 'Traditional garam masala blend.', '100 g', 7500, null, 45, 8, false)
) as v(cat_slug, name, slug, description, unit_label, price_in_paise, discount_price_in_paise, stock_quantity, low_stock_threshold, is_featured)
join public.categories c on c.slug = v.cat_slug
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- REMINDER
-- ---------------------------------------------------------------------------
-- The owner account is NOT created here on purpose. See docs/SETUP.md for
-- the secure bootstrap process (INITIAL_OWNER_EMAIL / INITIAL_OWNER_PASSWORD).
