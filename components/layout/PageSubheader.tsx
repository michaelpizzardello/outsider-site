import Container from "@/components/layout/Container";

type PageSubheaderProps = {
  title: string;
};

export default function PageSubheader({ title }: PageSubheaderProps) {
  return (
    <section className="border-b border-neutral-200 bg-white sm:py-16">
      <Container className="max-w-5xl">
        <h1
          className="text-4xl tracking-normal sm:text-5xl md:text-[3.5rem]"
          style={{ fontWeight: 300 }}
        >
          {title}
        </h1>
      </Container>
    </section>
  );
}
