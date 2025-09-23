import Container from "@/components/layout/Container";

type Props = {
  html?: string | null;
  title?: string;
};

export default function ArtistBioSection({ html, title = "Biography" }: Props) {
  if (!html) return null;

  return (
    <section className="w-full py-12 md:py-16">
      <Container>
        <div
          className="grid grid-cols-1 gap-y-6 md:[grid-template-columns:repeat(12,minmax(0,1fr))] md:gap-x-14 xl:[grid-template-columns:repeat(24,minmax(0,1fr))] xl:gap-x-8"
        >
          <div className="col-span-full md:[grid-column:1/span_3] xl:[grid-column:1/span_5] text-[11px] uppercase tracking-[0.18em] text-neutral-500">
            {title}
          </div>

          <div className="col-span-full md:[grid-column:4/span_7] xl:[grid-column:7/span_16] 3xl:[grid-column:8/span_15] typ-body">
            <div
              className="prose max-w-none prose-p:mb-4 prose-ul:my-4 prose-ol:my-4 typ-body"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
