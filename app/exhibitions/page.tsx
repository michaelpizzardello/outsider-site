// ===============================
// app/exhibitions/page.tsx
// Server-only: fetch + bucket + assemble blocks
// ===============================
import "server-only";
import {
  fetchHomeExhibitions,
  classifyExhibitions,
  type ExhibitionCard,
} from "@/lib/exhibitions";
import Section from "@/components/layout/Section";
import Container from "@/components/layout/Container";
import ExhibitionsNav from "@/components/blocks/ExhibitionsNav";
import ExhibitionSection from "@/components/blocks/ExhibitionSection";

export const revalidate = 60;
export const dynamic = "force-static";

export const metadata = {
  title: "Exhibitions — Outsider Gallery",
  description: "Current, upcoming, and past exhibitions at Outsider Gallery.",
};

export default async function ExhibitionsPage() {
  const nodes = await fetchHomeExhibitions();
  const { current, upcoming, past } = classifyExhibitions(nodes);

  const sections: Array<{
    key: "current" | "upcoming" | "past";
    label: string;
    items: ExhibitionCard[];
  }> = [];
  if (current)
    sections.push({ key: "current", label: "Current", items: [current] });
  if (upcoming?.length)
    sections.push({ key: "upcoming", label: "Upcoming", items: upcoming });
  if (past?.length) sections.push({ key: "past", label: "Past", items: past });

  return (
    <main>
      {/* TOP SECTION */}
      <Section size="title-block">
        <Container>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            Exhibitions
          </h1>
          {sections.length > 0 && (
            <div className="mt-4">
              {/* EXHIBITIONS PAGE PILLS - CURRENT< PAST< UPCOMING*/}
              <ExhibitionsNav
                sections={sections.map(({ key, label }) => ({ key, label }))}
              />
            </div>
          )}
        </Container>
      </Section>

      {sections.map((s, idx) => (
        <Section
          key={s.key}
          size={idx === 0 ? "md" : "md"}
          id={s.key}
          anchorOffsetVar
        >
          {/* EXHIBITIONS SECTION -- See blocks/ExhibitionsSection.tsx */}
          <Container>
            <ExhibitionSection label={s.label} items={s.items} kind={s.key} />
          </Container>
        </Section>
      ))}

      {sections.length === 0 && (
        <Section size="lg">
          <Container>
            <p className="text-center text-neutral-500">
              No exhibitions to show yet.
            </p>
          </Container>
        </Section>
      )}
    </main>
  );
}
