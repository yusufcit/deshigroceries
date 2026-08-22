import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, ShoppingCart, Users, Settings, Tags } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const {  data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login?next=/admin')
  }

  // Check if user is admin
  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .eq('is_active', true)
    .single()

  if (!adminUser) {
    redirect('/')
  }

  // Fetch dashboard stats
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {adminUser.full_name || adminUser.email}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{totalProducts || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{totalOrders || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900">{totalCustomers || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Link
            href="/admin/products"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow"
          >
            <Package className="w-8 h-8 text-[var(--primary)] mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Products</h3>
            <p className="text-sm text-gray-600">Manage your inventory</p>
          </Link>

          <Link
            href="/admin/orders"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow"
          >
            <ShoppingCart className="w-8 h-8 text-[var(--primary)] mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Orders</h3>
            <p className="text-sm text-gray-600">View and manage orders</p>
          </Link>

          <Link
            href="/admin/customers"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow"
          >
            <Users className="w-8 h-8 text-[var(--primary)] mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Customers</h3>
            <p className="text-sm text-gray-600">View customer list</p>
          </Link>

          <Link
            href="/admin/categories"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow"
          >
            <Tags className="w-8 h-8 text-[var(--primary)] mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Categories</h3>
            <p className="text-sm text-gray-600">Manage categories</p>
          </Link>

          <Link
            href="/admin/settings"
            className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow"
          >
            <Settings className="w-8 h-8 text-[var(--primary)] mb-3" />
            <h3 className="font-semibold text-gray-900 mb-1">Settings</h3>
            <p className="text-sm text-gray-600">Site configuration</p>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
          {recentOrders && recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Order #</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order: any) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link href={`/admin/orders/${order.id}`} className="text-[var(--primary)] hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-3 px-4">{order.customer_name}</td>
                      <td className="py-3 px-4">€{order.total.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No orders yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
