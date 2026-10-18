import { requireOwner } from "@/lib/auth/session";
import { OwnerOrders } from "@/components/owner/orders";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Orders",
  robots: { index: false, follow: false },
};

export default async function OwnerOrdersPage() {
  await requireOwner();
  return <OwnerOrders />;
}
