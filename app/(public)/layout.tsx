import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartProvider } from "@/components/cart/cart-context";
import { AnnouncementBar } from "@/components/layout/announcement-bar";

// Layout for the public customer site (everything outside the owner area).
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col">
        <AnnouncementBar />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    </CartProvider>
  );
}
