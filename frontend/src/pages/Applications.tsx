import { useEffect, useState } from 'react'
import { applicationsApi, Application } from '../services/api'
import { Button, Card, Modal, Input, Select, Textarea, EmptyState, ConfirmModal } from '../components/ui'

const PAGE: React.CSSProperties = {
  padding: '48px 52px 64px',
  maxWidth: '1100px',
  width: '100%',
  margin: '0 auto',
}

const STATUS_OPTIONS = [
  { value: 'applied',   label: 'Applied' },
  { value: 'awaiting',  label: 'Awaiting' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer',     label: 'Offer' },
  { value: 'rejected',  label: 'Rejected' },
]

const EMPTY_FORM = {
  company: '', role: '', job_link: '', status: 'applied' as Application['status'],
  date_applied: new Date().toISOString().split('T')[0], notes: '',
}

export default function ApplicationsPage() {
  const [apps, setApps]               = useState<Application[]>([])
  const [loading, setLoading]         = useState(true)
  const [showModal, setShowModal]     = useState(false)
  const [editing, setEditing]         = useState<Application | null>(null)
  const [form, setForm]               = useState(EMPTY_FORM)
  const [saving, setSaving]           = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch]           = useState('')
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    applicationsApi.list()
      .then(data => setApps(data.sort((a, b) =>
        new Date(b.date_applied).getTime() - new Date(a.date_applied).getTime()
      )))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (app: Application) => {
    setEditing(app)
    setForm({
      company:      app.company,
      role:         app.role,
      job_link:     app.job_link || '',
      status:       app.status,
      date_applied: app.date_applied.split('T')[0],
      notes:        app.notes || '',
    })
    setShowModal(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editing) {
        const updated = await applicationsApi.update(editing.id, form)
        setApps(prev => prev.map(a => a.id === updated.id ? updated : a))
      } else {
        const created = await applicationsApi.create(form)
        setApps(prev => [created, ...prev])
      }
      setShowModal(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    setApps(prev => prev.filter(a => a.id !== id))
    setConfirmDelete(null)
    try {
      await applicationsApi.delete(id)
    } catch {
      load()
    }
  }

  const handleStatusChange = async (id: number, status: Application['status']) => {
    const updated = await applicationsApi.update(id, { status })
    setApps(prev => prev.map(a => a.id === updated.id ? updated : a))
  }

  const filtered = apps.filter(a => {
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    const matchSearch = !search ||
      a.company.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const deleteTarget = confirmDelete !== null ? apps.find(a => a.id === confirmDelete) : null

  return (
    <div style={PAGE}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '5px', letterSpacing: '-0.03em' }}>Applications</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>{apps.length} total tracked</p>
        </div>
        <Button onClick={openNew}>+ Add application</Button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          placeholder="Search company or role…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            flex: 1, padding: '9px 14px', fontSize: '13px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none',
            fontFamily: 'var(--font-display)', transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{
            padding: '9px 14px', fontSize: '13px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none',
            cursor: 'pointer', fontFamily: 'var(--font-display)',
          }}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <Card><div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>Loading…</div></Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="◈"
            title="No applications found"
            description={apps.length === 0 ? 'Add your first application to get started.' : 'Try adjusting your filters.'}
          />
        </Card>
      ) : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 130px 120px 72px', padding: '11px 22px', background: 'var(--bg-sunken)', borderBottom: '1px solid var(--border)', fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <span>Company</span><span>Role</span><span>Applied</span><span>Status</span><span></span>
          </div>

          {filtered.map((app, i) => (
            <div
              key={app.id}
              style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 130px 120px 72px', alignItems: 'center', padding: '15px 22px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border-subtle)' : 'none', transition: 'background 0.1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-elevated)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{app.company}</div>
                {app.job_link && (
                  <a href={app.job_link} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    view posting ↗
                  </a>
                )}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>{app.role}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                {new Date(app.date_applied).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <select
                value={app.status}
                onChange={e => handleStatusChange(app.id, e.target.value as Application['status'])}
                style={{ background: 'none', border: 'none', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontSize: '12px', color: 'var(--text-2)' }}
              >
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button onClick={() => openEdit(app)} style={{ padding: '5px 7px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-3)' }}>✏️</button>
                <button onClick={() => setConfirmDelete(app.id)} style={{ padding: '5px 7px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', cursor: 'pointer', fontSize: '13px', color: 'var(--text-3)' }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <Modal title={editing ? 'Edit application' : 'Add application'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Input label="Company" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} required />
              <Input label="Role" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} required />
            </div>
            <Input label="Job link" type="url" value={form.job_link} onChange={e => setForm(f => ({ ...f, job_link: e.target.value }))} placeholder="https://…" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Application['status'] }))} options={STATUS_OPTIONS} />
              <Input label="Date applied" type="date" value={form.date_applied} onChange={e => setForm(f => ({ ...f, date_applied: e.target.value }))} required />
            </div>
            <Textarea label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this application…" style={{ minHeight: '80px' }} />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" loading={saving}>{editing ? 'Save changes' : 'Add application'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm modal */}
      {confirmDelete !== null && (
        <ConfirmModal
          title="Delete application"
          message={deleteTarget ? `Remove ${deleteTarget.company} — ${deleteTarget.role} from your tracker? This cannot be undone.` : 'Delete this application? This cannot be undone.'}
          confirmLabel="Delete"
          variant="danger"
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}