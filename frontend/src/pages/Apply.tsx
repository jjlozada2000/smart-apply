import { useState, useEffect } from 'react'
import { generatorApi } from '../services/api'
import { Button, Card, Textarea } from '../components/ui'

type Mode = 'cover-letter' | 'resume'

export default function ApplyPage() {
  const [mode, setMode] = useState<Mode>('cover-letter')
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [prefillCompany, setPrefillCompany] = useState('')

  // Read prefilled data from Jobs page
  useEffect(() => {
    const jd = sessionStorage.getItem('sa_prefill_jd')
    const company = sessionStorage.getItem('sa_prefill_company')
    const role = sessionStorage.getItem('sa_prefill_role')
    if (jd) {
      setJobDescription(jd)
      sessionStorage.removeItem('sa_prefill_jd')
    }
    if (company) {
      setPrefillCompany(`${company}${role ? ' — ' + role : ''}`)
      sessionStorage.removeItem('sa_prefill_company')
      sessionStorage.removeItem('sa_prefill_role')
    }
  }, [])

  const handleGenerate = async () => {
    if (!jobDescription.trim()) { setError('Paste a job description first.'); return }
    setError('')
    setResult('')
    setLoading(true)
    try {
      const fn = mode === 'cover-letter' ? generatorApi.coverLetter : generatorApi.resume
      const data = await fn(jobDescription)
      setResult(data.content)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: '48px 52px 64px', maxWidth: '1100px', width: '100%', margin: '0 auto' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.03em' }}>Generate application</h1>
        <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>Paste a job description and we'll tailor your materials.</p>
        {prefillCompany && (
          <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--accent-bg)', border: '1px solid var(--accent-dim)', borderRadius: '8px', fontSize: '13px', color: 'var(--accent)' }}>
            ✦ Pre-filled from: <strong>{prefillCompany}</strong>
          </div>
        )}
      </div>

      {/* Mode toggle */}
      <div style={{
        display: 'flex', gap: '4px',
        background: 'var(--bg-sunken)', padding: '4px',
        borderRadius: 'var(--radius-sm)', width: 'fit-content',
        marginBottom: '24px',
        border: '1px solid var(--border)',
      }}>
        {(['cover-letter', 'resume'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setResult('') }}
            style={{
              padding: '7px 20px',
              borderRadius: '6px',
              fontSize: '13px', fontWeight: 600,
              background: mode === m ? 'var(--bg-card)' : 'transparent',
              color: mode === m ? 'var(--text)' : 'var(--text-3)',
              border: mode === m ? '1px solid var(--border)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'var(--font-display)',
              boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
            }}
          >
            {m === 'cover-letter' ? 'Cover Letter' : 'Resume Bullets'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: '24px', alignItems: 'start' }}>
        {/* Input */}
        <Card>
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '16px' }}>Job description</h3>
          <Textarea
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting here…"
            style={{ minHeight: '280px', fontFamily: 'var(--font-mono)', fontSize: '12px' }}
          />
          {error && (
            <div style={{ marginTop: '12px', padding: '10px', background: '#fee', border: '1px solid #fcc', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--status-rejected)' }}>
              {error}
            </div>
          )}
          <Button
            onClick={handleGenerate}
            loading={loading}
            size="lg"
            style={{ marginTop: '16px', width: '100%' }}
          >
            {loading ? 'Generating…' : `Generate ${mode === 'cover-letter' ? 'cover letter' : 'resume bullets'}`}
          </Button>
        </Card>

        {/* Output */}
        {result && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700 }}>
                {mode === 'cover-letter' ? 'Cover letter' : 'Resume bullets'}
              </h3>
              <Button variant="secondary" size="sm" onClick={handleCopy}>
                {copied ? '✓ Copied' : 'Copy'}
              </Button>
            </div>
            <div style={{
              whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.8',
              color: 'var(--text-2)', fontFamily: mode === 'resume' ? 'var(--font-mono)' : 'var(--font-display)',
              maxHeight: '400px', overflowY: 'auto',
              padding: '4px',
            }}>
              {result}
            </div>
          </Card>
        )}
      </div>

      {/* Tip */}
      <div style={{
        marginTop: '32px', padding: '14px 18px',
        background: 'var(--accent-bg)', border: '1px solid var(--accent-dim)',
        borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--text-2)',
      }}>
        <strong style={{ color: 'var(--accent)' }}>Tip:</strong> Fill out your <a href="/profile" style={{ color: 'var(--accent)', fontWeight: 600 }}>profile</a> first so the generator can pull your real experiences and projects.
      </div>
    </div>
  )
}