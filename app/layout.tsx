import type { Metadata, Viewport } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "DailyNest — Your Daily Needs, All in One Place.",
    template: "%s · DailyNest",
  },
  description:
    "DailyNest is your neighbourhood kirana store, online. Order groceries, pay at the counter by cash or UPI, and collect your ready order in store.",
  keywords: [
    "kirana",
    "grocery",
    "grocery delivery near me",
    "store pickup",
    "DailyNest",
    "Indian grocery",
  ],
  openGraph: {
    title: "DailyNest — Your Daily Needs, All in One Place.",
    description:
      "Order groceries online. Collect at the store. Pay by cash or UPI at the counter.",
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#245C43",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-ivory text-charcoal">
        {children}
      </body>
    </html>
  );
}
