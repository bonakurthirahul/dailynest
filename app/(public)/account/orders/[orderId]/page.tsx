import type { Metadata } from "next";
import Link from "next/link";
import { OrderDetail } from "@/components/order/order-detail";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false },
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <div>
      <Link
        href="/account/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
      >
        ← Back to order history
      </Link>
      <OrderDetail orderId={orderId} />
    </div>
  );
}
