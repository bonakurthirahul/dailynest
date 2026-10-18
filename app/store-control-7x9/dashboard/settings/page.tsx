import { requireOwner } from "@/lib/auth/session";
import { OwnerSettings } from "@/components/owner/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function OwnerSettingsPage() {
  await requireOwner();
  return <OwnerSettings />;
}
