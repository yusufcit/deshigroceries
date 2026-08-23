import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Package, Euro } from 'lucide-react'
import type { Customer, Address, Order } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  out_for_delivery: 'bg-purple-100 text-purple-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/admin/customers/${id}`)

  const { data: adminUser } = await supabase
    .from('admin_users').select('id').eq('id', user.id).eq('is_active', true).single()
  if (!adminUser) redirect('/')

  const { data: customer } = await supabase.from('customers').select('*').eq('id', id).maybeSingle()
  if (!customer) notFound()

  const [{ data: addresses }, { data: recentOrders }, { data: totals }] = await Promise.all([
    supabase.from('addresses').select('*').eq('customer_id', id)
      .order('is_default', { ascending: false }).order('created_at'),
    supabase.from('orders').select('*').eq('customer_id', id)
      .order('created_at', { ascending: false }).limit(10),
    supabase.from('orders').select('total').eq('customer_id', id),
  ])
  const totalSpent = (totals ?? []).reduce((s, o) => s + (Number(o.total) || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to customers
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{(customer as Customer).full_name || 'Unnamed customer'}</h1>
          <p className="text-gray-600 mt-1">Customer since {new Date((customer as Customer).created_at).toLocaleDateString('en-IE')}</p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-6">
        {/* Contact */}
        <div className="bg-white rounded-lg shadow-md p-6 md:col-span-1 space-y-4">
          <h2 className="font-bold text-gray-900">Contact</h2>
          <p className="flex items-start gap-2 text-sm text-gray-700 break-all">
            <Mail className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />{(customer as Customer).email}
          </p>
          <p className="flex items-center gap-2 text-sm text-gray-700">
            <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />{(customer as Customer).phone || 'Not provided'}
          </p>
          <div className="pt-3 border-t grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900">{(totals ?? []).length}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Orders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--primary)]">€{totalSpent.toFixed(2)}</p>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total spent</p>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          {/* Addresses */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" /> Saved addresses ({(addresses ?? []).length})
            </h2>
            {(addresses ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">No saved addresses yet.</p>
            ) : (
              <ul className="space-y-3">
                {(addresses ?? []).map((a: Address) => (
                  <li key={a.id} className={`rounded-lg border p-4 text-sm ${a.is_default ? 'border-[var(--primary)] bg-[var(--primary-lighter)]' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-900">{a.full_name} · {a.phone}</span>
                      {a.is_default && <span className="text-[10px] font-bold text-[var(--primary)] tracking-wide">DEFAULT</span>}
                    </div>
                    <p className="text-gray-700">
                      {a.address_line1}{a.address_line2 ? `, ${a.address_line2}` : ''}, {a.city}, {a.county}{a.eircode ? ` · ${a.eircode}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Orders */}
          <div className="bg-white rounded-lg shadow-md p-6 overflow-hidden">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-gray-400" /> Recent orders
            </h2>
            {(recentOrders ?? []).length === 0 ? (
              <p className="text-sm text-gray-500">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2 pr-3 font-medium">Order</th>
                    <th className="py-2 pr-3 font-medium">Date</th>
                    <th className="py-2 pr-3 font-medium">Total</th>
                    <th className="py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(recentOrders ?? []).map((o: Order) => (
                    <tr key={o.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2.5 pr-3">
                        <Link href={`/admin/orders/${o.id}`} className="text-[var(--primary)] hover:underline font-medium">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="py-2.5 pr-3 text-gray-600">{new Date(o.created_at).toLocaleDateString('en-IE')}</td>
                      <td className="py-2.5 pr-3 flex items-center gap-1 text-gray-900 font-medium"><Euro className="w-3 h-3" />{o.total.toFixed(2)}</td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${STATUS_STYLES[o.status] || 'bg-gray-100 text-gray-700'}`}>
                          {o.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}