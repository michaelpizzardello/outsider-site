// components/SiteFooter.tsx
import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-sm text-neutral-600">
        <div className="md:flex items-center justify-between gap-6">
          <p>Outsider Gallery, Surry Hills, Sydney</p>
          <div className="space-x-4">
            <Link href="/contact" className="underline">Contact</Link>
            <Link href="/artists" className="underline">Artists</Link>
            <Link href="/exhibitions" className="underline">Exhibitions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
