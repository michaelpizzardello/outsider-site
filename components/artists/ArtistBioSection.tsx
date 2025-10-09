import Container from "@/components/layout/Container";
import ExpandableText from "@/components/exhibition/ExpandableText";

type Props = {
  shortHtml?: string | null;
  longHtml?: string | null;
};

export default function ArtistBioSection({ shortHtml, longHtml }: Props) {
  if (!shortHtml && !longHtml) return null;

  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="mx-auto w-full max-w-[68ch] text-left">
          <ExpandableText
            shortText={shortHtml ?? undefined}
            longTextHtml={longHtml ?? undefined}
            shortClassName="text-lg leading-8 lg:text-xl lg:leading-[2.1] prose-p:text-lg prose-p:leading-8 lg:prose-p:text-xl lg:prose-p:leading-[2.1]"
          />
        </div>
      </Container>
    </section>
  );
}
