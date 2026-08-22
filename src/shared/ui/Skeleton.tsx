export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse-soft rounded-lg bg-pink-100/60 ${className}`} />
}

export function SkeletonCardList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      ))}
    </div>
  )
}
