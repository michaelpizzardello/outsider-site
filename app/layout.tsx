// app/layout.tsx
import "./globals.css";
import { sofiaPro } from "./fonts";
import Header from "@/components/Header";
import SiteFooter from "@/components/SiteFooter";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${sofiaPro.className} antialiased bg-white text-black`}>
        <Header />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
