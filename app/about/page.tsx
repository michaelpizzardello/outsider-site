import "server-only";
import type { Metadata } from "next";
import Image from "next/image";
import type { ComponentPropsWithoutRef } from "react";

import Container from "@/components/layout/Container";
import { shopifyFetch } from "@/lib/shopify";
import { toHtml } from "@/lib/richtext";
import ContactForm from "@/components/contact/ContactForm";
import { siteConfig } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "About Outsider Gallery",
  description:
    "Learn about Outsider Gallery, a Sydney contemporary art gallery in Surry Hills presenting curated exhibitions, artist talks, and collectible works from emerging and established artists.",
  openGraph: {
    title: "About Outsider Gallery",
    description:
      "Outsider Gallery champions fearless contemporary art in Sydney’s Surry Hills, spotlighting emerging and established Australian and international artists.",
    url: `${siteConfig.siteUrl.replace(/\/+$/, "")}/about`,
  },
  alternates: {
    canonical: "/about",
  },
};

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

type IconProps = ComponentPropsWithoutRef<"svg">;

function MailIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm0 2v.13l8 4.57 8-4.57V7H4Zm16 10V9.37l-7.45 4.25a1 1 0 0 1-1.1 0L4 9.37V17h16Z"
      />
    </svg>
  );
}

function PhoneIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l1.47-1.47a1.36 1.36 0 0 1 1.33-.35 12.05 12.05 0 0 0 3.78.6 1.4 1.4 0 0 1 1.39 1.39v2.33a1.4 1.4 0 0 1-1.39 1.39A18.62 18.62 0 0 1 3 5.39 1.4 1.4 0 0 1 4.39 4h2.33a1.4 1.4 0 0 1 1.39 1.39 12.05 12.05 0 0 0 .6 3.78 1.36 1.36 0 0 1-.35 1.33l-1.47 1.29Z"
      />
    </svg>
  );
}

function InstagramIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M8 2h8a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H8a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6Zm0 2a4 4 0 0 0-4 4v8a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4V8a4 4 0 0 0-4-4H8Zm4 3.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm5.25-3.75a1.25 1.25 0 1 1-2.5 0 1.25 1.25 0 0 1 2.5 0Z"
      />
    </svg>
  );
}

function LinkedinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path
        fill="currentColor"
        d="M4.98 3.5a2.5 2.5 0 1 1-.001 5.001A2.5 2.5 0 0 1 4.98 3.5ZM3 9h3.96v12H3V9Zm6.602 0H14.4v1.64h.056c.534-1.013 1.836-2.084 3.78-2.084 4.043 0 4.784 2.66 4.784 6.118V21H19v-5.52c0-1.317-.025-3.01-1.836-3.01-1.84 0-2.122 1.435-2.122 2.915V21h-3.96V9Z"
      />
    </svg>
  );
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
      <section className="bg-white pt-10 pb-5 sm:pt-20 sm:pb-16">
        <Container className="max-w-3xl text-center">
          <h1
            className="text-4xl tracking-normal sm:text-5xl md:text-[3.5rem]"
            style={{ fontWeight: 300 }}
          >
            About
          </h1>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="flex justify-center px-0">
          <div className="w-full max-w-[960px] space-y-14 pb-12 sm:space-y-16 sm:pb-16">
            {aboutShortHtml ? (
              <div
                className="w-full py-6 text-left text-lg font-light tracking-tight text-neutral-900 sm:py-8 sm:text-2xl [&_p]:m-0 [&_p:not(:first-child)]:mt-6"
                dangerouslySetInnerHTML={{ __html: aboutShortHtml }}
              />
            ) : null}
            {coverImage ? (
              <div className="relative aspect-[3/2] w-full bg-neutral-100">
                <Image
                  src={coverImage.url}
                  alt={coverImage.alt ?? "About Us cover"}
                  fill
                  sizes="(min-width: 1024px) 960px, 90vw"
                  className="object-cover"
                  priority
                />
              </div>
            ) : null}
            {aboutLongHtml ? (
              <div
                className="w-full text-left text-base leading-relaxed text-neutral-700 sm:text-lg [&_ol]:ml-6 [&_ol]:list-decimal [&_p:not(:first-child)]:mt-5 [&_ul]:ml-6 [&_ul]:list-disc lg:text-[1.05rem]"
                dangerouslySetInnerHTML={{ __html: aboutLongHtml }}
              />
            ) : null}
          </div>
        </Container>
      </section>

      <section className="bg-white">
        <Container className="py-10 sm:py-16">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 sm:gap-12">
            <div className="rounded-lg border border-neutral-200 bg-white p-8 sm:p-10">
              <div className="grid gap-6 md:grid-cols-2 md:gap-12">
                <div className="flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-black">
                    Location
                  </p>
                  <div className="mt-5 space-y-1 text-lg font-light leading-snug text-black sm:text-xl">
                    <p>Outsider Gallery</p>
                    <p>144 Commonwealth St</p>
                    <p>Surry Hills NSW 2010</p>
                    <p>Sydney</p>
                  </div>
                </div>
                <div className="md:order-2">
                  <div className="h-[280px] w-full overflow-hidden rounded-md bg-neutral-100 md:h-[340px]">
                    <iframe
                      title="Outsider Gallery location"
                      src="https://maps.google.com/maps?q=Outsider%20Gallery%20144%20Commonwealth%20St&t=&z=16&ie=UTF8&iwloc=near&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] lg:gap-16">
              <div className="space-y-8">
                <div className="rounded-lg border border-neutral-200 bg-white p-8 sm:p-10">
                  <p className="text-xs uppercase tracking-[0.24em] text-black">
                    Opening Hours
                  </p>
                  <div className="mt-5 space-y-1 text-lg font-light leading-snug text-black sm:text-xl">
                    <p>Wednesday—Saturday</p>
                    <p>10am – 5pm</p>
                  </div>
                  <p className="mt-4 text-sm leading-relaxed text-black sm:text-base">
                    or by appointment
                  </p>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-white p-8 sm:p-10">
                  <p className="text-xs uppercase tracking-[0.24em] text-black">
                    Contact
                  </p>
                  <div className="mt-5 flex flex-col gap-3 text-sm text-neutral-800 sm:text-base">
                    <a
                      href="mailto:info@outsidergallery.com.au"
                      className="inline-flex items-center gap-3 transition hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-label="Email Outsider Gallery"
                    >
                      <MailIcon className="h-5 w-5" />
                      <span>Email</span>
                    </a>
                    <a
                      href="tel:0422509508"
                      className="inline-flex items-center gap-3 transition hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-label="Call Outsider Gallery"
                    >
                      <PhoneIcon className="h-5 w-5" />
                      <span>Call</span>
                    </a>
                  </div>
                </div>
                <div className="rounded-lg border border-neutral-200 bg-white p-8 sm:p-10">
                  <p className="text-xs uppercase tracking-[0.24em] text-black">
                    Social
                  </p>
                  <div className="mt-5 flex flex-col gap-3 text-sm text-neutral-800 sm:text-base">
                    <a
                      href="https://www.instagram.com/outsidergallery_"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-3 transition hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-label="Follow Outsider Gallery on Instagram"
                    >
                      <InstagramIcon className="h-5 w-5" />
                      <span>Instagram</span>
                    </a>
                    <a
                      href="https://au.linkedin.com/company/outsider-gallery"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-3 transition hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                      aria-label="Connect with Outsider Gallery on LinkedIn"
                    >
                      <LinkedinIcon className="h-5 w-5" />
                      <span>LinkedIn</span>
                    </a>
                  </div>
                </div>
              </div>
              <div
                id="contact"
                className="rounded-lg border border-neutral-200 bg-[var(--colors-grey-default,#f6f6f5)] p-8 sm:p-10"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-black">
                  Enquire
                </p>
                <ContactForm />
              </div>
            </div>
          </div>
        </Container>
      </section>
    </main>
  );
}
