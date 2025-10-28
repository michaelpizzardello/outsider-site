export const siteConfig = {
  name: "Outsider Gallery",
  legalName: "Outsider Gallery",
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "https://outsidergallery.au",
  description:
    "Outsider Gallery is a Sydney contemporary art gallery in Surry Hills presenting curated exhibitions of emerging and established Australian and international artists, with collectible artworks, talks, and events that reframe the Sydney art scene.",
  shortTagline: "Fearless contemporary art from Surry Hills, Sydney.",
  keywords: [
    "Outsider Gallery",
    "Sydney contemporary art gallery",
    "Surry Hills art gallery",
    "Australian artists",
    "international artists",
    "curated exhibitions",
    "collectible artworks",
    "Sydney art scene",
  ],
  address: {
    streetAddress: "144 Commonwealth St",
    addressLocality: "Surry Hills",
    addressRegion: "NSW",
    postalCode: "2010",
    addressCountry: "AU",
  },
  telephone: "+61 422 509 509",
  openingHours: [
    {
      dayOfWeek: ["Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "17:00",
    },
  ],
  socialProfiles: {
    instagram: "https://www.instagram.com/outsidergallery_/",
  },
};

export function getAbsoluteUrl(path: string): string {
  const base = siteConfig.siteUrl.replace(/\/+$/, "");
  const slug = path.startsWith("/") ? path : `/${path}`;
  return `${base}${slug}`;
}
