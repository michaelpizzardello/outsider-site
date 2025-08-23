// app/layout.tsx
import "./globals.css";
import { sofiaPro } from "./fonts";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* This line makes the whole site use Sofia Pro */}
      <body className={`${sofiaPro.className} antialiased`}>{children}</body>
    </html>
  );
}