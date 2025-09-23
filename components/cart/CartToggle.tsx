'use client';

import { useCart } from '@/components/cart/CartContext';

type Variant = 'banner' | 'icon';

export default function CartToggle({ variant = 'banner' }: { variant?: Variant }) {
  const { cart, openCart, status } = useCart();
  const count = cart?.totalQuantity ?? 0;

  const icon = (
    <svg
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6.5 9h11l-.9 10.2a2 2 0 0 1-2 1.8H9.4a2 2 0 0 1-2-1.8L6.5 9z" />
      <path d="M9 9a3 3 0 0 1 6 0" />
    </svg>
  );

  const badge =
    count > 0 ? (
      <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center bg-neutral-900 px-1 text-[11px] font-medium text-white">
        {status === 'loading' ? '...' : count}
      </span>
    ) : null;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={openCart}
        className="relative inline-flex h-10 w-10 items-center justify-center border border-neutral-300 text-sm hover:border-neutral-900"
        aria-label={count ? `${count} item${count > 1 ? 's' : ''} in cart` : 'Open cart'}
      >
        {icon}
        {badge}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openCart}
      className="inline-flex items-center gap-3 border border-neutral-300 px-4 py-2 text-xs uppercase tracking-[0.24em] transition hover:border-neutral-900"
    >
      <span className="relative flex items-center justify-center">
        {icon}
        {badge}
      </span>
      <span>Cart</span>
    </button>
  );
}
