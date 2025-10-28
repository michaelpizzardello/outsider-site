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

export const metadata: Metadata = {
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
