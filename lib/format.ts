import type { OrderStatus, PaymentStatus } from "@/lib/types";

// Money is stored as integer paise to avoid floating-point drift.
export function formatINR(paise: number | null | undefined): string {
  if (paise == null || Number.isNaN(paise)) return "₹0";
  const rupees = paise / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: rupees % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function effectivePriceInPaise(
  priceInPaise: number,
  discountPriceInPaise: number | null | undefined
): number {
  if (
    discountPriceInPaise != null &&
    discountPriceInPaise > 0 &&
    discountPriceInPaise < priceInPaise
  ) {
    return discountPriceInPaise;
  }
  return priceInPaise;
}

export function discountPercent(
  priceInPaise: number,
  discountPriceInPaise: number | null | undefined
): number | null {
  if (
    discountPriceInPaise == null ||
    discountPriceInPaise <= 0 ||
    discountPriceInPaise >= priceInPaise ||
    priceInPaise <= 0
  ) {
    return null;
  }
  return Math.round(((priceInPaise - discountPriceInPaise) / priceInPaise) * 100);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  preparing: "Preparing",
  ready: "Ready for Pickup",
  collected: "Collected",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "collected",
];

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid_at_store: "Paid at Store",
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-sky-50 text-sky-700 border-sky-200",
  preparing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200",
  collected: "bg-neutral-100 text-neutral-600 border-neutral-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  cancelled: "bg-neutral-100 text-neutral-500 border-neutral-200",
};
