import { requireOwner } from "@/lib/auth/session";
import { OwnerNotifications } from "@/components/owner/notifications";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Notifications",
  robots: { index: false, follow: false },
};

export default async function OwnerNotificationsPage() {
  await requireOwner();
  return <OwnerNotifications />;
}
