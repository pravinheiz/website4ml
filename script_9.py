# Generate Home page component
home_tsx = """import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { api } from '../utils/api'
import { Package } from '../types'
import OrderModal from '../components/OrderModal'
import { SparklesIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline'

const Home: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await api.get('/packages')
      setPackages(response.data)
    } catch (error) {
      console.error('Error fetching packages:', error)
      // Fallback data
      setPackages([
        { id: 1, label: '50+50 Diamonds', diamonds: 50, bonus: 50, price: 80, oldPrice: 100 },
        { id: 2, label: '150+150 Diamonds', diamonds: 150, bonus: 150, price: 260, oldPrice: 320 },
        { id: 3, label: '500+500 Diamonds', diamonds: 500, bonus: 500, price: 680, oldPrice: 800, isPopular: true },
        { id: 4, label: '1000+1000 Diamonds', diamonds: 1000, bonus: 1000, price: 1300, oldPrice: 1600 },
        { id: 5, label: '2000+2000 Diamonds', diamonds: 2000, bonus: 2000, price: 2500, oldPrice: 3200 },
        { id: 6, label: '5000+5000 Diamonds', diamonds: 5000, bonus: 5000, price: 6000, oldPrice: 8000 },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            <h1 className="text-4xl md:text-6xl font-bold font-gaming mb-6 bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">
              Mobile Legends
              <br />
              Diamond Recharge
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Instant Delivery • Best Prices • 24/7 Support
            </p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start mb-8">
              <div className="flex items-center gap-2 text-accent">
                <ClockIcon className="w-5 h-5" />
                <span>Instant Delivery</span>
              </div>
              <div className="flex items-center gap-2 text-accent">
                <ShieldCheckIcon className="w-5 h-5" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-2 text-accent">
                <SparklesIcon className="w-5 h-5" />
                <span>Best Prices</span>
              </div>
            </div>
            <motion.a
              href="#products"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block btn-primary text-lg px-8 py-4 animate-pulseGlow"
            >
              Recharge Now
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="w-full max-w-md mx-auto animate-float">
              <img
                src="/mlbb-hero.png"
                alt="Mobile Legends Character"
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjMWExYTM1Ii8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMDBhMWZmIiBmb250LXNpemU9IjI0IiBmb250LWZhbWlseT0iQXJpYWwiPk1MQkIgSGVybzwvdGV4dD4KPC9zdmc+'
                }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-5xl font-bold font-gaming mb-4 text-accent">
              Diamond Packages
            </h2>
            <p className="text-gray-300 text-lg">
              Choose your perfect diamond package with instant delivery
            </p>
          </motion.div>

          {loading ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-accent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg, index) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="card relative group cursor-pointer"
                  onClick={() => setSelectedPackage(pkg)}
                >
                  {pkg.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-accent2 text-white px-4 py-1 text-xs rounded-full animate-bounce">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-xl font-bold mb-2 text-accent">{pkg.label}</h3>
                    <div className="mb-4">
                      <span className="text-2xl font-bold text-white">₹{pkg.price}</span>
                      {pkg.oldPrice && (
                        <span className="text-sm text-gray-400 line-through ml-2">₹{pkg.oldPrice}</span>
                      )}
                    </div>
                    <div className="text-gray-300 mb-6">
                      <p>{pkg.diamonds} Diamonds</p>
                      <p className="text-accent2">+ {pkg.bonus} Bonus</p>
                    </div>
                    <button className="w-full btn-secondary group-hover:shadow-glowPink">
                      Buy Now
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Support Section */}
      <section id="support" className="py-20 px-4 bg-secondary/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-gaming mb-8 text-accent">
            24/7 Support Available
          </h2>
          <p className="text-gray-300 text-lg mb-8">
            Need help with your order? Our support team is available around the clock
          </p>
          <a
            href={`https://wa.me/919362584929?text=Hi%20P%26K%20Store%2C%20I%20need%20help%20with%20my%20order`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex items-center gap-2"
          >
            <span>Contact Support</span>
          </a>
        </div>
      </section>

      {/* Order Modal */}
      {selectedPackage && (
        <OrderModal
          package={selectedPackage}
          onClose={() => setSelectedPackage(null)}
        />
      )}
    </div>
  )
}

export default Home"""

# Write the Home page
with open(f"{base_dir}/client/src/pages/Home.tsx", "w") as f:
    f.write(home_tsx)

print("Home page component created!")