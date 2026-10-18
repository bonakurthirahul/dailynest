import { requireOwner } from "@/lib/auth/session";
import { OwnerOverview } from "@/components/owner/overview";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function OwnerOverviewPage() {
  await requireOwner();
  return <OwnerOverview />;
}
