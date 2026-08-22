import { Minus, Plus } from 'lucide-react'

interface QuantitySelectorProps {
  quantity: number
  min?: number
  max?: number
  onChange: (quantity: number) => void
  size?: 'sm' | 'md'
  disabled?: boolean
}

/**
 * Reusable quantity selector with increment/decrement buttons.
 */
export function QuantitySelector({
  quantity,
  min = 1,
  max = 99,
  onChange,
  size = 'md',
  disabled = false,
}: QuantitySelectorProps) {
  const decrement = () => {
    if (quantity > min) onChange(quantity - 1)
  }

  const increment = () => {
    if (quantity < max) onChange(quantity + 1)
  }

  const inputSizeClasses = {
    sm: 'w-12 h-8 text-sm',
    md: 'w-14 h-10 text-base',
  }

  const buttonSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-8 h-9',
  }

  return (
    <div className="inline-flex items-center border border-gray-300 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={decrement}
        disabled={disabled || quantity <= min}
        className={`flex items-center justify-center ${buttonSizeClasses[size]} text-gray-600 hover:bg-gray-50 hover:text-[var(--primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-r border-gray-200`}
        aria-label="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={quantity}
        onChange={(e) => {
          const val = parseInt(e.target.value, 10)
          if (!isNaN(val)) onChange(Math.max(min, Math.min(max, val)))
        }}
        disabled={disabled}
        className={`text-center border-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${inputSizeClasses[size]}`}
        aria-label="Quantity"
      />
      <button
        type="button"
        onClick={increment}
        disabled={disabled || quantity >= max}
        className={`flex items-center justify-center ${buttonSizeClasses[size]} text-gray-600 hover:bg-gray-50 hover:text-[var(--primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed border-l border-gray-200`}
        aria-label="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}
