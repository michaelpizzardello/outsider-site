'use client';

import { useCart } from '@/components/cart/CartContext';
import { CartIcon } from '@/components/cart/CartToggle';

export default function CartFloatingButton() {
  const { cart, openCart, status } = useCart();
  const count = cart?.totalQuantity ?? 0;

  if (count <= 0) {
    return null;
  }

  const isLoading = status === 'loading';
  const showBadge = !isLoading && count > 0 && count < 10;
  const label = `Open cart (${isLoading ? '...' : count})`;

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={label}
      className="fixed bottom-6 right-3 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-black/80 text-white shadow-lg backdrop-blur-md transition hover:bg-black/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:hidden"
    >
      <span className="relative flex items-center justify-center">
        <CartIcon className="h-7 w-7 text-white" />
        {showBadge ? (
          <span
            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-semibold text-white shadow"
            style={{ backgroundColor: "#E11D48" }}
          >
            {count}
          </span>
        ) : null}
      </span>
    </button>
  );
}
