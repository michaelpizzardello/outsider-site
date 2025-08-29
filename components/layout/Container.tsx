// ===============================
// components/layout/Container.tsx (existing in repo; shown for reference)
// ===============================
import clsx from "clsx";
export default function Container({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl 2xl:max-w-none",
        className
      )}
    >
      {children}
    </div>
  );
}
