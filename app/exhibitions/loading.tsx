export default function Loading() {
  return (
    <div className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 h-8 w-56 animate-pulse rounded bg-neutral-200" />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/3] w-full animate-pulse rounded bg-neutral-200" />
              <div className="h-4 w-3/5 animate-pulse rounded bg-neutral-200" />
              <div className="h-3 w-2/5 animate-pulse rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
