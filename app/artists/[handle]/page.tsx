// app/artists/[handle]/page.tsx
import { notFound } from "next/navigation";
import { shopifyFetch } from "@/lib/shopify";

export const dynamic = "force-dynamic";

type FieldRef =
  | { __typename: "MediaImage"; image: { url: string; width: number; height: number; altText: string | null } }
  | { __typename: "GenericFile"; url?: string; previewImage?: { url: string } }
  | { __typename: string };

type Field = { key: string; type: string; value: string; reference: FieldRef | null };

type ByHandleQuery = { metaobject: { handle: string; fields: Field[] } | null };

const QUERY = /* GraphQL */ `
  query ArtistByHandle($handle: String!) {
    metaobject(handle: { type: "artist", handle: $handle }) {
      handle
      fields {
        key
        type
        value
        reference {
          __typename
          ... on MediaImage {
            image { url width height altText }
          }
          ... on GenericFile {
            url
            previewImage { url }
          }
        }
      }
    }
  }
`;

function coverFromFields(fields: Field[]): string | undefined {
  const f = fields.find(x => x.key === "coverimage");
  if (!f) return;
  if (f.reference && "image" in f.reference && f.reference.image?.url) return f.reference.image.url;
  if (f.reference && "url" in f.reference && f.reference.url) return f.reference.url;
  if (f.reference && "previewImage" in f.reference && f.reference.previewImage?.url) return f.reference.previewImage.url;
  if (typeof f.value === "string" && f.value.startsWith("http")) return f.value;
}

export default async function ArtistPage({ params }: { params: { handle: string } }) {
  const data = await shopifyFetch<ByHandleQuery>(QUERY, { handle: params.handle });
  const mo = data.metaobject;
  if (!mo) notFound();

  const valueMap = Object.fromEntries(mo.fields.map(f => [f.key, f.value]));
  const name = (valueMap.name as string) || (valueMap.title as string) || mo.handle;
  const cover = coverFromFields(mo.fields);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-medium mb-6">{name}</h1>
      {cover && (
        <div className="mb-6">
          <img src={cover} alt={name} className="w-full max-h-[560px] object-cover rounded-2xl" />
        </div>
      )}
    </main>
  );
}
