import { Skeleton } from './ui/Skeleton'

/**
 * Product card skeleton loader — used in grids and carousels
 * while product data is fetching.
 */
export function ProductCardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse"
        >
          <div className="aspect-square bg-gray-200 rounded-xl mb-4" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-4" />
          <div className="flex items-baseline gap-2 mb-4">
            <Skeleton className="h-7 w-20" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </>
  )
}

/**
 * Simple inline skeleton line.
 */
export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-gray-200 rounded animate-pulse ${className}`}
      aria-label="Loading"
    />
  )
}
