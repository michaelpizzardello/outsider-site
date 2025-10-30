import { getAbsoluteUrl, siteConfig } from "@/lib/siteConfig";

type ArtworkJsonLdProps = {
  productId: string;
  handle: string;
  title: string;
  artist?: string | null;
  year?: string | null;
  description?: string | null;
  medium?: string | null;
  dimensionsLabel?: string | null;
  imageUrl?: string | null;
  priceAmount?: string | null;
  priceCurrency?: string | null;
  availability?: "InStock" | "OutOfStock" | "SoldOut";
  widthCm?: number | null;
  heightCm?: number | null;
  depthCm?: number | null;
};

export default function ArtworkJsonLd({
  productId,
  handle,
  title,
  artist,
  year,
  description,
  medium,
  dimensionsLabel,
  imageUrl,
  priceAmount,
  priceCurrency,
  availability,
  widthCm,
  heightCm,
  depthCm,
}: ArtworkJsonLdProps) {
  const itemUrl = getAbsoluteUrl(`/artworks/${handle}`);
  const schemaAvailability =
    availability === "SoldOut" ? "OutOfStock" : availability ?? undefined;

  const offers =
    priceAmount && priceCurrency
      ? {
          "@type": "Offer",
          price: priceAmount,
          priceCurrency,
          availability: schemaAvailability
            ? `https://schema.org/${schemaAvailability}`
            : undefined,
          url: itemUrl,
        }
      : schemaAvailability
        ? {
            "@type": "Offer",
            availability: `https://schema.org/${schemaAvailability}`,
            url: itemUrl,
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

  const dimensionSummary = (() => {
    const parts = [];
    const formatPart = (label: string | null | undefined) =>
      label ? label.replace(/\.+$/g, "").trim() : null;
    if (dimensionsLabel) {
      return formatPart(dimensionsLabel);
    }
    const dimValues = [
      typeof widthCm === "number" ? widthCm : null,
      typeof heightCm === "number" ? heightCm : null,
      typeof depthCm === "number" ? depthCm : null,
    ].filter((value): value is number => Number.isFinite(value));
    if (!dimValues.length) return undefined;
    const formatted = dimValues
      .map((value) => (Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "")))
      .join(" x ");
    return formatted ? `${formatted} cm` : undefined;
  })();

  const fallbackDescription = (() => {
    if (cleanDescription) return cleanDescription;

    const sentences: string[] = [];
    const headlineParts = [
      title,
      artist ? `by ${artist}` : null,
      year ? `(${year})` : null,
    ].filter(Boolean);
    if (headlineParts.length) {
      sentences.push(`${headlineParts.join(" ")}.`);
    }
    if (medium) {
      sentences.push(`${medium}.`);
    }
    if (dimensionSummary) {
      sentences.push(`${dimensionSummary}.`);
    }
    sentences.push("Available via Outsider Gallery in Sydney.");

    const joined = sentences.join(" ").replace(/\s+/g, " ").trim();
    return joined.length ? joined : undefined;
  })();

  const payload = {
    "@context": "https://schema.org",
    "@type": ["Product", "VisualArtwork"],
    "@id": `${itemUrl}#product`,
    productID: productId,
    name: title,
    creator: artist
      ? {
          "@type": "Person",
          name: artist,
        }
      : undefined,
    description: fallbackDescription,
    artMedium: medium ?? undefined,
    image: imageUrl
      ? imageUrl.startsWith("http")
        ? imageUrl
        : getAbsoluteUrl(imageUrl)
      : undefined,
    url: itemUrl,
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
