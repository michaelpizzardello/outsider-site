'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useCart } from '@/components/cart/CartContext';
import { buildCartPermalink, rewriteCheckoutDomain } from '@/lib/shopifyPermalink';
import { formatCurrency } from '@/lib/formatCurrency';
import { trackPixelEvent } from '@/lib/analytics/pixel';

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
      const subtotal = cart.cost?.subtotalAmount;
      const parsedSubtotal = subtotal ? Number(subtotal.amount) : NaN;
      const value = Number.isFinite(parsedSubtotal) ? parsedSubtotal : undefined;
      const checkoutPayload = (() => {
        const ids = Array.from(
          new Set(
            cart.lines
              .map((line) => line.product?.id || line.merchandiseId)
              .filter((id): id is string => Boolean(id))
          )
        );
        if (!ids.length) return null;
        const contents = cart.lines
          .map((line) => {
            const id = line.product?.id || line.merchandiseId;
            if (!id) return null;
            const parsedPrice = line.price ? Number(line.price.amount) : NaN;
            const itemPrice = Number.isFinite(parsedPrice) ? parsedPrice : undefined;
            return {
              id,
              quantity: line.quantity,
              ...(typeof itemPrice === "number" ? { item_price: itemPrice } : {}),
            };
          })
          .filter((entry): entry is { id: string; quantity: number; item_price?: number } =>
            Boolean(entry)
          );
        return {
          content_ids: ids,
          content_type: "product" as const,
          contents,
          value,
          currency:
            typeof value === "number" && subtotal?.currencyCode ? subtotal.currencyCode : undefined,
          num_items: cart.totalQuantity ?? undefined,
        };
      })();

      if (!lines.length) {
        setCheckoutLoading(false);
        return;
      }

      const checkoutUrl = cart.checkoutUrl ? rewriteCheckoutDomain(cart.checkoutUrl) : null;
      const url = checkoutUrl || buildCartPermalink(lines);
      if (url) {
        if (checkoutPayload) {
          trackPixelEvent("InitiateCheckout", checkoutPayload);
        }
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
        className="flex-1 cursor-pointer bg-black/40 backdrop-blur-sm"
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
            className="cursor-pointer text-sm uppercase tracking-[0.18em] text-neutral-500 hover:text-black"
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
              className="ml-3 cursor-pointer underline"
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
                const artist = product?.artist;
                const title = product?.title || line.merchandiseTitle;
                const artworkHref = product?.handle ? `/artworks/${product.handle}` : null;
                const additionalInfoLines = product?.additionalInfo
                  ? product.additionalInfo.split(/\n+/).filter(Boolean)
                  : [];
                const quantityAvailable = line.quantityAvailable;
                const showQuantityControls =
                  typeof quantityAvailable === "number"
                    ? quantityAvailable > 1 || line.quantity > 1
                    : true;
                const canIncrease =
                  typeof quantityAvailable === "number" ? line.quantity < quantityAvailable : true;
                const priceLabel = (() => {
                  if (!line.price) return "Price on request";
                  const amount = Number(line.price.amount);
                  if (!Number.isFinite(amount)) return "Price on request";
                  return formatCurrency(amount, line.price.currencyCode) || "Price on request";
                })();
                const imageElement = image?.url ? (
                  <Image
                    src={image.url}
                    alt={image.altText || product?.title || 'Artwork'}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                ) : null;

                const infoContent = (
                  <div className="space-y-1.5 text-sm leading-snug text-neutral-700">
                    {artist ? (
                      <p className="font-medium text-neutral-900">{artist}</p>
                    ) : null}
                    <p className="text-neutral-900">
                      <span className="italic">{title}</span>
                      {product?.year ? <span>, {product.year}</span> : null}
                    </p>
                    {product?.medium ? <p>{product.medium}</p> : null}
                    {product?.dimensions ? <p>{product.dimensions}</p> : null}
                    {additionalInfoLines.map((infoLine, idx) => (
                      <p key={idx} className="text-neutral-500">
                        {infoLine}
                      </p>
                    ))}
                    <p className="pt-1 font-medium text-neutral-900">{priceLabel}</p>
                  </div>
                );

                return (
                  <li key={line.id} className="py-6">
                    <div className="grid grid-cols-[96px_1fr] gap-4">
                      {artworkHref ? (
                        <Link
                          href={artworkHref}
                          className="relative block h-24 w-24 cursor-pointer bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                          aria-label={`View artwork ${title}`}
                        >
                          {imageElement}
                        </Link>
                      ) : (
                        <div className="relative h-24 w-24 bg-neutral-100">{imageElement}</div>
                      )}
                      <div className="flex flex-col">
                        {artworkHref ? (
                          <Link
                            href={artworkHref}
                            className="group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
                          >
                            {infoContent}
                          </Link>
                        ) : (
                          infoContent
                        )}
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="mt-4 self-start cursor-pointer text-xs uppercase tracking-[0.2em] text-neutral-500 underline-offset-4 hover:underline"
                          aria-label={`Remove ${title} from cart`}
                        >
                          Remove
                        </button>
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
              className="flex-1 cursor-pointer border border-neutral-300 px-4 py-2 text-sm uppercase tracking-[0.18em] hover:border-neutral-900"
              onClick={closeCart}
            >
              Continue browsing
            </button>
            <button
              type="button"
              onClick={handleCheckout}
              disabled={empty || checkoutLoading}
              className={`flex-1 px-4 py-2 text-sm uppercase tracking-[0.18em] text-white transition ${
                empty || checkoutLoading
                  ? 'bg-neutral-400 cursor-not-allowed'
                  : 'bg-neutral-900 cursor-pointer hover:bg-black'
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
