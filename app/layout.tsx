// app/layout.tsx
import "./globals.css";
import { sofiaPro } from "./fonts";
import Header from "@/components/layout/Header";
import SiteFooter from "@/components/layout/SiteFooter";
import { CartProvider } from "@/components/cart/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sofiaPro.className} antialiased bg-white text-black`}>
        <CartProvider>
          <Header />
          {children}
          <SiteFooter />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
