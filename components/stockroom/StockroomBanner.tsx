import Container from "@/components/layout/Container";
import CartToggle from "@/components/cart/CartToggle";

function SearchButton() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 border border-neutral-300 px-4 py-2 text-xs uppercase tracking-[0.24em] hover:border-neutral-900"
    >
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <span>Search</span>
    </button>
  );
}

export default function StockroomBanner() {
  return (
    <section className="border-b border-neutral-200 bg-white">
      <Container className="flex flex-col gap-4 py-6 md:flex-row md:items-center md:justify-end">
        <div className="flex items-center gap-3 md:gap-4">
          <SearchButton />
          <CartToggle variant="banner" />
        </div>
      </Container>
    </section>
  );
}
