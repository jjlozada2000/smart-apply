import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Spinner } from '../components/ui'

const PAGE: React.CSSProperties = {
  padding: '48px 52px 64px',
  maxWidth: '1100px',
  width: '100%',
  margin: '0 auto',
}

interface Job {
  id: string
  title: string
  company: string
  location: string
  is_remote: boolean
  employment_type: string
  description: string
  apply_link: string
  posted_at: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  salary_period: string | null
  company_logo: string | null
  publisher: string
  highlights: {
    Qualifications?: string[]
    Responsibilities?: string[]
    Benefits?: string[]
  }
}

interface MatchResult {
  score: number
  covered: string[]
  partial: string[]
  missing: string[]
}

const EMPLOYMENT_TYPES = [
  { value: '',           label: 'Any type' },
  { value: 'FULLTIME',   label: 'Full-time' },
  { value: 'PARTTIME',   label: 'Part-time' },
  { value: 'CONTRACTOR', label: 'Contract' },
  { value: 'INTERN',     label: 'Internship' },
]

const DATE_POSTED = [
  { value: 'all',   label: 'Any time' },
  { value: 'today', label: 'Last 24 hours' },
  { value: '3days', label: 'Last 3 days' },
  { value: 'week',  label: 'Last week' },
  { value: 'month', label: 'Last month' },
]

const SORT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  default: [
    { value: 'relevance', label: 'Most relevant' },
    { value: 'date',      label: 'Most recent' },
  ],
  date: [
    { value: 'date_desc', label: 'Newest first' },
    { value: 'date_asc',  label: 'Oldest first' },
  ],
  salary: [
    { value: 'salary_desc', label: 'Highest salary' },
    { value: 'salary_asc',  label: 'Lowest salary' },
  ],
}

function formatSalary(min: number | null, max: number | null, _currency: string, period: string | null) {
  if (!min && !max) return null
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`
  const per = period === 'YEAR' ? '/yr' : period === 'HOUR' ? '/hr' : ''
  if (min && max) return `${fmt(min)} – ${fmt(max)}${per}`
  if (min) return `${fmt(min)}+${per}`
  return `Up to ${fmt(max!)}${per}`
}

function formatPosted(dateStr: string) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const hours = Math.floor(diff / 3600000)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 5) return `${weeks}w ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function matchColor(score: number) {
  if (score >= 70) return { color: 'var(--status-offer)', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.25)' }
  if (score >= 40) return { color: 'var(--status-awaiting)', bg: 'rgba(234,88,12,0.1)', border: 'rgba(234,88,12,0.25)' }
  return { color: 'var(--status-rejected)', bg: 'rgba(220,38,38,0.1)', border: 'rgba(220,38,38,0.25)' }
}

function MatchBadge({ match }: { match: MatchResult | null | 'loading' }) {
  const [open, setOpen] = useState(false)

  if (match === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
        <Spinner size={10} /> Analyzing…
      </div>
    )
  }

  if (!match) return null

  const { color, bg, border } = matchColor(match.score)

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: bg, border: `1px solid ${border}`, fontSize: '11px', fontWeight: 700, color, cursor: 'pointer', fontFamily: 'var(--font-mono)', transition: 'opacity 0.15s' }}
      >
        {match.score}% match {open ? '▲' : '▼'}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '280px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-md)', zIndex: 50, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* Score bar */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-2)' }}>Overall match</span>
              <span style={{ fontSize: '11px', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{match.score}%</span>
            </div>
            <div style={{ height: '5px', borderRadius: '99px', background: 'var(--bg-sunken)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${match.score}%`, background: color, borderRadius: '99px', transition: 'width 0.4s ease' }} />
            </div>
          </div>

          {/* Covered */}
          {match.covered.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--status-offer)', marginBottom: '6px' }}>✓ Covered</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {match.covered.map(item => (
                  <span key={item} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', color: 'var(--status-offer)' }}>{item}</span>
                ))}
              </div>
            </div>
          )}

          {/* Partial */}
          {match.partial.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--status-awaiting)', marginBottom: '6px' }}>~ Partial</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {match.partial.map(item => (
                  <span key={item} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(234,88,12,0.08)', border: '1px solid rgba(234,88,12,0.2)', color: 'var(--status-awaiting)' }}>{item}</span>
                ))}
              </div>
            </div>
          )}

          {/* Missing */}
          {match.missing.length > 0 && (
            <div>
              <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--status-rejected)', marginBottom: '6px' }}>✗ Missing</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                {match.missing.map(item => (
                  <span key={item} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)', color: 'var(--status-rejected)' }}>{item}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function JobCard({ job, onSave, onGenerate, saved, match }: {
  job: Job
  onSave: (job: Job) => void
  onGenerate: (job: Job) => void
  saved: boolean
  match: MatchResult | null | 'loading'
}) {
  const [expanded, setExpanded] = useState(false)
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period)

  return (
    <Card style={{ padding: 0, overflow: 'hidden', transition: 'box-shadow 0.15s' }}>
      {/* Main row */}
      <div style={{ padding: '20px 24px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Logo */}
        <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
          {job.company_logo ? (
            <img src={job.company_logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          ) : (
            <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent)' }}>{job.company?.[0] ?? '?'}</span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '4px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px', letterSpacing: '-0.01em', marginBottom: '2px' }}>{job.title}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-2)', fontWeight: 500 }}>{job.company}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              {salary && (
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--status-offer)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{salary}</div>
              )}
              <MatchBadge match={match} />
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
            {job.location && (
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>
                📍 {job.location}
              </span>
            )}
            {job.is_remote && (
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: 'var(--status-offer)' }}>
                Remote
              </span>
            )}
            {job.employment_type && (
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--accent-bg)', border: '1px solid var(--accent-dim)', color: 'var(--accent)' }}>
                {EMPLOYMENT_TYPES.find(e => e.value === job.employment_type)?.label ?? job.employment_type}
              </span>
            )}
            {job.posted_at && (
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
                {formatPosted(job.posted_at)}
              </span>
            )}
            {job.publisher && (
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>
                via {job.publisher}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded description */}
      {expanded && (
        <div style={{ padding: '0 24px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          {job.highlights.Qualifications && job.highlights.Qualifications.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Qualifications</div>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {job.highlights.Qualifications.slice(0, 6).map((q, i) => (
                  <li key={i} style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>{q}</li>
                ))}
              </ul>
            </div>
          )}
          {job.highlights.Responsibilities && job.highlights.Responsibilities.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Responsibilities</div>
              <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {job.highlights.Responsibilities.slice(0, 6).map((r, i) => (
                  <li key={i} style={{ fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>{r}</li>
                ))}
              </ul>
            </div>
          )}
          {!job.highlights.Qualifications && !job.highlights.Responsibilities && job.description && (
            <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.8, maxHeight: '200px', overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
              {job.description.slice(0, 800)}{job.description.length > 800 ? '…' : ''}
            </div>
          )}
        </div>
      )}

      {/* Action bar */}
      <div style={{ padding: '12px 24px', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-sunken)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', fontFamily: 'var(--font-display)' }}
        >
          {expanded ? 'Show less ↑' : 'Show more ↓'}
        </button>
        <div style={{ flex: 1 }} />
        <Button variant="ghost" size="sm" onClick={() => onGenerate(job)}>
          ✦ Generate materials
        </Button>
        <Button
          variant={saved ? 'secondary' : 'primary'}
          size="sm"
          onClick={() => onSave(job)}
        >
          {saved ? '✓ Saved' : '+ Save job'}
        </Button>
        {job.apply_link && (
          <a href={job.apply_link} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm">Apply ↗</Button>
          </a>
        )}
      </div>
    </Card>
  )
}

export default function JobsPage() {
  const navigate = useNavigate()

  const [query, setQuery]           = useState('')
  const [location, setLocation]     = useState('')
  const [remote, setRemote]         = useState(false)
  const [empType, setEmpType]       = useState('')
  const [datePosted, setDatePosted] = useState('all')
  const [salaryMin, setSalaryMin]   = useState('')
  const [salaryMax, setSalaryMax]   = useState('')
  const [sortBy, setSortBy]         = useState('relevance')
  const [customTags, setCustomTags] = useState<string[]>([])
  const [tagInput, setTagInput]     = useState('')

  const [jobs, setJobs]           = useState<Job[]>([])
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)
  const [error, setError]         = useState('')
  const [savedIds, setSavedIds]   = useState<Set<string>>(new Set())
  const [matchScores, setMatchScores] = useState<Record<string, MatchResult | 'loading'>>({})

  const fetchMatch = useCallback(async (job: Job) => {
    if (!job.description) return
    const token = localStorage.getItem('sa_token')
    try {
      const res = await fetch('/api/profile/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ job_description: job.description }),
      })
      if (!res.ok) return
      const data = await res.json()
      setMatchScores(prev => ({ ...prev, [job.id]: data }))
    } catch {
      setMatchScores(prev => { const next = { ...prev }; delete next[job.id]; return next })
    }
  }, [])

  useEffect(() => {
    if (jobs.length === 0) return
    const initial: Record<string, 'loading'> = {}
    jobs.forEach(j => { if (j.description) initial[j.id] = 'loading' })
    setMatchScores(initial)
    jobs.forEach(job => fetchMatch(job))
  }, [jobs, fetchMatch])

  const search = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setSearched(true)
    setMatchScores({})

    const fullQuery = [query, ...customTags].join(' ')
    const params = new URLSearchParams({
      query:           fullQuery,
      location:        location,
      remote_only:     remote ? 'true' : 'false',
      employment_type: empType,
      date_posted:     datePosted,
      salary_min:      salaryMin,
      salary_max:      salaryMax,
      sort_by:         sortBy,
      num_pages:       '2',
    })

    try {
      const token = localStorage.getItem('sa_token')
      const res = await fetch(`/api/jobs/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setJobs(data.jobs || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [query, location, remote, empType, datePosted, salaryMin, salaryMax, sortBy, customTags])

  const handleSave = async (job: Job) => {
    const token = localStorage.getItem('sa_token')
    try {
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          company:      job.company,
          role:         job.title,
          job_link:     job.apply_link,
          status:       'applied',
          date_applied: new Date().toISOString().split('T')[0],
          notes:        `Found via Smart Apply Jobs\nLocation: ${job.location}\n${job.is_remote ? 'Remote' : ''}`,
        }),
      })
      setSavedIds(prev => new Set([...prev, job.id]))
    } catch (err) {
      console.error('Failed to save job', err)
    }
  }

  const handleGenerate = (job: Job) => {
    sessionStorage.setItem('sa_prefill_jd', job.description || '')
    sessionStorage.setItem('sa_prefill_company', job.company || '')
    sessionStorage.setItem('sa_prefill_role', job.title || '')
    navigate('/apply')
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !customTags.includes(t)) setCustomTags(prev => [...prev, t])
    setTagInput('')
  }

  const removeTag = (tag: string) => setCustomTags(prev => prev.filter(t => t !== tag))

  const activeSortOptions = datePosted !== 'all' ? SORT_OPTIONS.date
    : salaryMin || salaryMax ? SORT_OPTIONS.salary
    : SORT_OPTIONS.default

  return (
    <div style={PAGE}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.03em' }}>Find jobs</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>Search across LinkedIn, Indeed, Glassdoor, and ZipRecruiter.</p>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Job title, keywords, or company…"
          style={{ flex: 1, padding: '11px 16px', fontSize: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-display)', transition: 'border-color 0.15s' }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        <input
          value={location}
          onChange={e => setLocation(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Location (e.g. Los Angeles, CA)"
          style={{ width: '240px', padding: '11px 16px', fontSize: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-display)', transition: 'border-color 0.15s' }}
          onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
        <Button onClick={search} loading={loading} size="md" style={{ paddingLeft: '28px', paddingRight: '28px' }}>
          Search
        </Button>
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '16px', padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-sm)' }}>
        <button
          onClick={() => setRemote(r => !r)}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)', transition: 'all 0.15s', background: remote ? 'rgba(74,222,128,0.1)' : 'var(--bg-sunken)', color: remote ? 'var(--status-offer)' : 'var(--text-2)', border: `1px solid ${remote ? 'rgba(74,222,128,0.3)' : 'var(--border)'}` }}
        >
          <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${remote ? 'var(--status-offer)' : 'var(--text-3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {remote && <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--status-offer)' }} />}
          </div>
          Remote only
        </button>

        <select value={empType} onChange={e => setEmpType(e.target.value)} style={{ padding: '7px 12px', fontSize: '12px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-2)', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>

        <select value={datePosted} onChange={e => { setDatePosted(e.target.value); setSortBy('date_desc') }} style={{ padding: '7px 12px', fontSize: '12px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-2)', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
          {DATE_POSTED.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <input value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="Min $" style={{ width: '80px', padding: '7px 10px', fontSize: '12px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-2)', outline: 'none', fontFamily: 'var(--font-display)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>–</span>
          <input value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="Max $" style={{ width: '80px', padding: '7px 10px', fontSize: '12px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-2)', outline: 'none', fontFamily: 'var(--font-display)' }} />
        </div>

        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '7px 12px', fontSize: '12px', background: 'var(--bg-sunken)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-2)', outline: 'none', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, marginLeft: 'auto' }}>
          {activeSortOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Custom filter tags */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Filter tags:</span>
        {customTags.map(tag => (
          <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '20px', background: 'var(--accent-bg)', border: '1px solid var(--accent-dim)', fontSize: '12px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
            {tag}
            <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', fontSize: '14px', lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTag()}
            placeholder="Add keyword…"
            style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text)', outline: 'none', fontFamily: 'var(--font-display)', width: '130px' }}
          />
          <button onClick={addTag} style={{ padding: '4px 10px', fontSize: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '20px', color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'var(--font-display)' }}>+ Add</button>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px', gap: '16px', color: 'var(--text-3)' }}>
          <Spinner size={32} />
          <span style={{ fontSize: '14px' }}>Searching across job boards…</span>
        </div>
      ) : error ? (
        <div style={{ padding: '20px 24px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 'var(--radius)', fontSize: '14px', color: 'var(--status-rejected)' }}>
          {error}
        </div>
      ) : !searched ? (
        <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--text-3)' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>🔍</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>Search for your next role</div>
          <div style={{ fontSize: '13px' }}>Enter a job title or keyword above to get started.</div>
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 32px', color: 'var(--text-3)' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px', opacity: 0.4 }}>😕</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-2)', marginBottom: '8px' }}>No jobs found</div>
          <div style={{ fontSize: '13px' }}>Try different keywords or broaden your filters.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-3)', marginBottom: '4px' }}>
            {jobs.length} results found
          </div>
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onSave={handleSave}
              onGenerate={handleGenerate}
              saved={savedIds.has(job.id)}
              match={matchScores[job.id] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  )
}