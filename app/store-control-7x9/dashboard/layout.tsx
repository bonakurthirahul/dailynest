import type { ReactNode } from "react";
import { requireOwner } from "@/lib/auth/session";
import { OwnerShell } from "@/components/owner/owner-shell";

// Owner dashboard shell.
//
// SECURITY: requireOwner() runs on the SERVER and enforces that only a
// verified account holding the "owner" role may render anything here.
// Unauthenticated visitors are redirected to the owner login; authenticated
// customers are redirected away to the public site. This is the real
// boundary — the hidden URL is only obscurity.
export default async function OwnerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { profile } = await requireOwner();

  return (
    <OwnerShell
      ownerName={profile.full_name}
      ownerEmail={undefined}
      credits={profile.credits}
    >
      {children}
    </OwnerShell>
  );
}
