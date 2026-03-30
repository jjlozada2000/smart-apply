import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useState, useEffect } from 'react'

const NAV = [
  { to: '/dashboard',    label: 'Dashboard',    icon: '⊞' },
  { to: '/jobs',         label: 'Find Jobs',    icon: '🔍' },
  { to: '/applications', label: 'Applications', icon: '◈' },
  { to: '/apply',        label: 'New Apply',    icon: '✦' },
  { to: '/profile',      label: 'Profile',      icon: '◎' },
  { to: '/settings',     label: 'Settings',     icon: '⚙' },
]

function useDarkMode() {
  const [dark, setDark] = useState(() => {
    return localStorage.getItem('sa_theme') === 'dark'
  })

  useEffect(() => {
    if (dark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('sa_theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('sa_theme', 'light')
    }
  }, [dark])

  return { dark, toggle: () => setDark(d => !d) }
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { dark, toggle } = useDarkMode()

  return (
    <aside style={{
      width: '230px', minHeight: '100vh', flexShrink: 0,
      background: 'var(--bg-card)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      transition: 'background 0.2s ease, border-color 0.2s ease',
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 18px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'var(--accent)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '15px', fontWeight: 800, color: '#fff',
            boxShadow: '0 0 14px rgba(108,99,255,0.35)',
          }}>S</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', letterSpacing: '-0.02em', color: 'var(--text)' }}>Smart Apply</div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em' }}>AI job tracker</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV.map(item => (
          <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 12px', borderRadius: 'var(--radius-sm)',
            fontSize: '13px', fontWeight: isActive ? 600 : 500,
            color: isActive ? 'var(--accent)' : 'var(--text-2)',
            background: isActive ? 'var(--accent-bg)' : 'transparent',
            border: isActive ? '1px solid var(--accent-dim)' : '1px solid transparent',
            transition: 'all 0.15s ease', textDecoration: 'none',
          })}>
            <span style={{ fontSize: '13px' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom section */}
      <div style={{ padding: '14px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '8px 12px',
            background: 'var(--bg-sunken)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: '7px' }}>
            <span>{dark ? '🌙' : '☀️'}</span>
            {dark ? 'Dark mode' : 'Light mode'}
          </span>
          <div style={{
            width: '32px', height: '18px', borderRadius: '9px',
            background: dark ? 'var(--accent)' : 'var(--border)',
            position: 'relative', transition: 'background 0.2s ease', flexShrink: 0,
          }}>
            <div style={{
              position: 'absolute', top: '3px',
              left: dark ? '17px' : '3px',
              width: '12px', height: '12px', borderRadius: '50%',
              background: '#fff', transition: 'left 0.2s ease',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </div>
        </button>

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', background: 'var(--bg-sunken)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
              {user?.name?.[0] ?? user?.email?.[0] ?? '?'}
            </div>
          )}
          <div style={{ overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name ?? 'You'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.email}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={() => { logout(); navigate('/login') }}
          style={{
            width: '100%', padding: '7px 12px',
            background: 'transparent', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', fontSize: '12px', color: 'var(--text-3)',
            cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--status-rejected)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}