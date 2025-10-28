// app/artists/[handle]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ArtistHero from "@/components/artists/ArtistHero";
import ArtistBioSection from "@/components/artists/ArtistBioSection";
import ArtistArtworks from "@/components/artists/ArtistArtworks";
import ArtistExhibitions from "@/components/artists/ArtistExhibitions";
import InstallationViews from "@/components/exhibition/InstallationViews";
import type { PortraitVideoSource } from "@/components/media/PortraitVideoPlayer";
import ArtistJsonLd from "@/components/seo/ArtistJsonLd";
import { shopifyFetch } from "@/lib/shopify";
import { extractLongCopy } from "@/lib/extractLongCopy";
import { toHtml } from "@/lib/richtext";
import { isDraftStatus } from "@/lib/isDraftStatus";
import { siteConfig, getAbsoluteUrl } from "@/lib/siteConfig";

export const dynamic = "force-dynamic";

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
  | {
      __typename: "Video";
      sources?: Array<{ url: string; mimeType?: string | null } | null> | null;
      previewImage?: {
        url: string | null;
        width?: number | null;
        height?: number | null;
        altText?: string | null;
      } | null;
    }
  | { __typename: string };

type Field = {
  key: string;
  type: string;
  value: string;
  reference: FieldRef | null;
  references?: { nodes?: Array<FieldRef | null> | null } | Array<FieldRef | null> | null;
};

type CoverImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
};

type ExtractLongCopyField = {
  key: string;
  type: string;
  value: unknown;
};

type ByHandleQuery = {
  metaobject: { handle: string; fields: Field[]; updatedAt?: string | null } | null;
};

const QUERY = /* GraphQL */ `
  query ArtistByHandle($handle: String!) {
    metaobject(handle: { type: "artist", handle: $handle }) {
      handle
      updatedAt
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
          ... on Video {
            sources { url mimeType }
            previewImage { url width height altText }
          }
        }
        references(first: 50) {
          nodes {
            __typename
            ... on MediaImage {
              image { url width height altText }
            }
            ... on GenericFile {
              url
              previewImage { url }
            }
            ... on Video {
              sources { url mimeType }
              previewImage { url width height altText }
            }
          }
        }
      }
    }
  }
`;

function looksLikeHtml(value: string) {
  return /<\s*[a-z][\s\S]*>/i.test(value);
}

function multilineToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => `<p>${segment.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}

function fieldByKeys(fields: Field[], keys: string[]): Field | undefined {
  const lowerKeys = keys.map((key) => key.toLowerCase());
  return fields.find((field) => lowerKeys.includes(field.key.toLowerCase()));
}

function fieldToHtml(field?: Field): string | null {
  if (!field) return null;
  if (typeof field.value !== "string") return null;
  const trimmed = field.value.trim();
  if (!trimmed) return null;

  const type = field.type?.toLowerCase() ?? "";
  if (type.includes("rich_text")) {
    return toHtml(trimmed) ?? null;
  }

  if (looksLikeHtml(trimmed)) {
    return trimmed;
  }

  return multilineToHtml(trimmed);
}

function stripHtml(input: string): string {
  return input.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim();
}

function fallbackBioHtml(fields: Field[]): string | null {
  const bioLike: ExtractLongCopyField[] = fields
    .filter((field) => /bio/i.test(field.key))
    .map(({ key, type, value }) => ({ key, type, value }));

  if (!bioLike.length) return null;
  return extractLongCopy(bioLike);
}

function imageFromField(field?: Field): CoverImage | null {
  if (!field) return null;

  const ref = field.reference;

  if (ref && ref.__typename === "MediaImage" && "image" in ref && ref.image?.url) {
    return {
      url: ref.image.url,
      width: ref.image.width,
      height: ref.image.height,
      alt: ref.image.altText ?? undefined,
    };
  }

  if (ref && ref.__typename === "GenericFile") {
    if (ref.url) return { url: ref.url };
    if (ref.previewImage?.url) return { url: ref.previewImage.url };
  }

  if (typeof field.value === "string" && field.value.startsWith("http")) {
    return { url: field.value };
  }

  return null;
}

function imageFromReference(ref?: FieldRef | null): CoverImage | null {
  if (!ref) return null;

  if (ref.__typename === "MediaImage" && ref.image?.url) {
    return {
      url: ref.image.url,
      width: typeof ref.image.width === "number" ? ref.image.width : undefined,
      height: typeof ref.image.height === "number" ? ref.image.height : undefined,
      alt: ref.image.altText ?? undefined,
    };
  }

  if (ref.__typename === "GenericFile") {
    if (ref.url) return { url: ref.url };
    if (ref.previewImage?.url) return { url: ref.previewImage.url };
  }

  if (ref.__typename === "Video" && ref.previewImage?.url) {
    return {
      url: ref.previewImage.url,
      width: typeof ref.previewImage.width === "number" ? ref.previewImage.width : undefined,
      height:
        typeof ref.previewImage.height === "number" ? ref.previewImage.height : undefined,
      alt: ref.previewImage.altText ?? undefined,
    };
  }

  return null;
}

function isProbablyVideo(url: string) {
  return /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url);
}

function videoFromField(field?: Field): PortraitVideoSource | null {
  if (!field) return null;

  const ref = field.reference;
  if (ref && ref.__typename === "Video") {
    const sources = Array.isArray(ref.sources) ? ref.sources : [];
    const source = sources.find((item) => item?.url);
    if (source?.url) {
      return {
        url: source.url,
        mimeType: source.mimeType ?? undefined,
        poster: ref.previewImage?.url
          ? {
              url: ref.previewImage.url,
              width:
                typeof ref.previewImage.width === "number"
                  ? ref.previewImage.width
                  : undefined,
              height:
                typeof ref.previewImage.height === "number"
                  ? ref.previewImage.height
                  : undefined,
              alt: ref.previewImage.altText ?? undefined,
            }
          : undefined,
      };
    }
  }

  if (ref && ref.__typename === "GenericFile") {
    const fileUrl =
      ref.url ||
      (typeof field.value === "string" && field.value.startsWith("http")
        ? field.value
        : null);
    if (fileUrl && isProbablyVideo(fileUrl)) {
      return {
        url: fileUrl,
        poster: ref.previewImage?.url
          ? {
              url: ref.previewImage.url,
            }
          : undefined,
      };
    }
  }

  if (typeof field.value === "string" && field.value.startsWith("http")) {
    if (isProbablyVideo(field.value)) {
      return { url: field.value };
    }
  }

  return null;
}

function coverFromFields(fields: Field[]): CoverImage | null {
  // Prefer a portrait image when available so the hero matches exhibition layouts.
  const portraitField = fieldByKeys(fields, ["portrait", "portrait_image", "portraitimage"]);
  const portraitImage = imageFromField(portraitField);
  if (portraitImage) return portraitImage;

  const coverField = fieldByKeys(fields, ["coverimage", "cover_image", "cover"]);
  const coverImage = imageFromField(coverField);
  if (coverImage) return coverImage;

  return null;
}

function collectCarouselImages(fields: Field[]): CoverImage[] {
  const carouselField = fieldByKeys(fields, ["carousel", "carousel_images", "image_carousel"]);
  if (!carouselField) return [];

  const referencesAny = carouselField.references as
    | { nodes?: Array<FieldRef | null> | null }
    | Array<FieldRef | null>
    | null
    | undefined;

  const referenceNodes: Array<FieldRef | null> = Array.isArray(referencesAny)
    ? referencesAny
    : Array.isArray(referencesAny?.nodes)
    ? referencesAny.nodes ?? []
    : [];

  const fromRefs = referenceNodes
    .map((ref) => imageFromReference(ref ?? undefined))
    .filter((img): img is CoverImage => Boolean(img));
  if (fromRefs.length) return fromRefs;

  const single = imageFromField(carouselField);
  return single ? [single] : [];
}

export async function generateMetadata({
  params,
}: {
  params: { handle: string };
}): Promise<Metadata> {
  const handle = params.handle;

  try {
    const data = await shopifyFetch<ByHandleQuery>(QUERY, { handle });
    const mo = data.metaobject;
    if (!mo) {
      return { title: "Artist | Outsider Gallery" };
    }

    const statusField = mo.fields.find(
      (field) => field.key.toLowerCase() === "status"
    );
    const statusValue =
      typeof statusField?.value === "string" ? statusField.value : undefined;
    if (isDraftStatus(statusValue)) {
      return { title: "Artist | Outsider Gallery" };
    }

    const valueMap = Object.fromEntries(
      mo.fields.map((field) => [field.key, field.value])
    );
    const name =
      (valueMap.name as string) ||
      (valueMap.title as string) ||
      mo.handle.replace(/[-_]/g, " ");

    const cover = coverFromFields(mo.fields);
    const shortBioHtml = fieldToHtml(
      fieldByKeys(mo.fields, ["short_bio", "shortbio", "bio_short"])
    );
    const longBioHtml =
      fieldToHtml(fieldByKeys(mo.fields, ["long_bio", "bio_long"])) ??
      fallbackBioHtml(mo.fields);
    const bioText = shortBioHtml
      ? stripHtml(shortBioHtml)
      : longBioHtml
      ? stripHtml(longBioHtml)
      : `Discover ${name} at Outsider Gallery, a contemporary art gallery in Surry Hills, Sydney.`;

    const imageUrl = cover?.url;

    return {
      title: `${name} | Outsider Gallery`,
      description: bioText,
      alternates: {
        canonical: `/artists/${mo.handle}`,
      },
      openGraph: {
        type: "profile",
        title: `${name} | Outsider Gallery`,
        description: bioText,
        url: getAbsoluteUrl(`/artists/${mo.handle}`),
        siteName: siteConfig.name,
        images: imageUrl
          ? [
              {
                url: imageUrl.startsWith("http")
                  ? imageUrl
                  : getAbsoluteUrl(imageUrl),
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${name} | Outsider Gallery`,
        description: bioText,
        images: imageUrl
          ? [
              imageUrl.startsWith("http") ? imageUrl : getAbsoluteUrl(imageUrl),
            ]
          : undefined,
      },
      other: {
        "last-modified": mo.updatedAt ?? undefined,
      },
    };
  } catch (error) {
    console.error("[artists/[handle]] generateMetadata error", {
      handle,
      error,
    });
    return { title: "Artist | Outsider Gallery" };
  }
}

export default async function ArtistPage({ params }: { params: { handle: string } }) {
  const data = await shopifyFetch<ByHandleQuery>(QUERY, { handle: params.handle });
  const mo = data.metaobject;
  if (!mo) notFound();

  const statusField = mo.fields.find((field) => field.key.toLowerCase() === "status");
  const statusValue = typeof statusField?.value === "string" ? statusField.value : undefined;
  if (isDraftStatus(statusValue)) notFound();

  const valueMap = Object.fromEntries(mo.fields.map((field) => [field.key, field.value]));
  const name = (valueMap.name as string) || (valueMap.title as string) || mo.handle;
  const cover = coverFromFields(mo.fields);
  const nationality = (
    valueMap.nationality ?? valueMap.country ?? valueMap.origin ?? valueMap.nationalityshort
  ) as string | undefined;
  const birthYear = (
    valueMap.birthyear ??
    valueMap.birth_year ??
    valueMap.birth ??
    valueMap.born ??
    valueMap.birthdate
  ) as string | undefined;
  const portraitVideo =
    videoFromField(fieldByKeys(mo.fields, ["video", "portrait_video", "artist_video"])) ?? null;
  const shortBioHtml =
    fieldToHtml(fieldByKeys(mo.fields, ["short_bio", "shortbio", "bio_short"])) ?? null;
  const longBioHtml =
    fieldToHtml(fieldByKeys(mo.fields, ["long_bio", "longbio", "bio_long"])) ??
    fallbackBioHtml(mo.fields);
  const carouselImages = collectCarouselImages(mo.fields);

  return (
    <main
      className="bg-white text-neutral-900"
      style={{ paddingTop: "var(--header-h, 76px)" }}
    >
      <ArtistJsonLd
        handle={mo.handle}
        name={name}
        bio={shortBioHtml ?? longBioHtml}
        nationality={nationality ?? null}
        birthYear={birthYear ?? null}
        imageUrl={cover?.url ?? null}
      />
      <ArtistHero
        name={name}
        nationality={nationality}
        birthYear={birthYear}
        cover={cover}
      />
      <ArtistBioSection
        shortHtml={shortBioHtml}
        longHtml={longBioHtml}
        portraitVideo={portraitVideo}
        artistName={name}
      />
      {carouselImages.length ? (
        <InstallationViews images={carouselImages} showTitle={false} />
      ) : null}
      <ArtistArtworks artistHandle={mo.handle} artistName={name} />
      <ArtistExhibitions artistHandle={mo.handle} artistName={name} />
    </main>
  );
}
