import { getAbsoluteUrl, siteConfig } from "@/lib/siteConfig";

type ArtistJsonLdProps = {
  handle: string;
  name: string;
  bio?: string | null;
  nationality?: string | null;
  birthYear?: string | null;
  imageUrl?: string | null;
};

export default function ArtistJsonLd({
  handle,
  name,
  bio,
  nationality,
  birthYear,
  imageUrl,
}: ArtistJsonLdProps) {
  const cleanDescription =
    bio?.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim() ?? undefined;

  const payload = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    description: cleanDescription,
    nationality: nationality ?? undefined,
    birthDate: birthYear ?? undefined,
    image: imageUrl
      ? imageUrl.startsWith("http")
        ? imageUrl
        : getAbsoluteUrl(imageUrl)
      : undefined,
    url: getAbsoluteUrl(`/artists/${handle}`),
    worksFor: {
      "@type": "ArtGallery",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
