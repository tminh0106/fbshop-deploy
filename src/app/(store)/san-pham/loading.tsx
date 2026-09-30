export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8 animate-pulse">
      {/* Skeleton Header */}
      <div className="space-y-2">
        <div className="h-8 w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-96 bg-slate-100 rounded-lg" />
      </div>

      {/* Skeleton Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-100 bg-white">
        <div className="h-10 w-48 bg-slate-200 rounded-xl" />
        <div className="flex gap-2">
          <div className="h-10 w-28 bg-slate-100 rounded-xl" />
          <div className="h-10 w-28 bg-slate-100 rounded-xl" />
        </div>
      </div>

      {/* Skeleton Product Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3"
          >
            <div className="aspect-square w-full rounded-xl bg-slate-100" />
            <div className="h-4 w-3/4 bg-slate-200 rounded-md" />
            <div className="h-3 w-1/2 bg-slate-100 rounded-md" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-24 bg-orange-100 rounded-md" />
              <div className="h-8 w-8 rounded-lg bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
