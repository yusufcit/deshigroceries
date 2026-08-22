import { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
  icon?: ReactNode
}

/**
 * Friendly empty state — used for empty cart, no search results, etc.
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className="w-20 h-20 mx-auto mb-6 text-gray-300">
          {icon}
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Button as="span" size="lg">
          <a href={actionHref} className="flex items-center gap-2">
            {actionLabel}
          </a>
        </Button>
      )}
    </div>
  )
}
