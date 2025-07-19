# Generate main React app entry point
main_tsx = """import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)"""

# Generate main App component
app_tsx = """import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import AdminPanel from './pages/AdminPanel'
import ProtectedRoute from './components/ProtectedRoute'
import ParticlesBackground from './components/ParticlesBackground'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-primary via-secondary to-backgroundDark relative">
          <ParticlesBackground />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/superadmin-9d2f1b6d" element={<AdminPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App"""

# Generate API utility
api_ts = """import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api"""

# Generate types file
types_ts = """export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  created_at: string
}

export interface Package {
  id: number
  label: string
  diamonds: number
  bonus: number
  price: number
  isPopular?: boolean
  oldPrice?: number
}

export interface Order {
  id: number
  user_id: string
  player_id: number
  server_id: number
  package_id: number
  package?: Package
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed'
  created_at: string
  whatsapp_url?: string
}

export interface Server {
  id: number
  name: string
  flag?: string
}"""

# Write main React files
with open(f"{base_dir}/client/src/main.tsx", "w") as f:
    f.write(main_tsx)

with open(f"{base_dir}/client/src/App.tsx", "w") as f:
    f.write(app_tsx)

with open(f"{base_dir}/client/src/utils/api.ts", "w") as f:
    f.write(api_ts)

with open(f"{base_dir}/client/src/types.ts", "w") as f:
    f.write(types_ts)

print("Main React application files created!")