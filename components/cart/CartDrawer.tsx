'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

import { useCart } from '@/components/cart/CartContext';
import { buildCartPermalink, rewriteCheckoutDomain } from '@/lib/shopifyPermalink';
import { formatCurrency } from '@/lib/formatCurrency';

export default function CartDrawer() {
  const {
    cart,
    drawerOpen,
    closeCart,
    removeLine,
    updateLine,
    status,
    error,
    clearError,
    setErrorMessage,
  } = useCart();

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (drawerOpen) {
      const previous = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = previous;
      };
    }
    return undefined;
  }, [drawerOpen]);

  if (!drawerOpen) return null;

  const subtotal = cart?.cost?.subtotalAmount;
  const empty = !cart || cart.totalQuantity === 0 || cart.lines.length === 0;

  const handleCheckout = async () => {
    if (!cart || !cart.lines.length || checkoutLoading) return;
    setCheckoutLoading(true);
    try {
      const lines = cart.lines
        .filter((line) => line.merchandiseId && line.quantity > 0)
        .map((line) => ({ variantGid: line.merchandiseId, quantity: line.quantity }));

      if (!lines.length) {
        setCheckoutLoading(false);
        return;
      }

      const checkoutUrl = cart.checkoutUrl ? rewriteCheckoutDomain(cart.checkoutUrl) : null;
      const url = checkoutUrl || buildCartPermalink(lines);
      if (url) {
        window.location.href = url;
        return;
      }

      setErrorMessage('Unable to redirect to checkout.');
    } catch (error) {
      console.error('Checkout redirect failed', error);
      setErrorMessage('Unable to start checkout. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] flex">
      <button
        type="button"
        aria-label="Close cart"
        onClick={closeCart}
        className="flex-1 bg-black/40 backdrop-blur-sm"
      />

      <aside className="relative flex h-full max-h-screen w-full max-w-lg flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Cart</p>
            <p className="text-lg font-medium">
              {cart?.totalQuantity ? `${cart.totalQuantity} item${cart.totalQuantity > 1 ? 's' : ''}` : 'Empty'}
            </p>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="text-sm uppercase tracking-[0.18em] text-neutral-500 hover:text-black"
          >
            Close
          </button>
        </div>

        {error ? (
          <div className="bg-red-50 px-6 py-3 text-sm text-red-700">
            {error}
            <button
              type="button"
              onClick={clearError}
              className="ml-3 underline"
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <div className="flex-1 overflow-y-auto px-6">
          {empty ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-neutral-500">
              <p>Your cart is empty.</p>
            </div>
          ) : (
            <ul className="flex-1 divide-y divide-neutral-200">
              {cart?.lines.map((line) => {
                const product = line.product;
                const image = product?.featuredImage;
                return (
                  <li key={line.id} className="py-6">
                    <div className="grid grid-cols-[96px_1fr] gap-4">
                      <div className="relative h-24 w-24 bg-neutral-100">
                        {image?.url ? (
                          <Image
                            src={image.url}
                            alt={image.altText || product?.title || 'Artwork'}
                            fill
                            sizes="96px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-medium">{product?.title || line.merchandiseTitle}</h3>
                        {product?.artist ? (
                          <p className="text-sm text-neutral-500">{product.artist}</p>
                        ) : null}
                        <div className="mt-2 text-sm text-neutral-600">
                          {product?.medium && <p>{product.medium}</p>}
                          {product?.dimensions && <p>{product.dimensions}</p>}
                          {product?.year && <p>{product.year}</p>}
                        </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const next = line.quantity - 1;
                                if (next <= 0) {
                                  removeLine(line.id);
                                } else {
                                  updateLine({ id: line.id, quantity: next });
                                }
                              }}
                              className="flex h-8 w-8 items-center justify-center border border-neutral-300"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span>{line.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateLine({ id: line.id, quantity: line.quantity + 1 })}
                              className="flex h-8 w-8 items-center justify-center border border-neutral-300"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            className="text-xs uppercase tracking-[0.2em] text-neutral-500 underline-offset-4 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <p className="mt-2 text-sm font-medium">
                          {(() => {
                            if (!line.price) return 'Price on request';
                            const amount = Number(line.price.amount);
                            if (!Number.isFinite(amount)) return 'Price on request';
                            return formatCurrency(amount, line.price.currencyCode) || 'Price on request';
                          })()}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-t border-neutral-200 px-6 py-5">
          <div className="flex items-center justify-between text-sm">
            <span className="uppercase tracking-[0.18em] text-neutral-500">Subtotal</span>
            <span className="text-base font-medium">
              {(() => {
                if (!subtotal) return '--';
                const amount = Number(subtotal.amount);
                if (!Number.isFinite(amount)) return '--';
                return formatCurrency(amount, subtotal.currencyCode) || '--';
              })()}
            </span>
          </div>
          <p className="mt-2 text-xs text-neutral-500">Taxes and shipping calculated at checkout.</p>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="flex-1 border border-neutral-300 px-4 py-2 text-sm uppercase tracking-[0.18em] hover:border-neutral-900"
              onClick={closeCart}
            >
              Continue browsing
            </button>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={empty || checkoutLoading}
              className={`flex-1 px-4 py-2 text-sm uppercase tracking-[0.18em] text-white transition ${
                empty || checkoutLoading ? 'bg-neutral-400 cursor-not-allowed' : 'bg-neutral-900 hover:bg-black'
              }`}
            >
              {checkoutLoading ? 'Processing...' : 'Checkout'}
            </button>
          </div>
          {status === 'loading' ? (
            <p className="mt-2 text-xs text-neutral-500">Updating cart...</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
