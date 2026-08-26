'use client'

import Link from 'next/link'
import { ShoppingCart, User, Menu, X, MapPin, Phone, LayoutGrid, LogOut } from 'lucide-react'
import { useState, useEffect, Suspense } from 'react'
import { useCartStore } from '@/lib/cart-store'
import { createClient } from '@/lib/supabase/client'
import { SearchBar } from './SearchBar'
import { UserAccountMenu } from './UserAccountMenu'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const totalItems = useCartStore((state) => state.getTotalItems())
  const subtotal = useCartStore((state) => state.getSubtotal())
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
    { href: '/shop?sale=true', label: 'Offers' },
    { href: '/#why-us', label: 'About' },
    { href: '/#delivery', label: 'Delivery' },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
      {/* ── Top strip ── */}
      <div className="w-full bg-[var(--primary-dark)] text-white">
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center sm:justify-between h-8 text-xs font-medium">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              Free delivery on orders over €50 — Dublin only
            </span>
            <a
              href="tel:+35312345678"
              className="hidden sm:flex items-center gap-1.5 hover:text-emerald-200 transition-colors"
            >
              <Phone className="w-3 h-3" />
              +353 1 234 5678
            </a>
          </div>
        </div>
      </div>

      {/* ── Main header row ── */}
      <div
        className={`w-full bg-white transition-shadow duration-300 ${
          isScrolled ? 'shadow-md' : ''
        }`}
      >
        <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 md:gap-6 h-16 lg:h-[72px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="w-10 h-10 bg-[var(--primary)] rounded-xl flex items-center justify-center shadow-[var(--shadow-green)] transition-transform duration-300 group-hover:scale-105">
                <span className="text-white text-lg font-extrabold tracking-tight">DG</span>
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-lg font-extrabold text-gray-900 leading-none tracking-tight">
                  Deshi Grocery
                </span>
                <span className="text-[11px] text-[var(--primary)] font-semibold mt-0.5">
                  Fresh Halal Delivery
                </span>
              </div>
            </Link>

            {/* Search — Borobazar-style prominent centered bar */}
            <div className="hidden md:flex flex-1 max-w-xl mx-auto">
              <Suspense
                fallback={
                  <div className="w-full h-11 bg-gray-100 rounded-full animate-pulse" />
                }
              >
                <SearchBar />
              </Suspense>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 md:gap-3 ml-auto">
              {/* Account */}
              {user ? (
                <UserAccountMenu user={user} />
              ) : (
                <Link
                  href="/auth/login"
                  className="hidden sm:flex items-center justify-center w-10 h-10 text-gray-600 hover:text-[var(--primary)] hover:bg-[var(--primary-lighter)] rounded-full transition-all duration-200"
                  aria-label="Sign in"
                >
                  <User className="w-5 h-5" />
                </Link>
              )}

              {/* Cart — green pill with total (Borobazar signature) */}
              <Link
                href="/cart"
                className="flex items-center gap-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full pl-3 pr-4 h-10 shadow-[var(--shadow-green)] transition-all duration-200"
              >
                <span className="relative">
                  <ShoppingCart className="w-5 h-5" />
                  {hydrated && totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-[var(--accent)] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow">
                      {totalItems}
                    </span>
                  )}
                </span>
                <span className="text-sm font-bold">
                  {hydrated && subtotal > 0 ? `€${subtotal.toFixed(2)}` : 'Cart'}
                </span>
              </Link>

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden border-t border-gray-100 px-4 py-2.5">
          <Suspense
            fallback={<div className="w-full h-10 bg-gray-100 rounded-full animate-pulse" />}
          >
            <SearchBar compact={false} />
          </Suspense>
        </div>

        {/* ── Nav row ── */}
        <nav className="hidden md:block border-t border-gray-100">
          <div className="container-custom mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 h-11">
              <Link
                href="/categories"
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-[var(--primary)] bg-[var(--primary-lighter)] rounded-lg mr-2"
              >
                <LayoutGrid className="w-4 h-4" />
                All Categories
              </Link>
              {navLinks.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-[var(--primary)] hover:bg-gray-50 rounded-lg transition-colors duration-150"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </div>

      {/* ── Mobile menu ── */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="container-custom mx-auto px-4 py-3">
            <div className="flex flex-col">
              {[{ href: '/categories', label: 'All Categories' }, ...navLinks].map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  className="px-3 py-3 text-gray-700 hover:text-[var(--primary)] hover:bg-[var(--primary-lighter)] rounded-lg font-medium transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 my-1" />
              <Link
                href={user ? '/account' : '/auth/login'}
                className="flex items-center gap-3 px-3 py-3 text-gray-700 hover:text-[var(--primary)] hover:bg-[var(--primary-lighter)] rounded-lg font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="w-5 h-5" />
                {user ? 'My Account' : 'Sign In'}
              </Link>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    createClient()
                      .auth.signOut()
                      .then(() => {
                        window.location.href = '/'
                      })
                      .catch(() => {})
                  }}
                  className="flex items-center gap-3 px-3 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
