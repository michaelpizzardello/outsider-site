import "server-only";

import Image from "next/image";
import Link from "next/link";

import Container from "@/components/layout/Container";
import { shopifyFetch } from "@/lib/shopify";

type Money = { amount: string; currencyCode: string };

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  vendor?: string | null;
  availableForSale: boolean;
  featuredImage?: { url: string; width?: number | null; height?: number | null; altText?: string | null } | null;
  priceRange?: { minVariantPrice?: Money | null } | null;
  year?: { value?: string | null } | null;
  medium?: { value?: string | null } | null;
  artistMeta?: {
    value?: string | null;
    reference?: {
      __typename: string;
      handle?: string | null;
      type?: string | null;
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

type Props = {
  artistHandle: string;
  artistName: string;
};

const QUERY = /* GraphQL */ `
  query ArtistArtworks(
    $first: Int = 80
    $ns: String = "custom"
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
        medium: metafield(namespace: $ns, key: "medium") { value }
        artistMeta: metafield(namespace: $ns, key: $artistKey) {
          value
          reference {
            __typename
            ... on Metaobject {
              handle
              type
            }
          }
        }
        exhibitions: metafield(namespace: $ns, key: "exhibitions") {
          reference { __typename ... on Metaobject { handle type } }
          references(first: 20) {
            nodes { __typename ... on Metaobject { handle type } }
          }
        }
      }
    }
  }
`;

function priceLabel({ price, availableForSale }: { price?: Money | null; availableForSale: boolean }): string {
  if (!availableForSale) return "Sold";
  if (price) {
    const amount = Number(price.amount);
    try {
      return new Intl.NumberFormat("en-GB", {
        style: "currency",
        currency: price.currencyCode,
        maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
      }).format(amount);
    } catch {
      return `${price.currencyCode} ${amount.toLocaleString("en-GB")}`;
    }
  }
  return "Price on request";
}

function matchesArtist(node: ProductNode, handle: string, artistName: string): boolean {
  const refHandle = node.artistMeta?.reference?.handle;
  if (refHandle && refHandle.toLowerCase() === handle.toLowerCase()) return true;

  const metaValue = node.artistMeta?.value?.trim().toLowerCase();
  if (metaValue && metaValue === artistName.trim().toLowerCase()) return true;

  const vendorName = node.vendor?.trim().toLowerCase();
  if (vendorName && vendorName === artistName.trim().toLowerCase()) return true;

  return false;
}

function firstExhibitionHandle(node: ProductNode): string | null {
  const ref = node.exhibitions?.reference;
  if (ref?.__typename === "Metaobject" && ref.handle) return ref.handle;
  const nodes = node.exhibitions?.references?.nodes || [];
  const found = nodes.find((n) => n?.__typename === "Metaobject" && n.handle);
  return found?.handle ?? null;
}

function ArtworkCard({
  product,
  href,
}: {
  product: ProductNode;
  href?: string | null;
}) {
  const img = product.featuredImage;
  const showLink = Boolean(href);
  const Wrapper = showLink ? Link : ("div" as const);
  const wrapperProps = showLink
    ? { href: href!, className: "block focus:outline-none focus-visible:ring-2 focus-visible:ring-black" }
    : { className: "block" };

  return (
    <article className="group">
      <Wrapper {...(wrapperProps as any)}>
        {img ? (
          <div className="relative bg-white" style={{ aspectRatio: img.width && img.height ? `${img.width}/${img.height}` : "4/5" }}>
            <Image
              src={img.url}
              alt={img.altText || product.title}
              fill
              sizes="(min-width:768px) 50vw, 100vw"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="bg-neutral-100" style={{ aspectRatio: "4/5" }} />
        )}
      </Wrapper>
      <div className="mt-4 flex flex-col gap-2">
        <div>
          {product.medium?.value ? (
            <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">
              {product.medium.value}
            </p>
          ) : null}
          <p className="mt-2 text-base font-medium leading-relaxed">
            <span className="italic">{product.title}</span>
            {product.year?.value ? <span>, {product.year.value}</span> : null}
          </p>
        </div>
        <div className="text-sm leading-relaxed text-neutral-600">
          {priceLabel({ price: product.priceRange?.minVariantPrice ?? null, availableForSale: product.availableForSale })}
        </div>
        <div className="pt-2">
          <button
            type="button"
            className="inline-flex items-center justify-center border border-neutral-300 px-4 py-2 text-sm uppercase tracking-[0.14em] transition hover:border-neutral-900"
          >
            Enquire
          </button>
        </div>
      </div>
    </article>
  );
}

export default async function ArtistArtworks({ artistHandle, artistName }: Props) {
  const data = await shopifyFetch<QueryResult>(QUERY, {
    first: 80,
    ns: "custom",
    artistKey: "artist",
  });

  const products = data?.products?.nodes ?? [];
  const filtered = products.filter((node) => matchesArtist(node, artistHandle, artistName));

  if (!filtered.length) return null;

  return (
    <section className="w-full py-12 md:py-16">
      <Container>
        <h2 className="mb-8 text-2xl font-medium tracking-tight sm:text-3xl lg:mb-12 lg:text-4xl">Artworks</h2>
        <div className="grid grid-cols-1 gap-y-12 gap-x-10 md:grid-cols-2 md:gap-y-16 md:gap-x-14">
          {filtered.map((product) => {
            const exhibitionHandle = firstExhibitionHandle(product);
            const href = exhibitionHandle
              ? `/exhibitions/${exhibitionHandle}/artworks/${product.handle}`
              : null;
            return <ArtworkCard key={product.id} product={product} href={href} />;
          })}
        </div>
      </Container>
    </section>
  );
}
