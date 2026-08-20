'use client'

import Link from 'next/link'
import { ShoppingCart, User, Menu, X, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/lib/cart-store'
import { createClient } from '@/lib/supabase/client'
import { Button } from './ui/Button'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const totalItems = useCartStore((state) => state.items.length)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const navLinks = [
    { href: '/shop', label: 'Shop' },
    { href: '/categories', label: 'Categories' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 w-full ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg shadow-black/5'
          : 'bg-white border-b border-gray-100'
      }`}
    >
      {/* FIX 1: Replaced max-w-7xl with container-custom to center and align the navbar with your homepage layout grid */}
      <div className="container-custom w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-21">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
            <div className="w-10 h-10 lg:w-11 lg:h-11 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)] rounded-xl flex items-center justify-center shadow-[var(--shadow-green)] transition-transform duration-300 group-hover:scale-105">
              <span className="text-white text-lg lg:text-xl font-extrabold tracking-tight">DG</span>
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="text-lg lg:text-xl font-extrabold text-gray-900 leading-none tracking-tight">
                Deshi Grocery
              </span>
              <span className="text-xs text-[var(--primary)] font-medium mt-0.5">Fresh Halal Delivery</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          {/* FIX 2: Replaced gap-1 with gap-x-6 lg:gap-x-8 to space the links out elegantly and look highly professional */}
          <nav className="hidden md:flex items-center gap-x-6 lg:gap-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-3 py-1.5 text-gray-700 hover:text-[var(--primary)] font-semibold text-[15px] tracking-wide transition-colors duration-200 rounded-lg hover:bg-[var(--primary-lighter)] group"
              >
                {link.label}
                {/* Micro-interaction: Animated green bar underline line */}
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--primary)] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Search - Desktop */}
            <Link
              href="/shop"
              className="hidden md:flex items-center justify-center w-10 h-10 text-gray-600 hover:text-[var(--primary)] hover:bg-[var(--primary-lighter)] rounded-xl transition-all duration-200"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Divider */}
            <div className="hidden md:block w-px h-6 bg-gray-200 mx-1" />

            {/* Account */}
            <Link
              href={user ? '/account' : '/auth/login'}
              className="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-[var(--primary)] hover:bg-[var(--primary-lighter)] rounded-xl transition-all duration-200"
            >
              <User className="w-5 h-5" />
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center w-10 h-10 text-gray-600 hover:text-[var(--primary)] hover:bg-[var(--primary-lighter)] rounded-xl transition-all duration-200"
            >
              <ShoppingCart className="w-5 h-5" />
              {hydrated && totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[var(--primary)] text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-scale-in">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in-down">
          <nav className="container-custom w-full mx-auto px-4 sm:px-6 py-4">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-3 text-gray-700 hover:text-[var(--primary)] hover:bg-[var(--primary-lighter)] rounded-xl font-medium transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 my-2" />
              <Link
                href="/shop"
                className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-[var(--primary)] hover:bg-[var(--primary-lighter)] rounded-xl font-medium transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="w-5 h-5" />
                Search Products
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Delivery Banner */}
      <div className="w-full bg-gradient-to-r from-[var(--primary)] via-[var(--primary-hover)] to-[var(--primary-dark)] text-white py-2.5 px-4 flex justify-center">
        <div className="container-custom w-full flex items-center justify-center gap-2 text-sm font-medium">
          <span className="hidden sm:inline">🚚</span>
          <span>Free delivery on orders over €50</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Dublin Only</span>
          <span className="sm:hidden">• Dublin Only</span>
        </div>
      </div>
    </header>
  )
}
