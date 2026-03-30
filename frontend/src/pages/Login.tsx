import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { loginWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const error = new URLSearchParams(window.location.search).get('error')

  const handleGoogle = async () => {
    setLoading(true)
    await loginWithGoogle()
    // page redirects to Google — no need to reset loading
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            width: '56px', height: '56px', background: 'var(--accent)',
            borderRadius: '14px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff', fontSize: '28px',
            fontWeight: 800, margin: '0 auto 20px',
          }}>S</div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px' }}>Smart Apply</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '14px', maxWidth: '280px', margin: '0 auto' }}>
            Generate tailored applications, track every role, and get notified when companies respond.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            marginBottom: '20px', padding: '12px 16px',
            background: '#fee', border: '1px solid #fcc',
            borderRadius: 'var(--radius-sm)', fontSize: '13px',
            color: 'var(--status-rejected)', textAlign: 'center',
          }}>
            {error === 'oauth_cancelled' ? 'Sign-in was cancelled.' : `Error: ${error}`}
          </div>
        )}

        {/* Google Sign-In button */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '12px',
            padding: '13px 24px',
            background: loading ? 'var(--bg-sunken)' : 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontSize: '15px', fontWeight: 600,
            color: loading ? 'var(--text-3)' : 'var(--text)',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-display)',
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-sm)' }}
        >
          {loading ? (
            <span style={{ fontSize: '13px' }}>Redirecting…</span>
          ) : (
            <>
              {/* Google G icon */}
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </>
          )}
        </button>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-3)', lineHeight: 1.6 }}>
          By signing in, you grant Smart Apply read-only access to your Gmail
          to detect recruiter responses and update application statuses automatically.
        </p>
      </div>
    </div>
  )
}
