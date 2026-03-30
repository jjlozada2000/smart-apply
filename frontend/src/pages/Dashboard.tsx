import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi, Application } from '../services/api'
import { StatusBadge, EmptyState, Spinner } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

const PAGE: React.CSSProperties = {
  padding: '48px 52px 64px',
  maxWidth: '1100px',
  width: '100%',
  margin: '0 auto',
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '22px 20px',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
      </div>
      <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    applicationsApi.list().then(setApps).catch(console.error).finally(() => setLoading(false))
  }, [])

  const stats = {
    applied:   apps.filter(a => a.status === 'applied').length,
    awaiting:  apps.filter(a => a.status === 'awaiting').length,
    interview: apps.filter(a => a.status === 'interview').length,
    offer:     apps.filter(a => a.status === 'offer').length,
    rejected:  apps.filter(a => a.status === 'rejected').length,
  }

  const responseRate = apps.length
    ? Math.round((apps.filter(a => a.status !== 'applied').length / apps.length) * 100)
    : 0

  const recent = [...apps]
    .sort((a, b) => new Date(b.date_applied).getTime() - new Date(a.date_applied).getTime())
    .slice(0, 6)

  const firstName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there'

  return (
    <div style={PAGE}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.03em' }}>
          Hey, {firstName} 👋
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>Here's your job search at a glance.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '32px' }}>
        <StatCard value={stats.applied}   label="Applied"    color="var(--status-applied)" />
        <StatCard value={stats.awaiting}  label="Awaiting"   color="var(--status-awaiting)" />
        <StatCard value={stats.interview} label="Interviews" color="var(--status-interview)" />
        <StatCard value={stats.offer}     label="Offers"     color="var(--status-offer)" />
        <StatCard value={stats.rejected}  label="Rejected"   color="var(--status-rejected)" />
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '14px', marginBottom: '32px' }}>
        {/* Response rate */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '22px 24px', boxShadow: 'var(--shadow-sm)' }}>
          {apps.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '14px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-2)' }}>Response rate</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 700, color: 'var(--accent)' }}>{responseRate}%</span>
              </div>
              <div style={{ height: '6px', background: 'var(--bg-sunken)', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
                <div style={{ height: '100%', width: `${responseRate}%`, background: 'linear-gradient(90deg, var(--accent), var(--accent-2))', borderRadius: '3px', transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{apps.length} total</span>
                <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{apps.filter(a => a.status !== 'applied').length} responses</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{ fontSize: '28px' }}>🚀</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>Ready to start?</div>
                <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Generate your first application below.</div>
              </div>
            </div>
          )}
        </div>

        {/* New Apply CTA */}
        <Link to="/apply">
          <div style={{
            background: 'var(--accent)', borderRadius: 'var(--radius)', padding: '22px 20px',
            height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px',
            boxShadow: '0 0 24px rgba(108,99,255,0.3)', cursor: 'pointer', transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <span style={{ fontSize: '20px' }}>✦</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>New Apply</span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>Generate cover letter or resume</span>
          </div>
        </Link>
      </div>

      {/* Recent applications */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em' }}>Recent applications</h2>
          <Link to="/applications" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>View all →</Link>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '48px' }}><Spinner size={24} /></div>
          ) : recent.length === 0 ? (
            <EmptyState icon="◈" title="No applications yet" description="Head to New Apply to generate your first one." />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '16px', padding: '11px 22px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-sunken)' }}>
                {['Company', 'Role', 'Date', 'Status'].map(h => (
                  <span key={h} style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</span>
                ))}
              </div>
              {recent.map((app, i) => (
                <div key={app.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '16px',
                  padding: '15px 22px', borderBottom: i < recent.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  alignItems: 'center', transition: 'background 0.1s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontWeight: 600, fontSize: '14px' }}>{app.company}</span>
                  <span style={{ fontSize: '13px', color: 'var(--text-2)' }}>{app.role}</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                    {new Date(app.date_applied).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}