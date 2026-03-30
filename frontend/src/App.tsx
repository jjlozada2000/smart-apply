import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { Sidebar } from './components/Sidebar'
import { Spinner } from './components/ui'

import LoginPage        from './pages/Login'
import AuthSuccess      from './pages/AuthSuccess'
import DashboardPage    from './pages/Dashboard'
import ApplicationsPage from './pages/Applications'
import ApplyPage        from './pages/Apply'
import ProfilePage      from './pages/Profile'
import SettingsPage     from './pages/Settings'
import JobsPage         from './pages/Jobs'

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <Spinner size={32} />
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/auth/success" element={<AuthSuccess />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={<RequireAuth><AppLayout><DashboardPage /></AppLayout></RequireAuth>} />
      <Route path="/applications" element={<RequireAuth><AppLayout><ApplicationsPage /></AppLayout></RequireAuth>} />
      <Route path="/apply" element={<RequireAuth><AppLayout><ApplyPage /></AppLayout></RequireAuth>} />
      <Route path="/profile" element={<RequireAuth><AppLayout><ProfilePage /></AppLayout></RequireAuth>} />
      <Route path="/settings" element={<RequireAuth><AppLayout><SettingsPage /></AppLayout></RequireAuth>} />
      <Route path="/jobs" element={<RequireAuth><AppLayout><JobsPage /></AppLayout></RequireAuth>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}