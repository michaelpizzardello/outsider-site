// ===============================
// components/layout/Section.tsx
// Controls vertical rhythm + optional anchor offset
// ===============================
import clsx from "clsx";
export default function Section({
  id,
  size = "md",
  anchorOffsetVar = false,
  className = "",
  children,
}: {
  id?: string;
  size?: "sm" | "md" | "lg";
  anchorOffsetVar?: boolean; // adds scroll-margin-top using --header-h
  className?: string;
  children: React.ReactNode;
}) {
  const pad = {
    sm: "py-8 md:py-10",
    md: "py-12 md:py-16 lg:py-20",
    lg: "py-16 md:py-20 lg:py-28",
  }[size];
  return (
    <section
      id={id}
      className={clsx(pad, className)}
      style={
        anchorOffsetVar
          ? { scrollMarginTop: "var(--header-h, 76px)" }
          : undefined
      }
    >
      {children}
    </section>
  );
}
