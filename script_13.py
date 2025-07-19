# Generate AdminPanel page
admin_panel_tsx = """import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../utils/api'
import { Order, User, Package } from '../types'
import { 
  UserGroupIcon, 
  ShoppingBagIcon, 
  CurrencyRupeeIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline'

const AdminPanel: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      const [ordersRes, usersRes, packagesRes] = await Promise.all([
        api.get('/admin/orders'),
        api.get('/admin/users'),
        api.get('/admin/packages'),
      ])
      setOrders(ordersRes.data)
      setUsers(usersRes.data)
      setPackages(packagesRes.data)
    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: number, status: string, notes?: string) => {
    try {
      await api.put(`/admin/orders/${orderId}`, { status, notes })
      fetchAdminData()
      setSelectedOrder(null)
    } catch (error) {
      console.error('Error updating order:', error)
      alert('Failed to update order status')
    }
  }

  const stats = {
    totalOrders: orders.length,
    pendingOrders: orders.filter(o => o.status === 'Pending').length,
    completedOrders: orders.filter(o => o.status === 'Completed').length,
    totalRevenue: orders
      .filter(o => o.status === 'Completed')
      .reduce((sum, o) => sum + (o.package?.price || 0), 0),
    totalUsers: users.length,
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-red-400 mb-2">Admin Panel</h1>
          <p className="text-gray-300">Manage orders, users, and system settings</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-red-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-red-400">{stats.totalOrders}</p>
              </div>
              <ShoppingBagIcon className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending Orders</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.pendingOrders}</p>
              </div>
              <ChartBarIcon className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold text-green-400">₹{stats.totalRevenue}</p>
              </div>
              <CurrencyRupeeIcon className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-blue-400">{stats.totalUsers}</p>
              </div>
              <UserGroupIcon className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1 mb-6">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'orders', label: 'Orders' },
            { id: 'users', label: 'Users' },
            { id: 'packages', label: 'Packages' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-red-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-red-500/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <h2 className="text-xl font-bold text-red-400 mb-6">Order Management</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300">Order ID</th>
                    <th className="text-left py-3 px-4 text-gray-300">User</th>
                    <th className="text-left py-3 px-4 text-gray-300">Package</th>
                    <th className="text-left py-3 px-4 text-gray-300">Amount</th>
                    <th className="text-left py-3 px-4 text-gray-300">Status</th>
                    <th className="text-left py-3 px-4 text-gray-300">Date</th>
                    <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-white">#{order.id}</td>
                      <td className="py-3 px-4 text-gray-300">{order.user_id}</td>
                      <td className="py-3 px-4 text-gray-300">{order.package?.label}</td>
                      <td className="py-3 px-4 text-green-400">₹{order.package?.price}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          order.status === 'Pending' ? 'bg-yellow-400/20 text-yellow-300' :
                          order.status === 'Processing' ? 'bg-blue-400/20 text-blue-300' :
                          order.status === 'Completed' ? 'bg-green-400/20 text-green-300' :
                          'bg-red-400/20 text-red-300'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <h2 className="text-xl font-bold text-red-400 mb-6">User Management</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 text-gray-300">User ID</th>
                    <th className="text-left py-3 px-4 text-gray-300">Name</th>
                    <th className="text-left py-3 px-4 text-gray-300">Email</th>
                    <th className="text-left py-3 px-4 text-gray-300">Orders</th>
                    <th className="text-left py-3 px-4 text-gray-300">Joined</th>
                    <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-white">{user.id.slice(0, 8)}...</td>
                      <td className="py-3 px-4 text-gray-300">{user.name}</td>
                      <td className="py-3 px-4 text-gray-300">{user.email}</td>
                      <td className="py-3 px-4 text-blue-400">
                        {orders.filter(o => o.user_id === user.id).length}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-red-400 hover:text-red-300 text-sm">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Order Update Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-bold text-red-400 mb-4">
                Update Order #{selectedOrder.id}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    defaultValue={selectedOrder.status}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                    onChange={(e) => {
                      updateOrderStatus(selectedOrder.id, e.target.value)
                    }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Completed">Completed</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPanel"""

# Write AdminPanel page
with open(f"{base_dir}/client/src/pages/AdminPanel.tsx", "w") as f:
    f.write(admin_panel_tsx)

print("AdminPanel page created!")