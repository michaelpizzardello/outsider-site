import { getAbsoluteUrl, siteConfig } from "@/lib/siteConfig";

type ExhibitionJsonLdProps = {
  handle: string;
  title: string;
  artist?: string | null;
  description?: string | null;
  startDate?: Date;
  endDate?: Date;
  imageUrl?: string | null;
};

export default function ExhibitionJsonLd({
  handle,
  title,
  artist,
  description,
  startDate,
  endDate,
  imageUrl,
}: ExhibitionJsonLdProps) {
  const url = getAbsoluteUrl(`/exhibitions/${handle}`);
  const image = imageUrl
    ? imageUrl.startsWith("http")
      ? imageUrl
      : getAbsoluteUrl(imageUrl)
    : undefined;
  const cleanDescription =
    description?.replace(/<\/?[^>]+(>|$)/g, " ").replace(/\s+/g, " ").trim() ?? undefined;

  const payload = {
    "@context": "https://schema.org",
    "@type": "ExhibitionEvent",
    name: artist ? `${artist}: ${title}` : title,
    description: cleanDescription,
    startDate: startDate ? startDate.toISOString() : undefined,
    endDate: endDate ? endDate.toISOString() : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: siteConfig.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: siteConfig.address.streetAddress,
        addressLocality: siteConfig.address.addressLocality,
        addressRegion: siteConfig.address.addressRegion,
        postalCode: siteConfig.address.postalCode,
        addressCountry: siteConfig.address.addressCountry,
      },
    },
    image,
    url,
    performer: artist
      ? {
          "@type": "Person",
          name: artist,
        }
      : undefined,
    organizer: {
      "@type": "Organization",
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
