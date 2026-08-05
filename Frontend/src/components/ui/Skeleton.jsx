export function SkeletonLine({ className = '' }) {
  return <div className={`bg-soft-stone/50 animate-pulse rounded ${className}`} />;
}

export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`bg-off-white border-soft-stone animate-pulse rounded-2xl border p-5 md:p-6 ${className}`}
    >
      <div className="space-y-3">
        <SkeletonLine className="h-4 w-1/3" />
        <SkeletonLine className="h-3 w-2/3" />
        <SkeletonLine className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLine key={j} className={`h-4 ${j === 0 ? 'w-1/4' : 'w-1/6'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}
