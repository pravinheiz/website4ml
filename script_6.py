# Generate Auth hook
use_auth_ts = """import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '../utils/api'
import { User } from '../types'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { email, password })
      setUser(response.data.user)
      return true
    } catch (error) {
      return false
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
    }
  }

  useEffect(() => {
    refreshUser()
  }, [])

  const value = {
    user,
    loading,
    login,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}"""

# Write the auth hook
with open(f"{base_dir}/client/src/hooks/useAuth.tsx", "w") as f:
    f.write(use_auth_ts)

print("Auth hook created!")