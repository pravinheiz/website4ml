# Generate Dashboard page
dashboard_tsx = """import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../hooks/useAuth'
import { api } from '../utils/api'
import { Order } from '../types'
import { ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders/user')
      setOrders(response.data)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <ClockIcon className="w-5 h-5 text-yellow-400" />
      case 'Processing':
        return <ClockIcon className="w-5 h-5 text-blue-400" />
      case 'Completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-400" />
      case 'Failed':
        return <XCircleIcon className="w-5 h-5 text-red-400" />
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-400/20 text-yellow-300 border-yellow-400/30'
      case 'Processing':
        return 'bg-blue-400/20 text-blue-300 border-blue-400/30'
      case 'Completed':
        return 'bg-green-400/20 text-green-300 border-green-400/30'
      case 'Failed':
        return 'bg-red-400/20 text-red-300 border-red-400/30'
      default:
        return 'bg-gray-400/20 text-gray-300 border-gray-400/30'
    }
  }

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold font-gaming text-accent mb-2">
            Welcome, {user?.name}
          </h1>
          <p className="text-gray-300">Manage your diamond orders and account settings</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-accent">{orders.length}</p>
              </div>
              <div className="w-12 h-12 bg-accent/20 rounded-lg flex items-center justify-center">
                📊
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-green-400">
                  {orders.filter(o => o.status === 'Completed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center">
                ✅
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {orders.filter(o => o.status === 'Pending').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                ⏳
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-secondary/30 rounded-lg p-1 mb-6">
          {[
            { id: 'orders', label: 'Order History' },
            { id: 'profile', label: 'Profile Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-accent text-white'
                  : 'text-gray-300 hover:text-white hover:bg-accent/20'
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
            className="card"
          >
            <h2 className="text-xl font-bold text-accent mb-6">Order History</h2>
            
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No orders found</p>
                <a href="/" className="btn-primary">
                  Start Shopping
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-primary/30 rounded-lg p-4 border border-accent/10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-semibold text-accent">Order #{order.id}</span>
                          <span className={`px-2 py-1 rounded-full text-xs border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p>Player ID: {order.player_id}</p>
                          <p>Server ID: {order.server_id}</p>
                          <p>Package: {order.package?.label}</p>
                          <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-accent">₹{order.package?.price}</p>
                        </div>
                        {getStatusIcon(order.status)}
                      </div>
                    </div>
                    
                    {order.whatsapp_url && (
                      <div className="mt-3 pt-3 border-t border-accent/10">
                        <a
                          href={order.whatsapp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent/80 text-sm"
                        >
                          Continue on WhatsApp →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="card"
          >
            <h2 className="text-xl font-bold text-accent mb-6">Profile Settings</h2>
            
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-16 h-16 rounded-full" />
                ) : (
                  <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center text-2xl">
                    {user?.name?.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold text-white">{user?.name}</h3>
                  <p className="text-gray-400">{user?.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    className="input w-full"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    className="input w-full"
                    readOnly
                  />
                </div>
              </div>

              <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                <h4 className="font-semibold text-accent mb-2">Account Security</h4>
                <p className="text-gray-300 text-sm">
                  Your account is secured with Google OAuth. Contact support for any security concerns.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Dashboard"""

# Write Dashboard page
with open(f"{base_dir}/client/src/pages/Dashboard.tsx", "w") as f:
    f.write(dashboard_tsx)

print("Dashboard page created!")