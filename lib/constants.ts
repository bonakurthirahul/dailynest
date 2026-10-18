// Canonical list of grocery categories used to seed the DB and to validate
// owner-side category creation. The live catalogue is read from the
// database — this list is only the seed source, never rendered directly.

export interface SeedCategory {
  name: string;
  slug: string;
  description: string;
}

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    name: "Fruits and Vegetables",
    slug: "fruits-and-vegetables",
    description: "Fresh seasonal produce, restocked daily.",
  },
  {
    name: "Rice and Grains",
    slug: "rice-and-grains",
    description: "Basmati, sona masoori, and everyday staples.",
  },
  {
    name: "Pulses and Dal",
    slug: "pulses-and-dal",
    description: "Toor, moong, chana, and masoor dals.",
  },
  {
    name: "Atta and Flour",
    slug: "atta-and-flour",
    description: "Whole wheat atta, maida, and multigrain flour.",
  },
  {
    name: "Dairy and Eggs",
    slug: "dairy-and-eggs",
    description: "Milk, curd, butter, paneer, and fresh eggs.",
  },
  {
    name: "Snacks and Biscuits",
    slug: "snacks-and-biscuits",
    description: "Chips, namkeen, cookies, and tea-time bites.",
  },
  {
    name: "Beverages",
    slug: "beverages",
    description: "Tea, coffee, juice, and soft drinks.",
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    description: "Daily hygiene, hair, and skin essentials.",
  },
  {
    name: "Household Essentials",
    slug: "household-essentials",
    description: "Cleaning, laundry, and home care products.",
  },
  {
    name: "Cooking Oil and Spices",
    slug: "cooking-oil-and-spices",
    description: "Edible oils, masalas, and whole spices.",
  },
];

// Store pickup-only rules surfaced across the UI so expectations are clear.
export const PICKUP_ONLY_NOTICE =
  "Your order is reserved for store pickup. Pay by cash or UPI at the counter when you collect it.";

export const NO_DELIVERY_NOTICE =
  "DailyNest supports in-store pickup only. There is no home delivery and no online payment.";

export const LOW_STOCK_DEFAULT_THRESHOLD = 10;

// Client-side rate/duplicate guard for order placement.
export const ORDER_REQUEST_ID_KEY = "dailynest.clientRequestId";
