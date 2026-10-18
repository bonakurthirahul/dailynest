import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/auth/session";
import { AccountNav } from "@/components/account/account-nav";
import { AccountHeader } from "@/components/account/account-header";

// Customer account area. Requires a signed-in customer. An owner who lands
// here is bounced to their own dashboard — role separation is enforced on
// the server, not by hiding links.
export default async function AccountLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, profile } = await getSessionContext();

  if (!user) {
    redirect("/login");
  }

  if (profile?.role === "owner") {
    redirect("/store-control-7x9/dashboard");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <AccountHeader fullName={profile?.full_name} email={user.email} />
      <div className="mt-6">
        <AccountNav />
        <div className="pt-6">{children}</div>
      </div>
    </div>
  );
}
