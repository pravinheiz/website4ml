# Generate Navbar component
navbar_tsx = """import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'

const Navbar: React.FC = () => {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Products', href: '/#products' },
    { name: 'Transactions', href: user ? '/dashboard' : '/login' },
    { name: 'Support', href: '/#support' },
  ]

  return (
    <>
      {/* Promo Banner */}
      <div className="bg-accent2 text-white py-2 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap">
          <span className="mx-4">🔥 Double Bonus Weekend - Limited Time Offer!</span>
          <span className="mx-4">🎁 500+50 Diamonds Flash Sale</span>
          <span className="mx-4">🚀 0% UPI Processing Fee</span>
          <span className="mx-4">⚡ Instant Delivery 24/7</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-primary/95 backdrop-blur-md border-b border-accent/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="text-2xl font-bold font-gaming text-accent animate-pulse">
                P&K Store
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-300 hover:text-accent transition-colors duration-300 relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent transition-all duration-300 group-hover:w-full"></span>
                </Link>
              ))}
            </div>

            {/* User Menu */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-white hover:text-accent transition-colors"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                    ) : (
                      <UserCircleIcon className="w-8 h-8" />
                    )}
                    <span className="text-sm">{user.name}</span>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-secondary rounded-lg shadow-lg border border-accent/20 z-50">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-accent/20 rounded-t-lg"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-accent/20 rounded-b-lg"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn-primary"
                >
                  Login / Signup
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-300 hover:text-accent"
              >
                {isMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" />
                ) : (
                  <Bars3Icon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-secondary/95 backdrop-blur-md border-t border-accent/20">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-3 py-2 text-gray-300 hover:text-accent hover:bg-accent/10 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 text-gray-300 hover:text-accent hover:bg-accent/10 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-gray-300 hover:text-accent hover:bg-accent/10 rounded-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="block mx-3 my-2 text-center btn-primary"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login / Signup
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </>
  )
}

export default Navbar"""

# Write the navbar component
with open(f"{base_dir}/client/src/components/Navbar.tsx", "w") as f:
    f.write(navbar_tsx)

print("Navbar component created!")