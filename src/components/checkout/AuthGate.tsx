'use client'

import { LogIn, UserPlus, ShoppingBag } from 'lucide-react'

interface Props {
  canceled: boolean
  onGuest: () => void
  onLogin: () => void
  onRegister: () => void
}

export default function AuthGate({ canceled, onGuest, onLogin, onRegister }: Props) {
  return (
    <div>
      {canceled && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800">
          Payment was canceled. Your cart is still waiting for you.
        </div>
      )}
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 md:p-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600 mb-10">Choose how you would like to continue</p>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <button type="button" onClick={onLogin} className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-2xl hover:border-[var(--primary)] hover:bg-gray-50 transition-all text-center">
            <LogIn className="w-8 h-8 text-[var(--primary)]" />
            <span className="font-semibold">Log In</span>
            <span className="text-xs text-gray-500">Existing account</span>
          </button>
          <button type="button" onClick={onRegister} className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-2xl hover:border-[var(--primary)] hover:bg-gray-50 transition-all text-center">
            <UserPlus className="w-8 h-8 text-[var(--primary)]" />
            <span className="font-semibold">Register</span>
            <span className="text-xs text-gray-500">Create an account</span>
          </button>
          <button type="button" onClick={onGuest} className="flex flex-col items-center gap-3 p-6 border-2 border-gray-200 rounded-2xl hover:border-[var(--primary)] hover:bg-gray-50 transition-all text-center">
            <ShoppingBag className="w-8 h-8 text-[var(--primary)]" />
            <span className="font-semibold">Continue as Guest</span>
            <span className="text-xs text-gray-500">No registration needed</span>
          </button>
        </div>
        <button type="button" onClick={onGuest} className="w-full py-3 text-[var(--primary)] font-medium hover:underline">
          Prefer to just continue as a guest?
        </button>
      </div>
    </div>
  )
}
