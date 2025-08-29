// ===============================
// components/blocks/ExhibitionsNav.tsx
// Pills that link to #current/#upcoming/#past
// ===============================
export default function ExhibitionsNav({
  sections,
}: {
  sections: Array<{ key: "current" | "upcoming" | "past"; label: string }>;
}) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      {sections.map((s) => (
        <a
          key={s.key}
          href={`#${s.key}`}
          className="rounded-full border border-neutral-300 px-3 py-1 hover:border-black"
        >
          {s.label}
        </a>
      ))}
    </nav>
  );
}
