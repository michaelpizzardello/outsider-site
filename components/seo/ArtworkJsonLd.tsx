import { getAbsoluteUrl, siteConfig } from "@/lib/siteConfig";

type ArtworkJsonLdProps = {
  handle: string;
  title: string;
  artist?: string | null;
  description?: string | null;
  medium?: string | null;
  imageUrl?: string | null;
  priceAmount?: string | null;
  priceCurrency?: string | null;
  availability?: "InStock" | "OutOfStock" | "SoldOut";
  widthCm?: number | null;
  heightCm?: number | null;
  depthCm?: number | null;
};

export default function ArtworkJsonLd({
  handle,
  title,
  artist,
  description,
  medium,
  imageUrl,
  priceAmount,
  priceCurrency,
  availability,
  widthCm,
  heightCm,
  depthCm,
}: ArtworkJsonLdProps) {
  const offers =
    priceAmount && priceCurrency
      ? {
          "@type": "Offer",
          price: priceAmount,
          priceCurrency,
          availability: availability
            ? `https://schema.org/${availability}`
            : undefined,
          url: getAbsoluteUrl(`/artworks/${handle}`),
        }
      : undefined;

  const size =
    widthCm || heightCm || depthCm
      ? {
          "@type": "QuantitativeValue",
          width: widthCm ?? undefined,
          height: heightCm ?? undefined,
          depth: depthCm ?? undefined,
          unitCode: "CMT",
        }
      : undefined;

  const cleanDescription =
    description?.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim() ?? undefined;

  const payload = {
    "@context": "https://schema.org",
    "@type": "VisualArtwork",
    name: title,
    creator: artist
      ? {
          "@type": "Person",
          name: artist,
        }
      : undefined,
    description: cleanDescription,
    artMedium: medium ?? undefined,
    image: imageUrl
      ? imageUrl.startsWith("http")
        ? imageUrl
        : getAbsoluteUrl(imageUrl)
      : undefined,
    url: getAbsoluteUrl(`/artworks/${handle}`),
    offers,
    producer: {
      "@type": "ArtGallery",
      name: siteConfig.name,
      url: siteConfig.siteUrl,
    },
    size,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
