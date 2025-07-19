# Generate NotFound page
not_found_tsx = """import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <div className="mb-8">
          <h1 className="text-9xl font-bold font-gaming text-accent mb-4">404</h1>
          <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
          <p className="text-gray-300 mb-8">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link to="/" className="btn-primary inline-block">
            Back to Home
          </Link>
          <br />
          <Link to="/dashboard" className="text-accent hover:text-accent/80">
            Go to Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default NotFound"""

# Write NotFound page
with open(f"{base_dir}/client/src/pages/NotFound.tsx", "w") as f:
    f.write(not_found_tsx)

print("NotFound page created!")