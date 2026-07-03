export function PageLoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6" aria-label="Loading page">
      <div className="space-y-2">
        <div className="h-7 w-56 bg-slate-200 rounded-lg" />
        <div className="h-4 w-72 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white ta-card" />
        ))}
      </div>
      <div className="h-40 bg-white ta-card" />
      <div className="h-64 bg-white ta-card" />
    </div>
  );
}
