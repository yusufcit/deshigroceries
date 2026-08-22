import { Star, StarHalf } from 'lucide-react'

interface RatingStarsProps {
  rating: number
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  reviewCount?: number
}

/**
 * Star rating display component.
 * Shows half-stars for fractional ratings.
 */
export function RatingStars({
  rating = 0,
  size = 'md',
  showText = true,
  reviewCount,
}: RatingStarsProps) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0)

  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <Star
            key={`full-${i}`}
            className={`${sizeClasses[size]} fill-amber-400 text-amber-400`}
          />
        ))}
        {hasHalf && (
          <StarHalf
            className={`${sizeClasses[size]} fill-amber-400 text-amber-400`}
          />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={`${sizeClasses[size]} text-gray-300`}
          />
        ))}
      </div>
      {showText && (
        <span className="text-sm text-gray-500 font-medium">
          {rating.toFixed(1)}
          {reviewCount !== undefined && reviewCount !== undefined && (
            <span className="text-gray-400">({reviewCount})</span>
          )}
        </span>
      )}
    </div>
  )
}
