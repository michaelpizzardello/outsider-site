import "server-only";

import Image from "next/image";

import Container from "@/components/layout/Container";
import { shopifyFetch } from "@/lib/shopify";
import { toHtml } from "@/lib/richtext";
import ContactForm from "@/components/contact/ContactForm";

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
                    Address
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
                  <div className="mt-5 space-y-3 text-sm leading-relaxed text-black sm:text-base">
                    <p>
                      <a
                        href="mailto:info@outsidergallery.com.au"
                        className="underline underline-offset-4"
                      >
                        info@outsidergallery.com.au
                      </a>
                    </p>
                    <p>
                      <a
                        href="tel:0422509508"
                        className="underline underline-offset-4"
                      >
                        0422 509 508
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-[var(--colors-grey-default,#f6f6f5)] p-8 sm:p-10">
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
