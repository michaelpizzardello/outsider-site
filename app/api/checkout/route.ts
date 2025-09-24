import { NextResponse } from "next/server";

import { buildCartPermalink } from "@/lib/shopifyPermalink";

type CheckoutLine = {
  variantGid: string;
  quantity: number;
};

type Body = {
  lines?: CheckoutLine[];
  discount?: string;
};

export async function POST(request: Request) {
  const data = (await request.json()) as Body | null;
  const lines = Array.isArray(data?.lines) ? data!.lines : [];
  const discount = data?.discount;

  const url = buildCartPermalink(lines, { discount });

  return NextResponse.redirect(url, {
    status: 302,
  });
}
