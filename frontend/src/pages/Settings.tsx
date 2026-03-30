import { useEffect, useState } from 'react'
import { emailApi } from '../services/api'
import { Button, Card } from '../components/ui'
import { useAuth } from '../hooks/useAuth'

const PAGE: React.CSSProperties = {
  padding: '48px 52px 64px',
  maxWidth: '1100px',
  width: '100%',
  margin: '0 auto',
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [gmailEmail, setGmailEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  useEffect(() => {
    emailApi.status()
      .then(s => setGmailEmail(s.connected ? (s.email ?? null) : null))
      .catch(() => setGmailEmail(null))
      .finally(() => setLoading(false))
  }, [])

  const handleSync = async () => {
    setSyncing(true); setSyncResult(null)
    try {
      const { updated } = await emailApi.sync()
      setSyncResult(`Sync complete — ${updated} application${updated !== 1 ? 's' : ''} updated.`)
    } catch (err: unknown) {
      setSyncResult(err instanceof Error ? err.message : 'Sync failed')
    } finally { setSyncing(false) }
  }

  return (
    <div style={PAGE}>
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.03em' }}>Gmail tracking</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>
          Smart Apply scans your inbox every 20 minutes and updates application statuses when recruiters respond.
        </p>
      </div>

      {loading ? (
        <Card><div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>Loading…</div></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Connection status */}
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Connection</div>
                <div style={{
                  padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: gmailEmail ? 'var(--status-offer)' : 'var(--text-3)',
                  background: gmailEmail ? 'rgba(74,222,128,0.1)' : 'var(--bg-sunken)',
                  border: `1px solid ${gmailEmail ? 'rgba(74,222,128,0.25)' : 'var(--border)'}`,
                }}>
                  {gmailEmail ? 'Active' : 'Inactive'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>✉</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px' }}>{gmailEmail ? 'Gmail connected' : 'Gmail not connected'}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{gmailEmail ?? user?.email ?? '—'}</div>
                </div>
              </div>
            </Card>

            {gmailEmail ? (
              <>
                <Card>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Auto-sync</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.7 }}>
                    Your inbox is scanned automatically every <strong style={{ color: 'var(--text-2)' }}>20 minutes</strong>. Statuses update without you lifting a finger.
                  </p>
                </Card>

                <Card>
                  <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Manual sync</div>
                  <p style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '16px', lineHeight: 1.7 }}>
                    Trigger an immediate scan if you just received a response and want it reflected now.
                  </p>
                  <Button onClick={handleSync} loading={syncing} variant="secondary">
                    {syncing ? 'Scanning inbox…' : '↻ Sync now'}
                  </Button>
                  {syncResult && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--accent-bg)', border: '1px solid var(--accent-dim)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--text-2)' }}>
                      {syncResult}
                    </div>
                  )}
                </Card>
              </>
            ) : (
              <Card style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent-dim)' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.7 }}>
                  <strong style={{ color: 'var(--accent-2)' }}>Gmail access was not granted.</strong>{' '}
                  Sign out and sign back in with your Google account to enable inbox tracking.
                </p>
              </Card>
            )}
          </div>

          {/* Right column — how it works */}
          <Card>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '20px' }}>How status detection works</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {[
                { icon: '📅', status: 'Interview', color: 'var(--status-interview)', keywords: '"interview", "schedule", "next steps", "phone screen"' },
                { icon: '🎉', status: 'Offer',     color: 'var(--status-offer)',     keywords: '"offer", "congratulations", "salary", "start date"' },
                { icon: '👎', status: 'Rejected',  color: 'var(--status-rejected)',  keywords: '"unfortunately", "regret to inform", "not moving forward"' },
              ].map(item => (
                <div key={item.status} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: item.color, marginBottom: '4px' }}>{item.status}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', lineHeight: 1.6 }}>{item.keywords}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}