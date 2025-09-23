import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  cartCreate,
  cartFetch,
  cartLinesAdd,
  cartLinesRemove,
  cartLinesUpdate,
} from "@/lib/shopifyCart";

const CART_COOKIE = "outsider_cart_id";
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getCartCookie() {
  return cookies().get(CART_COOKIE)?.value ?? null;
}

function setCartCookie(id: string) {
  cookies().set(CART_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

function clearCartCookie() {
  cookies().delete(CART_COOKIE);
}

export async function GET() {
  const cartId = getCartCookie();
  if (!cartId) {
    return NextResponse.json({ cart: null });
  }

  try {
    const cart = await cartFetch(cartId);
    if (!cart) {
      clearCartCookie();
    }
    return NextResponse.json({ cart });
  } catch (error) {
    console.error("[cart][GET]", error);
    clearCartCookie();
    return NextResponse.json({ cart: null }, { status: 500 });
  }
}

type CartActionBody = {
  action: "get" | "create" | "add" | "update" | "remove" | "clear";
  lines?: Array<{
    merchandiseId: string;
    quantity?: number;
    attributes?: Array<{ key: string; value: string }>;
    sellingPlanId?: string;
  }>;
  updates?: Array<{ id: string; quantity?: number }>;
  lineIds?: string[];
};

export async function POST(request: Request) {
  let body: CartActionBody;
  try {
    body = (await request.json()) as CartActionBody;
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const cartIdFromCookie = getCartCookie();

  try {
    switch (body.action) {
      case "get": {
        if (!cartIdFromCookie) return NextResponse.json({ cart: null });
        const cart = await cartFetch(cartIdFromCookie);
        if (!cart) clearCartCookie();
        return NextResponse.json({ cart });
      }
      case "create": {
        const cart = await cartCreate();
        if (cart) setCartCookie(cart.id);
        return NextResponse.json({ cart });
      }
      case "add": {
        const lines = body.lines ?? [];
        if (!lines.length || !lines.every((line) => line.merchandiseId)) {
          return NextResponse.json({ error: "Missing merchandiseId in lines" }, { status: 400 });
        }

        let cartId = cartIdFromCookie;
        if (!cartId) {
          const cart = await cartCreate();
          if (!cart) throw new Error("Unable to create cart");
          cartId = cart.id;
          setCartCookie(cartId);
        }

        const cart = await cartLinesAdd(cartId, lines);
        return NextResponse.json({ cart });
      }
      case "update": {
        if (!cartIdFromCookie) {
          return NextResponse.json({ error: "Cart not found" }, { status: 404 });
        }
        const updates = body.updates ?? [];
        if (!updates.length) {
          return NextResponse.json({ error: "No updates provided" }, { status: 400 });
        }
        const cart = await cartLinesUpdate(cartIdFromCookie, updates);
        return NextResponse.json({ cart });
      }
      case "remove": {
        if (!cartIdFromCookie) {
          return NextResponse.json({ error: "Cart not found" }, { status: 404 });
        }
        const ids = body.lineIds ?? [];
        if (!ids.length) {
          return NextResponse.json({ error: "No lineIds provided" }, { status: 400 });
        }
        const cart = await cartLinesRemove(cartIdFromCookie, ids);
        return NextResponse.json({ cart });
      }
      case "clear": {
        if (cartIdFromCookie) {
          clearCartCookie();
        }
        return NextResponse.json({ cart: null });
      }
      default:
        return NextResponse.json({ error: "Unknown cart action" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("[cart][POST]", error);
    return NextResponse.json({ error: error?.message ?? "Cart request failed" }, { status: 500 });
  }
}

