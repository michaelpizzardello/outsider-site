import Container from "@/components/layout/Container";

type Props = {
  html?: string | null;
};

export default function ArtistBioSection({ html }: Props) {
  if (!html) return null;

  return (
    <section className="py-12 md:py-16">
      <Container>
        <div className="mx-auto w-full max-w-[68ch] text-left text-base leading-relaxed lg:text-xl lg:leading-9">
          <div
            className="prose prose-lg md:prose-xl lg:prose-2xl max-w-none whitespace-pre-line space-y-6 prose-p:mb-4 prose-p:leading-relaxed prose-ul:my-4 prose-ol:my-4"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </Container>
    </section>
  );
}
