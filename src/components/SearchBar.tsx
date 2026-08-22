'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  compact?: boolean
}

/**
 * Professional product search bar.
 * Typing navigates to /shop?q=... with a small debounce.
 */
export function SearchBar({ placeholder = 'Search for halal products...', onSearch, compact = false }: SearchBarProps) {
  const router = useRouter()
  const urlParams = useSearchParams()
  const [query, setQuery] = useState(urlParams.get('q') || '')
  const [isFocused, setIsFocused] = useState(false)

  useEffect(() => {
    // Skip if the value matches what's already in the URL (initial mount)
    if (!query.trim() || query.trim() === (urlParams.get('q') || '')) return
    const timer = setTimeout(() => {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
    }, 600)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const submit = () => {
    if (query.trim()) {
      router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const clear = () => {
    setQuery('')
  }

  if (onSearch) {
    // Controlled mode (used inside the shop page itself)
    return (
      <div className={`relative ${compact ? 'w-48' : 'w-full'}`}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            onSearch(e.target.value)
          }}
          placeholder={placeholder}
          className={`w-full pl-11 pr-4 border border-gray-200 rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all ${
            compact ? 'text-sm py-1.5' : 'py-2.5'
          }`}
        />
      </div>
    )
  }

  return (
    <div className={`relative ${compact ? 'w-48' : 'w-full'}`}>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
        placeholder={placeholder}
        className={`w-full pl-11 pr-10 border rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[var(--primary)] transition-all duration-200 ${
          isFocused ? 'border-[var(--primary)]' : 'border-gray-200'
        } ${compact ? 'text-sm py-1.5' : 'py-2.5'}`}
        aria-label="Search products"
      />
      {query && (
        <button
          type="button"
          onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 hover:text-gray-600 flex items-center justify-center"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
