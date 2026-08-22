import { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

interface ErrorStateProps {
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  icon?: ReactNode
}

/**
 * Friendly error state — never exposes internal errors to customers.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'Please try again in a moment.',
  actionLabel = 'Try Again',
  onAction,
  icon,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {icon && (
        <div className="w-16 h-16 mx-auto mb-6 text-gray-300">
          {icon}
        </div>
      )}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-8 max-w-md leading-relaxed">
        {description}
      </p>
      {onAction && (
        <Button size="lg" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
