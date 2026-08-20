import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) redirect('/')

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <Link href="/admin/orders" className="text-[var(--primary)] hover:underline">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', id)

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
          <div className="flex items-center gap-4 mb-2">
            <Link href="/admin/orders" className="text-[var(--primary)] hover:underline text-sm">
              &larr; Back to Orders
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Order {order.order_number}</h1>
          <p className="text-gray-600 mt-1">Order Details</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Order Status */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <label className="text-sm font-medium text-gray-500">Status</label>
            <p className="mt-1">
              <span className={`px-3 py-1 text-sm rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-800'}`}>
                {order.status?.replace(/_/g, ' ')}
              </span>
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <label className="text-sm font-medium text-gray-500">Payment</label>
            <p className="mt-1">
              <span className={`px-3 py-1 text-sm rounded-full ${paymentStatusColors[order.payment_status] || 'bg-gray-100 text-gray-800'}`}>
                {order.payment_status}
              </span>
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <label className="text-sm font-medium text-gray-500">Date</label>
            <p className="mt-1 text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{order.customer_name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{order.customer_email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="text-gray-900">{order.customer_phone}</p>
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Delivery Address</h2>
          <div className="space-y-1">
            <p className="text-gray-900">{order.delivery_address_line1}</p>
            {order.delivery_address_line2 && <p className="text-gray-900">{order.delivery_address_line2}</p>}
            <p className="text-gray-900">
              {order.delivery_city}{order.delivery_county ? `, ${order.delivery_county}` : ''}
            </p>
            {order.delivery_eircode && <p className="text-gray-900">{order.delivery_eircode}</p>}
            {order.delivery_instructions && (
              <>
                <label className="block text-sm font-medium text-gray-500 mt-2">Delivery Instructions</label>
                <p className="text-gray-700">{order.delivery_instructions}</p>
              </>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Product</th>
                  <th className="text-left py-3 text-sm font-semibold text-gray-600">Weight</th>
                  <th className="text-center py-3 text-sm font-semibold text-gray-600">Qty</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-600">Price</th>
                  <th className="text-right py-3 text-sm font-semibold text-gray-600">Total</th>
                </tr>
              </thead>
              <tbody>
                {orderItems?.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 text-gray-900">{item.product_name}</td>
                    <td className="py-3 text-gray-600">{item.weight_option || '-'}</td>
                    <td className="py-3 text-center text-gray-900">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-900">€{item.unit_price?.toFixed(2)}</td>
                    <td className="py-3 text-right text-gray-900 font-medium">€{item.total_price?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
          <div className="space-y-2 max-w-sm ml-auto">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">€{order.subtotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Fee</span>
              <span className="text-gray-900">€{order.delivery_fee?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-bold text-gray-900">Total</span>
              <span className="font-bold text-xl text-gray-900">€{order.total?.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}