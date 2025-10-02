import Container from "@/components/layout/Container";
import ExpandableText from "@/components/exhibition/ExpandableText";
import { ArrowCtaLink } from "@/components/ui/ArrowCta";

export default function AboutArtist({
  name,
  bioHtml,
  handle,
  title = "About the artist",
}: {
  name?: string | null;
  bioHtml?: string | null;
  handle?: string | null;
  title?: string;
}) {
  if (!bioHtml && !handle) return null;

  return (
    <section className="w-full py-10 md:py-14">
      <Container>
        <div
        className="
          grid grid-cols-1 gap-y-6
          md:[grid-template-columns:repeat(12,minmax(0,1fr))] md:gap-x-14
          xl:[grid-template-columns:repeat(24,minmax(0,1fr))] xl:gap-x-8
        "
      >
        {/* LEFT RAIL */}
        <div
          className="
            col-span-full
            md:[grid-column:1/span_3]
            xl:[grid-column:1/span_5]
            text-xs uppercase tracking-[0.18em] opacity-60
          "
        >
          {title}
        </div>

        {/* BODY */}
        <div
          className="
            col-span-full
            md:[grid-column:4/span_5]
            xl:[grid-column:8/span_10]
            3xl:[grid-column:9/span_9]
            text-base leading-relaxed
          "
        >
          {bioHtml ? (
            <div className="max-w-[60ch] md:max-w-[59ch] xl:max-w-none">
              <ExpandableText longTextHtml={bioHtml} clampLines={12} />
            </div>
          ) : null}

          {handle ? (
            <div className="mt-4">
              <ArrowCtaLink
                href={`/artists/${handle}`}
                label={`View ${name || "artist"} profile`}
                className="leading-relaxed"
              />
            </div>
          ) : null}
        </div>
        </div>
      </Container>
    </section>
  );
}
