import { useEffect } from 'react'
import { Spinner } from '../components/ui'

export default function AuthSuccess() {
  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    if (token) {
      localStorage.setItem('sa_token', token)
    }
    window.location.replace(token ? '/dashboard' : '/login?error=no_token')
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '12px', color: 'var(--text-3)' }}>
      <Spinner size={20} />
      <span style={{ fontSize: '14px' }}>Signing you in…</span>
    </div>
  )
}