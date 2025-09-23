'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Cart } from '@/lib/shopifyCart';

type CartStatus = 'idle' | 'loading';

type AddLineInput = {
  merchandiseId: string;
  quantity?: number;
  attributes?: Array<{ key: string; value: string }>;
};

type UpdateLineInput = { id: string; quantity?: number };

type CartContextValue = {
  cart: Cart | null;
  status: CartStatus;
  ready: boolean;
  drawerOpen: boolean;
  error: string | null;
  openCart: () => void;
  closeCart: () => void;
  addLine: (input: AddLineInput) => Promise<void>;
  updateLine: (input: UpdateLineInput) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  refresh: () => Promise<void>;
  clearError: () => void;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

async function requestCart(body: Record<string, unknown>) {
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || 'Cart request failed');
  }
  return data;
}

async function getCart() {
  const res = await fetch('/api/cart', { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Unable to fetch cart');
  }
  return res.json();
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [status, setStatus] = useState<CartStatus>('idle');
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const data = await getCart();
      setCart(data.cart ?? null);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to load cart');
      setCart(null);
    } finally {
      setStatus('idle');
      setReady(true);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const data = await getCart();
        if (!ignore) {
          setCart(data.cart ?? null);
          setReady(true);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err?.message ?? 'Unable to load cart');
          setReady(true);
        }
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const openCart = useCallback(() => setDrawerOpen(true), []);
  const closeCart = useCallback(() => setDrawerOpen(false), []);
  const clearError = useCallback(() => setError(null), []);

  const addLine = useCallback(async (input: AddLineInput) => {
    setStatus('loading');
    try {
      const data = await requestCart({ action: 'add', lines: [input] });
      setCart(data.cart ?? null);
      setDrawerOpen(true);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to add to cart');
    } finally {
      setStatus('idle');
    }
  }, []);

  const updateLine = useCallback(async (input: UpdateLineInput) => {
    setStatus('loading');
    try {
      const data = await requestCart({ action: 'update', updates: [input] });
      setCart(data.cart ?? null);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to update cart');
    } finally {
      setStatus('idle');
    }
  }, []);

  const removeLine = useCallback(async (lineId: string) => {
    setStatus('loading');
    try {
      const data = await requestCart({ action: 'remove', lineIds: [lineId] });
      setCart(data.cart ?? null);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? 'Unable to remove item');
    } finally {
      setStatus('idle');
    }
  }, []);

  const value = useMemo<CartContextValue>(() => ({
    cart,
    status,
    ready,
    drawerOpen,
    error,
    openCart,
    closeCart,
    addLine,
    updateLine,
    removeLine,
    refresh,
    clearError,
  }), [cart, status, ready, drawerOpen, error, openCart, closeCart, addLine, updateLine, removeLine, refresh, clearError]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return ctx;
}

