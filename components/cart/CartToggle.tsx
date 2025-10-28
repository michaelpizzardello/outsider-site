'use client';

import { useCart } from '@/components/cart/CartContext';

type Variant = 'banner' | 'icon';

export function CartIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4.5a.5.5 0 0 1 .5-.5H7a.5.5 0 0 1 .49.4l.36 1.6H20a.5.5 0 0 1 .49.6l-1.3 6.5a2 2 0 0 1-1.97 1.6H8.8l.18 1h9.52a.5.5 0 0 1 0 1H8a.5.5 0 0 1-.49-.4L5.54 5h-1A.5.5 0 0 1 4 4.5Zm3 13a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm9.5 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" />
    </svg>
  );
}

export default function CartToggle({ variant = 'banner' }: { variant?: Variant }) {
  const { cart, openCart, status } = useCart();
  const count = cart?.totalQuantity ?? 0;
  const isLoading = status === 'loading';
  const label = count > 0 ? `Cart (${isLoading ? '...' : count})` : 'Cart';

  const badge =
    variant === 'icon' && count > 0 ? (
      <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-neutral-900 px-1 text-[11px] font-medium text-white">
        {isLoading ? '...' : count}
      </span>
    ) : null;

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={openCart}
        className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center border border-neutral-300 text-sm transition hover:border-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
        aria-label={label}
      >
        <CartIcon />
        {badge}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openCart}
      className="inline-flex cursor-pointer items-center gap-2 px-2 py-2 text-sm font-medium text-neutral-900 transition hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      <span className="relative flex items-center justify-center">
        <CartIcon />
        {badge}
      </span>
      <span className="md:text-base">{label}</span>
    </button>
  );
}
