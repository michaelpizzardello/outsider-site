// app/layout.tsx
import type { Metadata } from "next";

import "./globals.css";
import { sofiaPro } from "./fonts";
import { CartProvider } from "@/components/cart/CartContext";
import CartFloatingButton from "@/components/cart/CartFloatingButton";
import CartDrawer from "@/components/cart/CartDrawer";
import Header from "@/components/layout/Header";
import SiteFooter from "@/components/layout/SiteFooter";
import TopLoader from "@/components/layout/TopLoader";
import OrganizationJsonLd from "@/components/seo/OrganizationJsonLd";
import { siteConfig } from "@/lib/siteConfig";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import FacebookPixel from "@/components/analytics/FacebookPixel";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.siteUrl),
  title: {
    default: "Outsider Gallery | Contemporary Art Gallery in Sydney | Surry Hills",
    template: "%s | Outsider Gallery",
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_AU",
    url: siteConfig.siteUrl,
    siteName: siteConfig.name,
    title: "Outsider Gallery | Contemporary Art Gallery in Sydney | Surry Hills",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    site: "@outsidergallery_",
    creator: "@outsidergallery_",
    title: "Outsider Gallery | Contemporary Art Gallery in Sydney | Surry Hills",
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "any" }],
    shortcut: [{ url: "/favicon.ico" }],
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sofiaPro.className} antialiased bg-white text-black`}>
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        <FacebookPixel pixelId="871465931873141" />
        <OrganizationJsonLd />
        <CartProvider>
          <TopLoader />
          <Header />
          {children}
          <SiteFooter />
          <CartFloatingButton />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
