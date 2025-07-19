# Generate Order Modal component
order_modal_tsx = """import React, { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Package } from '../types'
import { api } from '../utils/api'
import { useAuth } from '../hooks/useAuth'

interface OrderModalProps {
  package: Package
  onClose: () => void
}

interface OrderFormData {
  playerId: string
  serverId: string
  paymentMethod: string
}

const servers = [
  { id: '2001', name: 'Advanced Server', flag: '🏆' },
  { id: '2002', name: 'Original Server', flag: '🌟' },
  { id: '2003', name: 'Southeast Asia', flag: '🇸🇬' },
  { id: '2004', name: 'India', flag: '🇮🇳' },
  { id: '2005', name: 'Europe', flag: '🇪🇺' },
  { id: '2006', name: 'North America', flag: '🇺🇸' },
  { id: '2007', name: 'Latin America', flag: '🇧🇷' },
  { id: '2008', name: 'Middle East', flag: '🇦🇪' },
]

const paymentMethods = [
  { id: 'upi', name: 'UPI Payment', logo: '💳' },
  { id: 'card', name: 'Credit/Debit Card', logo: '💳' },
  { id: 'wallet', name: 'Digital Wallet', logo: '📱' },
  { id: 'netbanking', name: 'Net Banking', logo: '🏦' },
]

const OrderModal: React.FC<OrderModalProps> = ({ package: pkg, onClose }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  
  const { register, handleSubmit, formState: { errors }, getValues } = useForm<OrderFormData>()

  const onSubmit = async (data: OrderFormData) => {
    if (!user) {
      alert('Please login first')
      return
    }

    setLoading(true)
    try {
      const orderText = `ID: ${data.playerId} | Server ID: ${data.serverId} | Package: ${pkg.label} | Price: ₹${pkg.price}`
      const whatsappUrl = `https://wa.me/919362584929?text=${encodeURIComponent(orderText)}`
      
      // Save order to database
      await api.post('/orders', {
        playerId: parseInt(data.playerId),
        serverId: parseInt(data.serverId),
        packageId: pkg.id,
        paymentMethod: data.paymentMethod
      })

      // Redirect to WhatsApp
      window.open(whatsappUrl, '_blank')
      onClose()
    } catch (error) {
      console.error('Order error:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const nextStep = () => {
    const values = getValues()
    if (step === 1 && values.playerId && values.serverId) {
      setStep(2)
    } else if (step === 2 && values.paymentMethod) {
      setStep(3)
    }
  }

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md w-full bg-secondary rounded-xl border border-accent/20 shadow-glow">
          <div className="flex items-center justify-between p-6 border-b border-accent/20">
            <Dialog.Title className="text-xl font-bold text-accent">
              Order {pkg.label}
            </Dialog.Title>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step >= num ? 'bg-accent text-white' : 'bg-gray-600 text-gray-400'
                    }`}
                  >
                    {num}
                  </div>
                  {num < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        step > num ? 'bg-accent' : 'bg-gray-600'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>Details</span>
              <span>Payment</span>
              <span>Confirm</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Player ID (Numbers only)
                  </label>
                  <input
                    type="text"
                    {...register('playerId', { 
                      required: 'Player ID is required',
                      pattern: {
                        value: /^[0-9]+$/,
                        message: 'Only numbers allowed'
                      },
                      minLength: {
                        value: 6,
                        message: 'Player ID must be at least 6 digits'
                      }
                    })}
                    className="input w-full"
                    placeholder="Enter your Player ID"
                  />
                  {errors.playerId && (
                    <p className="text-red-400 text-sm mt-1">{errors.playerId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Server ID
                  </label>
                  <select
                    {...register('serverId', { required: 'Server ID is required' })}
                    className="input w-full"
                  >
                    <option value="">Select Server</option>
                    {servers.map((server) => (
                      <option key={server.id} value={server.id} className="bg-secondary">
                        {server.flag} {server.name} ({server.id})
                      </option>
                    ))}
                  </select>
                  {errors.serverId && (
                    <p className="text-red-400 text-sm mt-1">{errors.serverId.message}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full btn-primary"
                >
                  Continue to Payment
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <label
                        key={method.id}
                        className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                          getValues('paymentMethod') === method.id
                            ? 'border-accent bg-accent/10'
                            : 'border-gray-600 hover:border-accent/50'
                        }`}
                      >
                        <input
                          type="radio"
                          value={method.id}
                          {...register('paymentMethod', { required: 'Payment method is required' })}
                          className="sr-only"
                        />
                        <span className="text-2xl mr-2">{method.logo}</span>
                        <span className="text-sm text-gray-300">{method.name}</span>
                      </label>
                    ))}
                  </div>
                  {errors.paymentMethod && (
                    <p className="text-red-400 text-sm mt-1">{errors.paymentMethod.message}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 btn-primary"
                  >
                    Review Order
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="bg-primary/30 rounded-lg p-4">
                  <h3 className="font-bold text-accent mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Package:</span>
                      <span>{pkg.label}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Player ID:</span>
                      <span>{getValues('playerId')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Server:</span>
                      <span>{servers.find(s => s.id === getValues('serverId'))?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Payment:</span>
                      <span>{paymentMethods.find(p => p.id === getValues('paymentMethod'))?.name}</span>
                    </div>
                    <div className="border-t border-gray-600 pt-2 flex justify-between font-bold">
                      <span>Total:</span>
                      <span className="text-accent">₹{pkg.price}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-gray-400 text-center">
                  Clicking "Order Now" will redirect you to WhatsApp to complete your payment
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Order Now'}
                  </button>
                </div>
              </motion.div>
            )}
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default OrderModal"""

# Write the OrderModal component
with open(f"{base_dir}/client/src/components/OrderModal.tsx", "w") as f:
    f.write(order_modal_tsx)

print("OrderModal component created!")