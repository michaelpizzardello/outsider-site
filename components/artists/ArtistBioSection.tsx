import Container from "@/components/layout/Container";
import ExhibitionLabel from "@/components/exhibitions/ExhibitionLabel";
import ExpandableText from "@/components/exhibition/ExpandableText";

type Props = {
  html?: string | null;
  title?: string;
};

export default function ArtistBioSection({ html, title = "Biography" }: Props) {
  if (!html) return null;

  return (
    <section className="py-12 md:py-16">
      <Container>
        <div
          className="
            grid grid-cols-1 gap-y-10
            md:[grid-template-columns:minmax(240px,max-content)_minmax(0,0.78fr)]
            md:gap-x-[clamp(32px,4vw,48px)]
          "
        >
          <aside
            className="
              col-span-full
              md:col-span-1 md:col-start-1
              space-y-8 text-sm leading-relaxed
            "
          >
            <div>
              <ExhibitionLabel as="div" className="mb-[2px]">
                {title}
              </ExhibitionLabel>
            </div>
          </aside>

          <div
            className="
              col-span-full
              mt-6
              md:col-span-1 md:col-start-2 md:mt-0 md:justify-self-center
            "
          >
            <div className="max-w-[68ch] w-full md:ml-auto md:mr-0">
              <ExpandableText longTextHtml={html} clampLines={12} />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
