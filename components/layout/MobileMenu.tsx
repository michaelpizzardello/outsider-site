import NavLinks from "@/components/layout/NavLinks";
import Container from "@/components/layout/Container";

export default function MobileMenu({
  open,
  onClose,
  nav,
}: {
  open: boolean;
  onClose: () => void;
  nav: Array<{ href: string; label: string }>;
}) {
  return (
    <div
      className={`md:hidden fixed inset-0 z-30 transition-opacity duration-300 ${
        open
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* slide-up sheet */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white text-neutral-900 rounded-t-3xl shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <Container className="py-8">
          {/* grab-handle */}
          <div className="mb-6 flex justify-center">
            <span className="h-1.5 w-12 rounded-full bg-neutral-200" />
          </div>

          {/* nav links */}
          <NavLinks
            items={nav}
            className="grid gap-6 text-center"
            linkClassName="block py-3 text-xl font-medium tracking-[.2em] uppercase hover:opacity-80"
            onClick={onClose}
          />

          {/* close button */}
          <div className="mt-8 flex justify-center">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-neutral-300 px-5 py-2 text-sm"
            >
              Close
            </button>
          </div>
        </Container>
      </div>
    </div>
  );
}
