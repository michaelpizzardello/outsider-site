import "server-only";

import Image from "next/image";

import Container from "@/components/layout/Container";
import { shopifyFetch } from "@/lib/shopify";
import { toHtml } from "@/lib/richtext";

const TIMELINE = [
  {
    year: "2015",
    title: "Outsider Gallery founded",
    body: "Opened in New York with a mission to champion visionary artists working outside traditional pathways, presenting our inaugural exhibition of contemporary painting.",
  },
  {
    year: "2018",
    title: "London space debuts",
    body: "Launched a flagship gallery in Mayfair, expanding our roster and establishing a dedicated programme of talks and performances.",
  },
  {
    year: "2021",
    title: "Residency programme launches",
    body: "Introduced an annual residency in Accra supporting experimentation, with resulting exhibitions staged across our locations.",
  },
  {
    year: "2024",
    title: "Digital collecting platform",
    body: "Rolled out a global online sales channel with personalised advisory, enabling collectors to acquire works directly from studio to home.",
  },
];

const SERVICES = [
  {
    title: "Collection advisory",
    body: "Bespoke guidance for new and established collectors, from defining a focus to managing acquisitions, framing, and installation.",
  },
  {
    title: "Institutional liaison",
    body: "We broker loans, commissions, and curated presentations with museums and biennials to deepen visibility for our artists.",
  },
  {
    title: "Artist development",
    body: "Our team supports studio production, scholarship, and publishing, pairing artists with curators, writers, and archives.",
  },
  {
    title: "Public programmes",
    body: "Talks, screenings, and performances staged across our galleries and partner venues invite audiences into the artists&rsquo; processes.",
  },
];

const LOCATIONS = [
  {
    city: "New York",
    blurb:
      "Two-floor gallery in Tribeca featuring large-scale exhibition spaces, private viewing rooms, and a rooftop sculpture terrace.",
  },
  {
    city: "London",
    blurb:
      "Flagship townhouse with natural light galleries, library, and dedicated salon for collection viewings in Mayfair.",
  },
  {
    city: "Accra",
    blurb:
      "Seasonal project space and residency studio supporting cross-continental collaboration and community programming.",
  },
];

const TEAM = [
  {
    name: "Maya Ellis",
    role: "Founder & Director",
    contact: "maya@outsider.gallery",
  },
  {
    name: "Tomas Rivera",
    role: "Senior Sales Advisor",
    contact: "tomas@outsider.gallery",
  },
  {
    name: "Lina Duval",
    role: "Head of Institutional Projects",
    contact: "lina@outsider.gallery",
  },
];

export const revalidate = 300;

type FieldReference =
  | {
      __typename: "MediaImage";
      image?: {
        url: string;
        width?: number | null;
        height?: number | null;
        altText?: string | null;
      } | null;
    }
  | {
      __typename: string;
    }
  | null;

type Field = {
  key: string;
  type: string;
  value?: string | null;
  reference?: FieldReference;
};

type MetaobjectNode = {
  handle: string;
  fields: Field[];
};

type InformationQuery = {
  metaobjects: { nodes: MetaobjectNode[] } | null;
};

const INFORMATION_QUERY = /* GraphQL */ `
  query AboutInformation($first: Int = 10) {
    metaobjects(type: "information", first: $first) {
      nodes {
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
          }
        }
      }
    }
  }
`;

function normaliseKey(key?: string | null) {
  return key ? key.replace(/[\s_-]+/g, "").toLowerCase() : "";
}

function stringValue(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (value && typeof value === "object") {
    const maybeString =
      (value as { value?: string; text?: string }).value ??
      (value as { value?: string; text?: string }).text;
    if (typeof maybeString === "string") return maybeString.trim() || null;
  }
  return null;
}

function pickField(
  fields: Field[] | undefined,
  candidates: string[]
): Field | null {
  if (!fields?.length) return null;
  const normalisedCandidates = candidates.map(normaliseKey);
  for (const field of fields) {
    const key = normaliseKey(field.key);
    if (normalisedCandidates.includes(key)) return field;
  }
  return null;
}

function resolveRichText(
  fields: Field[] | undefined,
  candidates: string[]
): string | null {
  const field = pickField(fields, candidates);
  if (!field) return null;
  return stringValue(field.value);
}

function resolveImage(fields: Field[] | undefined, candidates: string[]) {
  const field = pickField(fields, candidates);
  if (!field) return null;
  const ref = field.reference;
  if (ref && ref.__typename === "MediaImage" && ref.image?.url) {
    return {
      url: ref.image.url,
      width: ref.image.width ?? undefined,
      height: ref.image.height ?? undefined,
      alt: ref.image.altText ?? undefined,
    };
  }
  const url = stringValue(field.value);
  if (url && url.startsWith("http")) {
    return { url };
  }
  return null;
}

async function fetchAboutInformation() {
  const data = await shopifyFetch<InformationQuery>(INFORMATION_QUERY, {
    first: 10,
  });
  const nodes = data.metaobjects?.nodes ?? [];
  if (!nodes.length) return null;

  const byTitle = nodes.find((node) => {
    const title = stringValue(
      pickField(node.fields, ["title", "name", "heading"])?.value
    );
    if (!title) return false;
    return title.trim().toLowerCase() === "about us page";
  });

  return byTitle ?? nodes[0] ?? null;
}

export default async function AboutPage() {
  const metaobject = await fetchAboutInformation();

  const aboutShortHtml = metaobject
    ? toHtml(
        resolveRichText(metaobject.fields, [
          "aboutshort",
          "aboutusshort",
          "short",
          "shorttext",
        ])
      )
    : null;
  const aboutLongHtml = metaobject
    ? toHtml(
        resolveRichText(metaobject.fields, [
          "aboutlong",
          "aboutuslong",
          "long",
          "longtext",
        ])
      )
    : null;
  const coverImage = metaobject
    ? resolveImage(metaobject.fields, [
        "aboutuscoverimage",
        "coverimage",
        "aboutcover",
      ])
    : null;

  return (
    <main
      className="bg-white text-neutral-900"
      style={{ paddingTop: "var(--header-h, 76px)" }}
    >
      <section className="bg-white py-5 sm:py-16">
        <Container className="max-w-3xl text-center">
          <h1
            className="text-4xl tracking-normal sm:text-5xl md:text-[3.5rem]"
            style={{ fontWeight: 300 }}
          >
            About
          </h1>
        </Container>
      </section>

      <section className="">
        <Container className="flex justify-center">
          <div className="flex w-full max-w-4xl flex-col gap-12">
            {coverImage ? (
              <div className="overflow-hidden">
                <Image
                  src={coverImage.url}
                  alt={coverImage.alt ?? "About Us cover"}
                  width={coverImage.width ?? 1600}
                  height={coverImage.height ?? 900}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>
            ) : (
              <div className="grid gap-6 border border-neutral-200 bg-neutral-50 p-8 sm:grid-cols-2">
                <div>
                  <p className="text-4xl font-light">35+</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.28em] text-neutral-500">
                    Artists represented
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-light">120</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.28em] text-neutral-500">
                    Exhibitions staged to date
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-light">3</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.28em] text-neutral-500">
                    Global spaces
                  </p>
                </div>
                <div>
                  <p className="text-4xl font-light">18</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.28em] text-neutral-500">
                    Annual publications
                  </p>
                </div>
              </div>
            )}
            <div>
              {aboutShortHtml ? (
                <div
                  className="text-2xl font-light tracking-tight [&_p]:m-0 [&_p:not(:first-child)]:mt-4"
                  dangerouslySetInnerHTML={{ __html: aboutShortHtml }}
                />
              ) : (
                <h2 className="text-2xl font-light tracking-tight">
                  A gallery shaped by artists
                </h2>
              )}
              {aboutLongHtml ? (
                <div
                  className="mt-5 text-base leading-relaxed text-neutral-600 sm:text-lg [&_ol]:ml-5 [&_ol]:list-decimal [&_p:not(:first-child)]:mt-4 [&_ul]:ml-5 [&_ul]:list-disc"
                  dangerouslySetInnerHTML={{ __html: aboutLongHtml }}
                />
              ) : (
                <p className="mt-5 text-base leading-relaxed text-neutral-600 sm:text-lg">
                  Outsider Gallery began as a single room championing artists
                  whose practices fell between disciplines. Today, we continue
                  to prioritise experimentation and offer production resources,
                  scholarly support, and curatorial collaboration to each artist
                  we represent. Our exhibitions pair newly commissioned works
                  with context drawn from archives, oral histories, and research
                  trips.
                </p>
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-neutral-200 bg-neutral-50 py-16 sm:py-24">
        <Container>
          <h2 className="text-2xl font-light tracking-tight">Spaces</h2>
          <p className="mt-3 max-w-3xl text-base leading-relaxed text-neutral-600 sm:text-lg">
            Each location is tailored to the artists we work with - flexible
            studios, experimental project rooms, and dedicated viewing salons
            allow us to present ambitious installations and intimate encounters
            alike.
          </p>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {LOCATIONS.map((location) => (
              <div
                key={location.city}
                className="flex h-full flex-col justify-between rounded-lg border border-neutral-200 bg-white p-6"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                    {location.city}
                  </p>
                  <h3 className="mt-3 text-lg font-medium">
                    {location.city} Gallery
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {location.blurb}
                  </p>
                </div>
                <p className="mt-6 text-xs uppercase tracking-[0.28em] text-neutral-500">
                  Mon - Sat | By appointment
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-y-10 md:grid-cols-2 md:gap-x-14">
            <div>
              <h2 className="text-2xl font-light tracking-tight">What we do</h2>
              <p className="mt-4 text-base leading-relaxed text-neutral-600 sm:text-lg">
                Our team works closely with artists, patrons, and institutions,
                delivering tailored services that sustain ambitious practices
                and thoughtful collections.
              </p>
            </div>
            <div className="grid gap-8">
              {SERVICES.map((service) => (
                <div
                  key={service.title}
                  className="border-t border-neutral-200 pt-6"
                >
                  <h3 className="text-lg font-medium">{service.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                    {service.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-y border-neutral-200 bg-[var(--colors-grey-default,#f6f6f5)] py-16 sm:py-24">
        <Container>
          <h2 className="text-2xl font-light tracking-tight">Milestones</h2>
          <div className="mt-10 grid gap-8 md:grid-cols-2 md:gap-x-12">
            {TIMELINE.map((entry) => (
              <div
                key={entry.year}
                className="rounded-lg border border-neutral-200 bg-white p-6"
              >
                <p className="text-xs uppercase tracking-[0.28em] text-neutral-500">
                  {entry.year}
                </p>
                <h3 className="mt-3 text-lg font-medium">{entry.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  {entry.body}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-16 sm:py-20">
        <Container>
          <div className="grid gap-y-8 md:grid-cols-12 md:gap-x-14 lg:gap-x-20">
            <div className="md:col-span-4">
              <h2 className="text-2xl font-light tracking-tight">Team</h2>
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">
                Get in touch with our leadership team to discuss exhibitions,
                acquisitions, or institutional projects.
              </p>
            </div>
            <div className="md:col-span-8">
              <ul className="grid gap-6 sm:grid-cols-2">
                {TEAM.map((member) => (
                  <li
                    key={member.name}
                    className="rounded-lg border border-neutral-200 bg-neutral-50 p-5"
                  >
                    <p className="text-lg font-medium">{member.name}</p>
                    <p className="text-sm text-neutral-600">{member.role}</p>
                    <a
                      href={`mailto:${member.contact}`}
                      className="mt-3 inline-flex text-sm underline underline-offset-4"
                    >
                      {member.contact}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-neutral-200 py-20">
        <Container className="grid gap-y-8 md:grid-cols-2 md:gap-x-14">
          <div>
            <h2 className="text-2xl font-light tracking-tight">Visit Us</h2>
            <p className="mt-4 text-sm leading-relaxed text-neutral-600">
              Appointments are available across all gallery locations. Our
              client-services team can arrange private tours, digital
              walk-throughs, and tailored viewing packages.
            </p>
          </div>
          <div className="space-y-4 text-sm text-neutral-600">
            <p>
              Email{" "}
              <a
                href="mailto:visit@outsider.gallery"
                className="underline underline-offset-4"
              >
                visit@outsider.gallery
              </a>{" "}
              or call +1 (212) 555-0187.
            </p>
            <p>
              Subscribe to the newsletter for exhibition announcements, artist
              interviews, and collector previews.
            </p>
          </div>
        </Container>
      </section>
    </main>
  );
}
