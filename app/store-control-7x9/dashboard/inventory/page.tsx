import { requireOwner } from "@/lib/auth/session";
import { OwnerInventory } from "@/components/owner/inventory";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inventory",
  robots: { index: false, follow: false },
};

export default async function OwnerInventoryPage() {
  await requireOwner();
  return <OwnerInventory />;
}
