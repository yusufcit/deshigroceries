import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
}

/**
 * Animated skeleton loader — used inside SkeletonLoader and elsewhere.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 animate-pulse rounded',
        className
      )}
      aria-label="Loading"
    />
  )
}
