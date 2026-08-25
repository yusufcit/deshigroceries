import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { AdminLogoutButton } from '@/components/admin/AdminLogoutButton'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Admin Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="text-sm font-medium text-gray-300 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              View Site
            </Link>
            <AdminLogoutButton />
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}