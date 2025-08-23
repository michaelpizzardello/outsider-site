// app/artists/page.tsx
import Link from "next/link";
import { shopifyFetch } from "@/lib/shopify";

export const dynamic = "force-dynamic";

type FieldRef =
  | {
      __typename: "MediaImage";
      image: { url: string; width: number; height: number; altText: string | null };
    }
  | {
      __typename: "GenericFile";
      url?: string;
      previewImage?: { url: string };
    }
  | { __typename: string };

type Field = {
  key: string;
  type: string;
  value: string;
  reference: FieldRef | null;
};

type Node = { handle: string; fields: Field[] };

type ArtistsQuery = {
  metaobjects: { nodes: Node[] } | null;
};

const QUERY = /* GraphQL */ `
  query ArtistsList {
    metaobjects(type: "artist", first: 100) {
      nodes {
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
  }
`;

function coverFromFields(fields: Field[]): string | undefined {
  // your store uses lowercase "coverimage"
  const f = fields.find(x => x.key === "coverimage");
  if (!f) return;
  // MediaImage
  if (f.reference && "image" in f.reference && f.reference.image?.url) {
    return f.reference.image.url;
  }
  // GenericFile fallback (not your case, but safe)
  if (f.reference && "url" in f.reference && f.reference.url) {
    return f.reference.url;
  }
  if (f.reference && "previewImage" in f.reference && f.reference.previewImage?.url) {
    return f.reference.previewImage.url;
  }
  // plain URL in value fallback
  if (typeof f.value === "string" && f.value.startsWith("http")) {
    return f.value;
  }
}

function labelFromFields(fields: Field[], handle: string) {
  const m = Object.fromEntries(fields.map(f => [f.key, f.value]));
  return (m.name as string) || (m.title as string) || handle;
}

export default async function ArtistsIndex() {
  const data = await shopifyFetch<ArtistsQuery>(QUERY);
  const nodes = data?.metaobjects?.nodes ?? [];

  const artists = nodes
    .map(n => ({
      handle: n.handle,
      fields: n.fields,
      label: labelFromFields(n.fields, n.handle),
      cover: coverFromFields(n.fields),
      sortkey:
        n.fields.find(f => f.key === "sortkey")?.value ||
        n.fields.find(f => f.key === "name")?.value ||
        n.handle,
    }))
    .sort((a, b) => a.sortkey.localeCompare(b.sortkey));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-medium mb-6">Artists</h1>

      {artists.length === 0 && <p className="text-neutral-600">No artists yet.</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {artists.map(a => (
          <Link key={a.handle} href={`/artists/${a.handle}`} className="block group">
            <div className="rounded-2xl shadow border border-neutral-200 overflow-hidden">
              {a.cover ? (
                <img src={a.cover} alt={a.label} className="w-full h-64 object-cover" />
              ) : (
                <div className="w-full h-64 bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">
                  no cover — key “coverimage”
                </div>
              )}
              <div className="p-4">
                <h3 className="text-lg group-hover:underline">{a.label}</h3>
                {!a.cover && (
                  <p className="mt-1 text-xs text-neutral-500">
                    debug: {JSON.stringify(a.fields.find(f => f.key === "coverimage"))}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
