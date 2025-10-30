// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";

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
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <html lang="en">
      <body className={`${sofiaPro.className} antialiased bg-white text-black`}>
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        {metaPixelId ? (
          <>
            <Script
              id="meta-pixel"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${metaPixelId}');
fbq('track', 'PageView');`,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        ) : null}
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
