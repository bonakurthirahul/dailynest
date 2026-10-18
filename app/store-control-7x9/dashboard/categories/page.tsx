import { requireOwner } from "@/lib/auth/session";
import { OwnerCategories } from "@/components/owner/categories";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};

export default async function OwnerCategoriesPage() {
  await requireOwner();
  return <OwnerCategories />;
}
