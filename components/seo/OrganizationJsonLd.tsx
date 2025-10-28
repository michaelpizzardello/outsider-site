import { siteConfig, getAbsoluteUrl } from "@/lib/siteConfig";

export default function OrganizationJsonLd() {
  const { name, legalName, siteUrl, description, telephone, address, openingHours, socialProfiles } =
    siteConfig;

  const payload = {
    "@context": "https://schema.org",
    "@type": "ArtGallery",
    name,
    legalName,
    url: siteUrl,
    description,
    telephone,
    logo: getAbsoluteUrl("/logo-black.svg"),
    image: getAbsoluteUrl("/logo-black.svg"),
    address: {
      "@type": "PostalAddress",
      streetAddress: address.streetAddress,
      addressLocality: address.addressLocality,
      addressRegion: address.addressRegion,
      postalCode: address.postalCode,
      addressCountry: address.addressCountry,
    },
    openingHoursSpecification: openingHours.map((item) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: item.dayOfWeek,
      opens: item.opens,
      closes: item.closes,
    })),
    sameAs: Object.values(socialProfiles).filter(Boolean),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
