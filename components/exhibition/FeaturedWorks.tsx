import "server-only";
import Image from "next/image";
import Link from "next/link";

import Container from "@/components/layout/Container";
import { ArrowCtaLink } from "@/components/ui/ArrowCta";
import { shopifyFetch } from "@/lib/shopify";

type Money = { amount: string; currencyCode: string };
type Props = {
  exhibitionHandle: string;
  /** Fallback if the product doesn't resolve an artist metaobject */
  fallbackArtist?: string | null;
};

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  availableForSale: boolean;
  featuredImage?: { url: string; width?: number; height?: number; altText?: string | null } | null;
  priceRange?: { minVariantPrice?: Money | null } | null;
  year?: { value?: string | null } | null;
  status?: { value?: string | null } | null;
  artistMeta?: {
    reference?: {
      __typename: string;
      handle?: string;
      type?: string;
      fields?: Array<{ key: string; value: string } | null> | null;
    } | null;
  } | null;
  exhibitions?: {
    reference?: { __typename: string; handle?: string | null } | null;
    references?: { nodes?: Array<{ __typename: string; handle?: string | null } | null> | null } | null;
  } | null;
};

type QueryResult = {
  products: { nodes: ProductNode[] } | null;
};

const QUERY = /* GraphQL */ `
  query FeaturedWorks(
    $first: Int = 80
    $ns: String = "custom"
    $exKey: String = "exhibitions"
    $artistKey: String = "artist"
  ) {
    products(first: $first, query: "status:active") {
      nodes {
        id
        handle
        title
        vendor
        availableForSale
        featuredImage { url width height altText }
        priceRange { minVariantPrice { amount currencyCode } }
        year: metafield(namespace: $ns, key: "year") { value }
        status: metafield(namespace: $ns, key: "status") { value }
        artistMeta: metafield(namespace: $ns, key: $artistKey) {
          reference {
            __typename
            ... on Metaobject {
              handle
              type
              fields { key value }
            }
          }
        }
        exhibitions: metafield(namespace: $ns, key: $exKey) {
          reference { __typename ... on Metaobject { handle type } }
          references(first: 50) {
            nodes { __typename ... on Metaobject { handle type } }
          }
        }
      }
    }
  }
`;

function priceLabel(p: {
  price?: Money | undefined;
  status?: string | null | undefined;
  availableForSale: boolean;
}): string {
  const s = (p.status || "").trim().toLowerCase();
  const isSold = s === "sold" || s === "reserved" || p.availableForSale === false;
  if (isSold) return "Sold";
  if (p.price) {
    const amount = Number(p.price.amount);
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: p.price.currencyCode,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      }).format(amount);
    } catch {
      return `${p.price.currencyCode} ${amount.toLocaleString("en-GB")}`;
    }
  }
  return "Price on request";
}

function getArtistName(n: ProductNode, fallback?: string | null): string | undefined {
  const fields = n.artistMeta?.reference && (n.artistMeta.reference as any).fields;
  if (Array.isArray(fields)) {
    const byKey = (k: string) => fields.find((f: any) => f?.key?.toLowerCase?.() === k)?.value?.trim?.();
    return (
      byKey("name") || byKey("title") || byKey("full_name") || byKey("fullName") || undefined
    );
  }
  return n.vendor ?? (fallback ?? undefined);
}

function productMatchesExhibition(n: ProductNode, handle: string): boolean {
  const ref = n.exhibitions?.reference;
  if (ref && ref.__typename === "Metaobject" && ref.handle === handle) return true;
  const nodes = n.exhibitions?.references?.nodes || [];
  return nodes?.some((r) => r?.__typename === "Metaobject" && r?.handle === handle) ?? false;
}

export default async function FeaturedWorks({
  exhibitionHandle,
  fallbackArtist,
}: Props) {
  // Fetch a light list of products and filter client-side by reference
  const data = await shopifyFetch<QueryResult>(QUERY, {
    first: 80,
    ns: "custom",
    exKey: "exhibitions",
    artistKey: "artist",
  });
  const all = data?.products?.nodes ?? [];
  const nodes = all.filter((p) => productMatchesExhibition(p, exhibitionHandle));

  if (nodes.length === 0) return null;

  const items = nodes.map((p) => {
    const w = p.featuredImage?.width ?? 0;
    const h = p.featuredImage?.height ?? 0;
    const aspectRatio = w > 0 && h > 0 ? `${w}/${h}` : undefined;
    const ratio = w > 0 && h > 0 ? w / h : 1;
    const heightFactor = ratio !== 0 ? 1 / ratio : 1;
    let type: "L" | "P" | "S" = "P";
    if (w > 0 && h > 0) {
      const ratio = w / h;
      if (ratio > 1.05) type = "L";
      else if (ratio < 0.95) type = "P";
      else type = "S";
    }
    return {
      product: p,
      aspectRatio,
      ratio,
      heightFactor,
      type,
    };
  });

  if (items.length === 0) return null;

  type Artwork = (typeof items)[number];
  type Row = { layout: "full" | "pair" | "triple"; items: Artwork[] };

  const rows: Row[] = [];
  const normType = (t: Artwork["type"]) => (t === "P" ? "P" : "L");

  for (let i = 0; i < items.length; ) {
    const remaining = items.length - i;
    const currentType = normType(items[i].type);

    const nextTypeMatches = (count: number) => {
      if (remaining < count) return false;
      for (let j = 0; j < count; j++) {
        if (normType(items[i + j].type) !== currentType) return false;
      }
      return true;
    };

    if (nextTypeMatches(4)) {
      rows.push({ layout: "pair", items: [items[i], items[i + 1]] });
      rows.push({ layout: "pair", items: [items[i + 2], items[i + 3]] });
      i += 4;
      continue;
    }

    if (nextTypeMatches(3)) {
      if (currentType === "P") {
        rows.push({ layout: "triple", items: [items[i], items[i + 1], items[i + 2]] });
      } else {
        rows.push({ layout: "full", items: [items[i]] });
        rows.push({ layout: "pair", items: [items[i + 1], items[i + 2]] });
      }
      i += 3;
      continue;
    }

    if (nextTypeMatches(2)) {
      rows.push({ layout: "pair", items: [items[i], items[i + 1]] });
      i += 2;
      continue;
    }

    rows.push({ layout: "full", items: [items[i]] });
    i += 1;
  }

  const renderArtwork = (
    art: Artwork,
    opts: { span: "full" | "half" | "third"; forcedAspectRatio?: number }
  ) => {
    const { product, aspectRatio } = art;
    const href = `/exhibitions/${exhibitionHandle}/artworks/${product.handle}`;
    const artist = getArtistName(product, fallbackArtist);
    const price = product.priceRange?.minVariantPrice ?? undefined;
    const label = priceLabel({
      price,
      status: product.status?.value,
      availableForSale: product.availableForSale,
    });
    const img = product.featuredImage;

    const sizeAttr =
      opts.span === "full"
        ? "(min-width:1024px) 100vw, 100vw"
        : opts.span === "third"
        ? "(min-width:1024px) 33vw, 100vw"
        : "(min-width:1024px) 50vw, 100vw";

    const wrapperAspect =
      typeof opts.forcedAspectRatio === "number"
        ? `${opts.forcedAspectRatio}`
        : aspectRatio;

    return (
      <div key={product.id} className="group flex h-full flex-col gap-y-8 md:gap-y-10">
        <Link
          href={href}
          className="block flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
        >
          {img ? (
            <div
              className="relative w-full overflow-hidden bg-white"
              style={
                wrapperAspect
                  ? { aspectRatio: wrapperAspect }
                  : { aspectRatio: opts.span === "full" ? "4 / 3" : "4 / 5" }
              }
            >
              <Image
                src={img.url}
                alt={img.altText || product.title}
                fill
                className="object-contain object-bottom transition duration-300 group-hover:scale-[1.01]"
                sizes={sizeAttr}
              />
            </div>
          ) : (
            <div className="bg-neutral-100" style={{ aspectRatio: "4 / 5" }} />
          )}
        </Link>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-8 gap-y-4 text-[15px] leading-snug">
          <Link
            href={href}
            className="min-w-[200px] flex-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            {artist && <p className="font-medium">{artist}</p>}
            <p className="mt-1 break-words underline-offset-4 group-hover:underline">
              <span className="italic">{product.title}</span>
              {product.year?.value && <span>, {product.year.value}</span>}
            </p>
            <p className="mt-2 font-medium">{label}</p>
          </Link>

          <div className="flex shrink-0 items-center gap-x-6 text-[13px] uppercase tracking-[0.2em]">
            <ArrowCtaLink
              href={href}
              label="View work"
              className="hidden uppercase tracking-[0.2em] sm:inline-flex"
              underline={false}
            />
            <Link
              href={`/enquire?artwork=${encodeURIComponent(product.id)}`}
              className="hover:underline"
            >
              Enquire
            </Link>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="w-full py-10 md:py-14">
      <Container>
        <h2 className="mb-8 text-2xl font-medium tracking-tight sm:text-3xl lg:mb-12 lg:text-4xl">Featured Works</h2>

        <div className="flex flex-col gap-y-16">
          {rows.map((row, idx) => {
            const maxHeightFactor = Math.max(
              ...row.items.map((item) => item.heightFactor || 1)
            );
            const forcedAspect = maxHeightFactor > 0 ? 1 / maxHeightFactor : undefined;

            if (row.layout === "full") {
              return (
                <div key={`full-${idx}`} className="grid grid-cols-1">
                  {renderArtwork(row.items[0], {
                    span: "full",
                    forcedAspectRatio: forcedAspect,
                  })}
                </div>
              );
            }

            if (row.layout === "pair") {
              return (
                <div
                  key={`pair-${idx}`}
                  className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 sm:items-end sm:gap-x-[6.5rem] xl:gap-x-[8rem]"
                >
                  {row.items.map((item) =>
                    renderArtwork(item, {
                      span: "half",
                      forcedAspectRatio: forcedAspect,
                    })
                  )}
                </div>
              );
            }

            return (
              <div
                key={`triple-${idx}`}
                className="grid grid-cols-1 gap-y-12 sm:grid-cols-3 sm:items-end sm:gap-x-[5.5rem] xl:gap-x-[7rem]"
              >
                {row.items.map((item) =>
                  renderArtwork(item, {
                    span: "third",
                    forcedAspectRatio: forcedAspect,
                  })
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
