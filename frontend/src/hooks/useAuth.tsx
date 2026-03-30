import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  email: string
  name: string
  avatar_url: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  loginWithGoogle: () => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [token, setToken]     = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('sa_token')
    if (!stored) {
      setLoading(false)
      return
    }
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${stored}` }
    })
      .then(r => {
        if (r.status === 401) {
          // Token is invalid or expired — clear it
          localStorage.removeItem('sa_token')
          return null
        }
        if (!r.ok) {
          // Network/server error — keep the token, just don't set user
          // so next page load will retry rather than destroying a valid token
          console.error('Auth check failed with status', r.status)
          return null
        }
        return r.json()
      })
      .then(data => {
        if (data) {
          setToken(stored)
          setUser(data)
        }
      })
      .catch(err => {
        // Network error (backend down etc) — keep the token, retry next load
        console.error('Auth check network error:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const loginWithGoogle = async () => {
    const res  = await fetch('/api/auth/google')
    const data = await res.json()
    window.location.href = data.auth_url
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('sa_token')
  }

  return (
    <AuthContext.Provider value={{ user, token, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}