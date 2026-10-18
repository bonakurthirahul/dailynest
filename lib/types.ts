// ============================================================================
// DailyNest — Shared Domain Types
// ============================================================================

export type UserRole = "customer" | "owner";

export type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready"
  | "collected"
  | "rejected"
  | "cancelled";

export type PaymentStatus = "unpaid" | "paid_at_store";

export type PaymentMethod = "cash" | "upi" | "pay_at_store";

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  credits: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  unit_label: string | null;
  price_in_paise: number;
  discount_price_in_paise: number | null;
  stock_quantity: number;
  low_stock_threshold: number;
  is_available: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  category?: Category | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string | null;
  unit_label: string | null;
  quantity: number;
  unit_price_in_paise: number;
  line_total_in_paise: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  pickup_notes: string | null;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal_in_paise: number;
  discount_in_paise: number;
  total_in_paise: number;
  item_count: number;
  status_reason: string | null;
  client_request_id: string | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItem[];
}

export interface StoreSetting {
  id: string;
  store_name: string;
  tagline: string;
  address: string;
  contact_phone: string;
  contact_email: string | null;
  opening_hours: string;
  pickup_instructions: string;
  is_open: boolean;
  updated_at: string;
}

export interface AppNotification {
  id: string;
  audience: "owner" | "customer";
  user_id: string | null;
  order_id: string | null;
  title: string;
  body: string;
  kind: string;
  is_read: boolean;
  created_at: string;
}

export type Notification = AppNotification;

// ---- Cart (client-only, persisted in localStorage) -----------------------

export interface CartLine {
  productId: string;
  slug: string;
  name: string;
  unitLabel: string | null;
  imageUrl: string | null;
  unitPriceInPaise: number;
  discountPriceInPaise: number | null;
  quantity: number;
  stockQuantity: number;
}

export interface CartState {
  lines: CartLine[];
  updatedAt: number;
}

// ---- API payloads --------------------------------------------------------

export interface CreateOrderItemPayload {
  productId: string;
  quantity: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[];
  customerName: string;
  customerPhone: string;
  pickupNotes?: string;
  clientRequestId: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}
