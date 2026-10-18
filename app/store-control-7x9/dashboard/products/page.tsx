import { requireOwner } from "@/lib/auth/session";
import { OwnerProducts } from "@/components/owner/products";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Products",
  robots: { index: false, follow: false },
};

export default async function OwnerProductsPage() {
  await requireOwner();
  return <OwnerProducts />;
}
