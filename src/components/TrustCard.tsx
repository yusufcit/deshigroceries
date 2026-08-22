import { ReactNode } from 'react'

interface TrustCardProps {
  icon: ReactNode
  title: string
  description: string
}

/**
 * Trust card used in the "Why Choose Us" section.
 * Subtle icon, clean typography, consistent styling.
 */
export function TrustCard({ icon, title, description }: TrustCardProps) {
  return (
    <div className="flex flex-col items-center text-center bg-white rounded-2xl p-8 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary-lighter)] flex items-center justify-center mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </div>
  )
}
