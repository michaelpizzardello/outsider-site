type PixelEventName =
  | "PageView"
  | "ViewContent"
  | "Search"
  | "AddToWishlist"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"
  | "Contact"
  | "Subscribe"
  | "StartTrial";

type PixelEventParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function getFbq() {
  if (typeof window === "undefined") return undefined;
  return window.fbq;
}

export function trackPixelEvent(
  event: PixelEventName,
  params?: PixelEventParams
): void {
  const fbq = getFbq();
  if (!fbq) return;

  try {
    if (params && Object.keys(params).length > 0) {
      fbq("track", event, params);
    } else {
      fbq("track", event);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error(`[pixel] Failed to dispatch ${event}:`, error);
    }
  }
}

