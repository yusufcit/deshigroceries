import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminOrdersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/orders')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) redirect('/')

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    out_for_delivery: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const paymentStatusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">View and manage orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order #</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Payment</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders && orders.length > 0 ? (
                  orders.map((order: any) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{order.order_number}</td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900">{order.customer_name}</div>
                        <div className="text-sm text-gray-500">{order.customer_email}</div>
                      </td>
                      <td className="py-3 px-4 font-medium">€{order.total?.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${paymentStatusColors[order.payment_status] || 'bg-gray-100 text-gray-800'}`}>
                          {order.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-[var(--primary)] hover:underline text-sm"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}