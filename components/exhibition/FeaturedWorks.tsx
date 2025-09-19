import "server-only";
import Image from "next/image";

import { shopifyFetch } from "@/lib/shopify";

type Money = { amount: string; currencyCode: string };
type Img = { url: string; width?: number; height?: number; alt?: string };

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

  // Derive orientation and aspect for layout decisions
  const derived = nodes.map((p) => {
    const w = p.featuredImage?.width ?? 0;
    const h = p.featuredImage?.height ?? 0;
    const isLandscape = w > 0 && h > 0 ? w / h > 1.05 : false; // small threshold to avoid near-square
    const aspect = w > 0 && h > 0 ? `${w}/${h}` : "4/5";
    return { p, isLandscape, aspect };
  });
  // Build blocks without reordering (row planner):
  // - Landscapes become FULL rows (single wide block)
  // - Portraits pack into PAIRs; use one TRIPLE when it cleans up an odd run
  type Item = typeof derived[number];
  type Block =
    | { type: "landscape"; item: Item }
    | { type: "pairPortrait"; items: [Item, Item] }
    | { type: "triplePortrait"; items: [Item, Item, Item] }
    | { type: "singlePortrait"; item: Item };

  const blocks: Block[] = [];

  let usedTriple = false;
  const buf: Item[] = [];

  function flushPortraits(forceSingle = false) {
    // If we have 3 and triple not used, emit a TRIPLE
    if (!usedTriple && buf.length >= 3) {
      const triple: [Item, Item, Item] = [buf.shift()!, buf.shift()!, buf.shift()!];
      blocks.push({ type: "triplePortrait", items: triple });
      usedTriple = true;
    }
    // Emit PAIRs
    while (buf.length >= 2) {
      const pair: [Item, Item] = [buf.shift()!, buf.shift()!];
      blocks.push({ type: "pairPortrait", items: pair });
    }
    // Optionally allow a single portrait row (full-width) when needed
    if (buf.length === 1 && forceSingle) {
      blocks.push({ type: "singlePortrait", item: buf.shift()! });
    }
  }

  for (let i = 0; i < derived.length; i++) {
    const a = derived[i];
    if (a.isLandscape) {
      // Flush portraits before a full-width landscape; avoid reordering
      flushPortraits(true);
      blocks.push({ type: "landscape", item: a });
      continue;
    }
    // Portrait
    buf.push(a);
    const next = derived[i + 1];
    // If we have 3 and haven't used triple yet, emit now (keeps order tidy)
    if (!usedTriple && buf.length === 3) {
      flushPortraits(false);
      continue;
    }
    // If the next item is landscape, try not to leave a 2+portrait buffer hanging
    if (next?.isLandscape) {
      flushPortraits(true);
      continue;
    }
  }
  // End: flush any remaining portraits
  flushPortraits(true);

  if (nodes.length === 0) return null;

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 md:px-8 xl:px-16 2xl:px-24 py-10 md:py-14">
        {/* Section title above the grid (White Cube pattern) */}
        <h2 className="text-xl font-medium mb-8 md:mb-12">Featured Works</h2>

        {/* Grid of works (2-col at md+, with occasional full-width rows) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 sm:gap-x-10 md:gap-x-12 lg:gap-x-16 xl:gap-x-20 2xl:gap-x-24 gap-y-8 sm:gap-y-10 md:gap-y-12 lg:gap-y-16 xl:gap-y-20 2xl:gap-y-24">
          {blocks.map((block, idx) => {
            if (block.type === "landscape") {
              const { p, aspect } = block.item;
              const artist = getArtistName(p, fallbackArtist);
              const price = p.priceRange?.minVariantPrice ?? undefined;
              const label = priceLabel({ price, status: p.status?.value, availableForSale: p.availableForSale });
              const img = p.featuredImage;
              return (
                <article key={`land-${idx}`} className="group md:col-span-2">
                  {img ? (
                    <div className="relative bg-white overflow-hidden" style={{ aspectRatio: aspect as any }}>
                      <Image
                        src={img.url}
                        alt={img.altText || p.title}
                        fill
                        sizes="(min-width:768px) 100vw, 100vw"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="bg-neutral-100" style={{ aspectRatio: "4/5" }} />
                  )}
                  <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 md:gap-x-6">
                    <div className="min-w-[180px] sm:min-w-[220px] flex-1 min-w-0 text-xs">
                      {artist && <p className="font-medium truncate">{artist}</p>}
                      <p className="mt-1 break-words underline-offset-4 group-hover:underline">
                        <span className="italic">{p.title}</span>
                        {p.year?.value && <span>, {p.year.value}</span>}
                      </p>
                      <p className="mt-2 font-medium">{label}</p>
                    </div>
                    <div className="flex shrink-0 items-start justify-end">
                      <button
                        type="button"
                        className="inline-flex h-8 items-center rounded border border-neutral-300 px-2 text-xs hover:border-black"
                        aria-label="Enquire about artwork"
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </article>
              );
            }

            if (block.type === "pairPortrait") {
              const [a, b] = block.items;
              return (
                <div key={`pair-${idx}`} className="md:col-span-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 sm:gap-x-10 md:gap-x-12 lg:gap-x-16 xl:gap-x-20 2xl:gap-x-24 gap-y-8 sm:gap-y-10 md:gap-y-0">
                    {[a, b].map(({ p, aspect }) => {
                      const artist = getArtistName(p, fallbackArtist);
                      const price = p.priceRange?.minVariantPrice ?? undefined;
                      const label = priceLabel({ price, status: p.status?.value, availableForSale: p.availableForSale });
                      const img = p.featuredImage;
                      return (
                        <article key={p.id} className="group">
                          {img ? (
                            <div className="relative bg-white overflow-hidden" style={{ aspectRatio: aspect as any }}>
                              <Image
                                src={img.url}
                                alt={img.altText || p.title}
                                fill
                                sizes="(min-width:768px) 50vw, 100vw"
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="bg-neutral-100" style={{ aspectRatio: "4/5" }} />
                          )}
                          <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 md:gap-x-6">
                            <div className="min-w-[180px] sm:min-w-[220px] flex-1 min-w-0 text-xs">
                              {artist && <p className="font-medium truncate">{artist}</p>}
                              <p className="mt-1 break-words underline-offset-4 group-hover:underline">
                                <span className="italic">{p.title}</span>
                                {p.year?.value && <span>, {p.year.value}</span>}
                              </p>
                              <p className="mt-2 font-medium">{label}</p>
                            </div>
                            <div className="flex shrink-0 items-start justify-end">
                              <button
                                type="button"
                                className="inline-flex h-8 items-center rounded border border-neutral-300 px-2 text-xs hover:border-black"
                                aria-label="Enquire about artwork"
                              >
                                Enquire
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (block.type === "triplePortrait") {
              const items = block.items;
              return (
                <div key={`triple-${idx}`} className="md:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 sm:gap-x-10 md:gap-x-12 lg:gap-x-16 xl:gap-x-20 2xl:gap-x-24 gap-y-8 sm:gap-y-0">
                    {items.map(({ p, aspect }) => {
                      const artist = getArtistName(p, fallbackArtist);
                      const price = p.priceRange?.minVariantPrice ?? undefined;
                      const label = priceLabel({ price, status: p.status?.value, availableForSale: p.availableForSale });
                      const img = p.featuredImage;
                      return (
                        <article key={p.id} className="group">
                          {img ? (
                            <div className="relative bg-white overflow-hidden" style={{ aspectRatio: aspect as any }}>
                              <Image
                                src={img.url}
                                alt={img.altText || p.title}
                                fill
                                sizes="(min-width:640px) 33vw, 100vw"
                                className="object-contain"
                              />
                            </div>
                          ) : (
                            <div className="bg-neutral-100" style={{ aspectRatio: "4/5" }} />
                          )}
                          <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 md:gap-x-6">
                            <div className="min-w-[180px] sm:min-w-[220px] flex-1 min-w-0 text-xs">
                              {artist && <p className="font-medium truncate">{artist}</p>}
                              <p className="mt-1 break-words underline-offset-4 group-hover:underline">
                                <span className="italic">{p.title}</span>
                                {p.year?.value && <span>, {p.year.value}</span>}
                              </p>
                              <p className="mt-2 font-medium">{label}</p>
                            </div>
                            <div className="flex shrink-0 items-start justify-end">
                              <button
                                type="button"
                                className="inline-flex h-8 items-center rounded border border-neutral-300 px-2 text-xs hover:border-black"
                                aria-label="Enquire about artwork"
                              >
                                Enquire
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (block.type === "singlePortrait") {
              const { p, aspect } = block.item;
              const artist = getArtistName(p, fallbackArtist);
              const price = p.priceRange?.minVariantPrice ?? undefined;
              const label = priceLabel({ price, status: p.status?.value, availableForSale: p.availableForSale });
              const img = p.featuredImage;
              return (
                <article key={`sp-${idx}`} className="group md:col-span-2">
                  {img ? (
                    <div className="relative bg-white overflow-hidden" style={{ aspectRatio: aspect as any }}>
                      <Image
                        src={img.url}
                        alt={img.altText || p.title}
                        fill
                        sizes="(min-width:768px) 100vw, 100vw"
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="bg-neutral-100" style={{ aspectRatio: "4/5" }} />
                  )}
                  <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 md:gap-x-6">
                    <div className="min-w-[180px] sm:min-w-[220px] flex-1 min-w-0 text-xs">
                      {artist && <p className="font-medium truncate">{artist}</p>}
                      <p className="mt-1 break-words underline-offset-4 group-hover:underline">
                        <span className="italic">{p.title}</span>
                        {p.year?.value && <span>, {p.year.value}</span>}
                      </p>
                      <p className="mt-2 font-medium">{label}</p>
                    </div>
                    <div className="flex shrink-0 items-start justify-end">
                      <button
                        type="button"
                        className="inline-flex h-8 items-center rounded border border-neutral-300 px-2 text-xs hover:border-black"
                        aria-label="Enquire about artwork"
                      >
                        Enquire
                      </button>
                    </div>
                  </div>
                </article>
              );
            }
          })}
        </div>
      </div>
    </section>
  );
}
