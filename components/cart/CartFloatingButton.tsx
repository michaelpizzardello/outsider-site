'use client';

import { useCart } from '@/components/cart/CartContext';
import { CartIcon } from '@/components/cart/CartToggle';

export default function CartFloatingButton() {
  const { cart, openCart, status } = useCart();
  const count = cart?.totalQuantity ?? 0;

  if (!count) {
    return null;
  }

  const isLoading = status === 'loading';
  const label = count > 0 ? `Open cart (${isLoading ? '...' : count})` : 'Open cart';

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={label}
      className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-black/70 text-white shadow-lg backdrop-blur-md transition hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:hidden"
    >
      <span className="relative flex items-center justify-center">
        <CartIcon className="h-6 w-6" />
        <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-semibold text-neutral-900 shadow">
          {isLoading ? '...' : count}
        </span>
      </span>
    </button>
  );
}
