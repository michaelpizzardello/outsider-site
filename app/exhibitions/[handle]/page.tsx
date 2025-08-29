// app/exhibitions/[handle]/page.tsx
import { notFound } from "next/navigation";
import { shopifyFetch } from "@/lib/shopify";

export const revalidate = 60;

type FieldRef =
  | {
      __typename: "MediaImage";
      image: {
        url: string;
        width: number;
        height: number;
        altText: string | null;
      };
    }
  | { __typename: "GenericFile"; url?: string; previewImage?: { url: string } }
  | { __typename: string };

type Field = {
  key: string;
  type: string;
  value: string;
  reference: FieldRef | null;
};
type ByHandleQuery = { metaobject: { handle: string; fields: Field[] } | null };

const QUERY = /* GraphQL */ `
  query ExhibitionByHandle($handle: MetaobjectHandleInput!) {
    metaobject(handle: $handle) {
      handle
      fields {
        key
        type
        value
        reference {
          __typename
          ... on MediaImage {
            image {
              url
              width
              height
              altText
            }
          }
          ... on GenericFile {
            url
            previewImage {
              url
            }
          }
        }
      }
    }
  }
`;

async function getExhibition(handle: string) {
  const data = await shopifyFetch<ByHandleQuery>(QUERY, {
    handle: { type: "exhibitions", handle },
  });
  return data.metaobject;
}

export default async function Page({ params }: { params: { handle: string } }) {
  const mo = await getExhibition(params.handle);
  if (!mo) return notFound();

  // Map fields you already use in `lib/exhibitions.ts` (title, artist, start, end, hero, summary, location)
  // Then render hero image, title/artist (with italic for solo), dates, location, summary/body.
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      {/* hero + body layout (reuse CurrentExhibitionHero styles if desired) */}
    </main>
  );
}
