import { useEffect, useRef, useState } from 'react'
import { profileApi, Profile, ProfileBasics, ProfileEEO } from '../services/api'
import { Button, Card, Input, Textarea, Spinner, ConfirmModal, PromptModal } from '../components/ui'

const PAGE: React.CSSProperties = {
  padding: '48px 52px 64px',
  maxWidth: '1100px',
  width: '100%',
  margin: '0 auto',
}

const EMPTY_BASICS: ProfileBasics = {
  name: '', headline: '', email: '', phone: '',
  location: '', linkedin: '', github: '', website: '', summary: '',
}

const EMPTY_EEO: ProfileEEO = {
  gender: '',
  pronouns: '',
  ethnicity: '',
  veteran_status: '',
  disability_status: '',
  citizenship: '',
  requires_sponsorship: '',
  work_authorization: '',
}

const EMPTY_PROFILE: Profile = {
  basics: EMPTY_BASICS,
  eeo: EMPTY_EEO,
  projects: [],
  experience: [],
  skills: [],
  prewritten_answers: {},
}

const TABS = [
  { key: 'basics',     label: 'General' },
  { key: 'experience', label: 'Experience' },
  { key: 'projects',   label: 'Projects' },
  { key: 'skills',     label: 'Skills' },
  { key: 'eeo',        label: 'EEO & Compliance' },
  { key: 'answers',    label: 'Answers' },
]

function EEOSelect({
  label, value, onChange, options, hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  hint?: string
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--bg-sunken)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)', padding: '9px 12px',
          fontSize: '14px', color: value ? 'var(--text)' : 'var(--text-3)',
          outline: 'none', width: '100%', cursor: 'pointer',
          fontFamily: 'var(--font-display)', transition: 'border-color 0.15s',
        }}
        onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
        onBlur={e => (e.target.style.borderColor = 'var(--border)')}
      >
        <option value="">Prefer not to say</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <p style={{ fontSize: '11px', color: 'var(--text-3)', lineHeight: 1.5 }}>{hint}</p>}
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile]   = useState<Profile>(EMPTY_PROFILE)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [tab, setTab]           = useState<'basics' | 'experience' | 'projects' | 'skills' | 'eeo' | 'answers'>('basics')

  // Resume import state
  const [importing, setImporting]           = useState(false)
  const [importError, setImportError]       = useState('')
  const [importDone, setImportDone]         = useState(false)
  const [hasResume, setHasResume]           = useState(false)
  const [resumeFilename, setResumeFilename] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Modal state
  const [showAddAnswer, setShowAddAnswer]         = useState(false)
  const [confirmRemoveAnswer, setConfirmRemoveAnswer] = useState<string | null>(null)

  useEffect(() => {
    profileApi.get()
      .then(data => setProfile({
        ...EMPTY_PROFILE, ...data,
        basics: { ...EMPTY_BASICS, ...(data.basics || {}) },
        eeo:    { ...EMPTY_EEO,    ...(data.eeo    || {}) },
      }))
      .catch(() => setProfile(EMPTY_PROFILE))
      .finally(() => setLoading(false))

    const token = localStorage.getItem('sa_token')
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        setHasResume(data.has_resume || false)
        setResumeFilename(data.resume_filename || 'resume.pdf')
      })
      .catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    try {
      await profileApi.save(profile)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally { setSaving(false) }
  }

  const setBasics = (field: keyof ProfileBasics, value: string) =>
    setProfile(p => ({ ...p, basics: { ...p.basics, [field]: value } }))

  const setEEO = (field: keyof ProfileEEO, value: string) =>
    setProfile(p => ({ ...p, eeo: { ...p.eeo, [field]: value } }))

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setImportError('')
    setImportDone(false)

    const formData = new FormData()
    formData.append('resume', file)

    try {
      const token = localStorage.getItem('sa_token')
      const res = await fetch('/api/profile/parse-resume', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Import failed')

      setProfile(p => ({
        ...p,
        basics:     { ...p.basics, ...(data.basics || {}) },
        experience: data.experience?.length ? data.experience : p.experience,
        projects:   data.projects?.length   ? data.projects   : p.projects,
        skills:     data.skills?.length     ? data.skills     : p.skills,
      }))

      setHasResume(true)
      setResumeFilename(file.name)
      setImportDone(true)
      setTimeout(() => setImportDone(false), 4000)
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDownload = () => {
    const token = localStorage.getItem('sa_token')
    fetch('/api/profile/resume', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        if (!res.ok) throw new Error('Download failed')
        return res.blob()
      })
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = resumeFilename
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => {})
  }

  return (
    <div style={PAGE}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '5px', letterSpacing: '-0.03em' }}>Your profile</h1>
          <p style={{ color: 'var(--text-3)', fontSize: '14px' }}>This data powers your generated applications.</p>
        </div>
        <Button onClick={save} loading={saving}>{saved ? '✓ Saved' : 'Save profile'}</Button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '28px', background: 'var(--bg-sunken)', padding: '4px', borderRadius: 'var(--radius-sm)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)} style={{
            padding: '7px 16px', fontSize: '13px', fontWeight: 600,
            background: tab === t.key ? 'var(--bg-card)' : 'transparent',
            color: tab === t.key ? 'var(--text)' : 'var(--text-3)',
            border: tab === t.key ? '1px solid var(--border)' : '1px solid transparent',
            borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: 'var(--font-display)', whiteSpace: 'nowrap',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Card><div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-3)' }}>Loading…</div></Card>
      ) : (
        <>
          {/* ── Basics ── */}
          {tab === 'basics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Card style={{ background: 'var(--bg-sunken)', border: '1px dashed var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '3px' }}>Resume</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                      {hasResume
                        ? <>On file: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>{resumeFilename}</span></>
                        : 'Upload a PDF to auto-fill your profile. PDF only, max 10MB.'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {importing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: 'var(--text-3)' }}>
                        <Spinner size={14} /> Parsing…
                      </div>
                    )}
                    {importDone && (
                      <div style={{ fontSize: '13px', color: 'var(--status-offer)', fontWeight: 600 }}>
                        ✓ Profile filled — review and save
                      </div>
                    )}
                    {importError && (
                      <div style={{ fontSize: '13px', color: 'var(--status-rejected)' }}>{importError}</div>
                    )}
                    {hasResume && (
                      <Button variant="ghost" size="sm" onClick={handleDownload}>↓ Download</Button>
                    )}
                    <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={handleResumeUpload} />
                    <Button variant="secondary" size="sm" loading={importing} onClick={() => fileInputRef.current?.click()}>
                      {hasResume ? '↑ Replace' : '↑ Upload PDF'}
                    </Button>
                  </div>
                </div>
              </Card>

              <Card>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '18px' }}>Identity</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <Input label="Full name" value={profile.basics.name} onChange={e => setBasics('name', e.target.value)} placeholder="Ian Lozada" />
                  <Input label="Headline" value={profile.basics.headline} onChange={e => setBasics('headline', e.target.value)} placeholder="Full-stack Engineer" />
                  <Input label="Email" type="email" value={profile.basics.email} onChange={e => setBasics('email', e.target.value)} placeholder="you@example.com" />
                  <Input label="Phone" value={profile.basics.phone} onChange={e => setBasics('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
                  <Input label="Location" value={profile.basics.location} onChange={e => setBasics('location', e.target.value)} placeholder="Los Angeles, CA" />
                </div>
              </Card>

              <Card>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '18px' }}>Links</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <Input label="LinkedIn" value={profile.basics.linkedin} onChange={e => setBasics('linkedin', e.target.value)} placeholder="linkedin.com/in/yourname" />
                  <Input label="GitHub" value={profile.basics.github} onChange={e => setBasics('github', e.target.value)} placeholder="github.com/yourname" />
                  <Input label="Website / Portfolio" value={profile.basics.website} onChange={e => setBasics('website', e.target.value)} placeholder="lozadajulian.com" style={{ gridColumn: '1 / -1' }} />
                </div>
              </Card>

              <Card>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '18px' }}>Professional summary</div>
                <Textarea value={profile.basics.summary} onChange={e => setBasics('summary', e.target.value)} placeholder="2-3 sentences describing who you are and what you bring." style={{ minHeight: '100px' }} />
                <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-3)' }}>Used as context when generating — won't be pasted verbatim.</p>
              </Card>

              {(profile.basics.name || profile.basics.headline) && (
                <Card style={{ background: 'var(--bg-sunken)', border: '1px dashed var(--border)' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '14px' }}>Preview</div>
                  <div style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em' }}>{profile.basics.name || '—'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-2)', marginBottom: '8px' }}>{profile.basics.headline}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    {profile.basics.email    && <span>{profile.basics.email}</span>}
                    {profile.basics.phone    && <span>{profile.basics.phone}</span>}
                    {profile.basics.location && <span>{profile.basics.location}</span>}
                    {profile.basics.linkedin && <span>{profile.basics.linkedin}</span>}
                    {profile.basics.github   && <span>{profile.basics.github}</span>}
                    {profile.basics.website  && <span>{profile.basics.website}</span>}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ── Experience ── */}
          {tab === 'experience' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {profile.experience.map((exp, i) => (
                <Card key={i}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <Input label="Company" value={exp.company} onChange={e => { const u = [...profile.experience]; u[i] = { ...exp, company: e.target.value }; setProfile(p => ({ ...p, experience: u })) }} />
                    <Input label="Role" value={exp.role} onChange={e => { const u = [...profile.experience]; u[i] = { ...exp, role: e.target.value }; setProfile(p => ({ ...p, experience: u })) }} />
                    <Input label="Start" value={exp.start} onChange={e => { const u = [...profile.experience]; u[i] = { ...exp, start: e.target.value }; setProfile(p => ({ ...p, experience: u })) }} placeholder="Jan 2023" />
                    <Input label="End" value={exp.end} onChange={e => { const u = [...profile.experience]; u[i] = { ...exp, end: e.target.value }; setProfile(p => ({ ...p, experience: u })) }} placeholder="Present" />
                  </div>
                  <Textarea label="Bullet points (one per line)" value={exp.bullets.join('\n')} onChange={e => { const u = [...profile.experience]; u[i] = { ...exp, bullets: e.target.value.split('\n') }; setProfile(p => ({ ...p, experience: u })) }} style={{ minHeight: '100px', fontFamily: 'var(--font-mono)', fontSize: '12px' }} />
                  <Button variant="danger" size="sm" style={{ marginTop: '12px' }} onClick={() => setProfile(p => ({ ...p, experience: p.experience.filter((_, j) => j !== i) }))}>Remove</Button>
                </Card>
              ))}
              <Button variant="secondary" onClick={() => setProfile(p => ({ ...p, experience: [...p.experience, { company: '', role: '', start: '', end: 'Present', bullets: [] }] }))}>+ Add experience</Button>
            </div>
          )}

          {/* ── Projects ── */}
          {tab === 'projects' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {profile.projects.map((proj, i) => (
                <Card key={i}>
                  <Input label="Project name" value={proj.name} onChange={e => { const u = [...profile.projects]; u[i] = { ...proj, name: e.target.value }; setProfile(p => ({ ...p, projects: u })) }} style={{ marginBottom: '12px' }} />
                  <Textarea label="Description" value={proj.description} onChange={e => { const u = [...profile.projects]; u[i] = { ...proj, description: e.target.value }; setProfile(p => ({ ...p, projects: u })) }} style={{ marginBottom: '12px', minHeight: '80px' }} />
                  <Input label="Tech (comma-separated)" value={proj.tech.join(', ')} onChange={e => { const u = [...profile.projects]; u[i] = { ...proj, tech: e.target.value.split(',').map(s => s.trim()) }; setProfile(p => ({ ...p, projects: u })) }} />
                  <Button variant="danger" size="sm" style={{ marginTop: '12px' }} onClick={() => setProfile(p => ({ ...p, projects: p.projects.filter((_, j) => j !== i) }))}>Remove</Button>
                </Card>
              ))}
              <Button variant="secondary" onClick={() => setProfile(p => ({ ...p, projects: [...p.projects, { name: '', description: '', tech: [] }] }))}>+ Add project</Button>
            </div>
          )}

          {/* ── Skills ── */}
          {tab === 'skills' && (
            <Card>
              <Textarea label="Skills (one per line, or comma-separated)" value={profile.skills.join('\n')} onChange={e => setProfile(p => ({ ...p, skills: e.target.value.split(/[\n,]/).map(s => s.trim()).filter(Boolean) }))} style={{ minHeight: '200px', fontFamily: 'var(--font-mono)', fontSize: '13px' }} />
              {profile.skills.length > 0 && (
                <div style={{ marginTop: '18px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {profile.skills.map(s => (
                    <span key={s} style={{ padding: '4px 12px', background: 'var(--accent-bg)', border: '1px solid var(--accent-dim)', borderRadius: '20px', fontSize: '12px', color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{s}</span>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* ── EEO & Compliance ── */}
          {tab === 'eeo' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ padding: '14px 18px', background: 'var(--accent-bg)', border: '1px solid var(--accent-dim)', borderRadius: 'var(--radius)', fontSize: '13px', color: 'var(--text-2)', lineHeight: 1.6 }}>
                <strong style={{ color: 'var(--accent)' }}>Heads up:</strong> These questions are optional and voluntary. Many employers are legally required to collect this data for compliance purposes — your answers don't affect hiring decisions. All fields default to "Prefer not to say."
              </div>
              <Card>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '18px' }}>Identity</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <EEOSelect label="Gender" value={profile.eeo.gender} onChange={v => setEEO('gender', v)} options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }, { value: 'nonbinary', label: 'Non-binary' }, { value: 'other', label: 'Other' }]} />
                  <EEOSelect label="Pronouns" value={profile.eeo.pronouns} onChange={v => setEEO('pronouns', v)} options={[{ value: 'he/him', label: 'He/Him' }, { value: 'she/her', label: 'She/Her' }, { value: 'they/them', label: 'They/Them' }, { value: 'he/they', label: 'He/They' }, { value: 'she/they', label: 'She/They' }, { value: 'other', label: 'Other' }]} />
                  <EEOSelect label="Ethnicity / Race" value={profile.eeo.ethnicity} onChange={v => setEEO('ethnicity', v)} options={[{ value: 'hispanic_latino', label: 'Hispanic or Latino' }, { value: 'white', label: 'White (Not Hispanic or Latino)' }, { value: 'black', label: 'Black or African American' }, { value: 'asian', label: 'Asian' }, { value: 'native_hawaiian', label: 'Native Hawaiian or Pacific Islander' }, { value: 'native_american', label: 'American Indian or Alaska Native' }, { value: 'two_or_more', label: 'Two or More Races' }, { value: 'other', label: 'Other' }]} />
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '18px' }}>Veteran & Disability</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <EEOSelect label="Veteran status" value={profile.eeo.veteran_status} onChange={v => setEEO('veteran_status', v)} options={[{ value: 'not_veteran', label: 'I am not a protected veteran' }, { value: 'active_duty', label: 'Active Duty Wartime or Campaign Badge Veteran' }, { value: 'armed_forces', label: 'Armed Forces Service Medal Veteran' }, { value: 'disabled_veteran', label: 'Disabled Veteran' }, { value: 'recently_separated', label: 'Recently Separated Veteran' }]} hint="U.S. employers with federal contracts are required to ask this." />
                  <EEOSelect label="Disability status" value={profile.eeo.disability_status} onChange={v => setEEO('disability_status', v)} options={[{ value: 'no', label: 'No, I do not have a disability' }, { value: 'yes', label: 'Yes, I have a disability (or have had one)' }]} hint="Required by Section 503 of the Rehabilitation Act for federal contractors." />
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '18px' }}>Work Authorization</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <EEOSelect label="Citizenship / Work status" value={profile.eeo.citizenship} onChange={v => setEEO('citizenship', v)} options={[{ value: 'us_citizen', label: 'U.S. Citizen' }, { value: 'permanent_resident', label: 'Permanent Resident (Green Card)' }, { value: 'work_visa', label: 'Work Visa (H-1B, O-1, etc.)' }, { value: 'student_visa', label: 'Student Visa (F-1/OPT/CPT)' }, { value: 'tn_visa', label: 'TN Visa (Canada/Mexico)' }, { value: 'other', label: 'Other' }]} />
                  <EEOSelect label="Authorized to work in the U.S.?" value={profile.eeo.work_authorization} onChange={v => setEEO('work_authorization', v)} options={[{ value: 'yes', label: 'Yes, I am authorized' }, { value: 'no', label: 'No, I am not authorized' }]} />
                  <EEOSelect label="Will you now or in the future require sponsorship?" value={profile.eeo.requires_sponsorship} onChange={v => setEEO('requires_sponsorship', v)} options={[{ value: 'no', label: 'No, I will not require sponsorship' }, { value: 'yes', label: 'Yes, I will require sponsorship' }]} hint="This refers to employer sponsorship for a work visa (e.g. H-1B)." />
                </div>
              </Card>
            </div>
          )}

          {/* ── Pre-written answers ── */}
          {tab === 'answers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-3)' }}>
                Store answers to common questions (e.g. "Why do you want to work here?"). These get injected into generated cover letters.
              </p>
              {Object.entries(profile.prewritten_answers).map(([key, val]) => (
                <Card key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' }}>{key}</span>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmRemoveAnswer(key)}>Remove</Button>
                  </div>
                  <Textarea
                    value={val}
                    onChange={e => setProfile(p => ({ ...p, prewritten_answers: { ...p.prewritten_answers, [key]: e.target.value } }))}
                    style={{ minHeight: '80px' }}
                  />
                </Card>
              ))}
              <Button variant="secondary" onClick={() => setShowAddAnswer(true)}>+ Add answer</Button>
            </div>
          )}
        </>
      )}

      {/* Add answer prompt modal */}
      {showAddAnswer && (
        <PromptModal
          title="Add a pre-written answer"
          message='Give this answer a short label, e.g. "why_this_company" or "strengths". You can fill in the answer text after.'
          placeholder="e.g. why_this_company"
          confirmLabel="Add"
          onConfirm={key => {
            if (!profile.prewritten_answers[key]) {
              setProfile(p => ({ ...p, prewritten_answers: { ...p.prewritten_answers, [key]: '' } }))
            }
            setShowAddAnswer(false)
          }}
          onCancel={() => setShowAddAnswer(false)}
        />
      )}

      {/* Remove answer confirm modal */}
      {confirmRemoveAnswer && (
        <ConfirmModal
          title="Remove answer"
          message={`Remove the answer for "${confirmRemoveAnswer}"? This cannot be undone.`}
          confirmLabel="Remove"
          variant="danger"
          onConfirm={() => {
            const u = { ...profile.prewritten_answers }
            delete u[confirmRemoveAnswer]
            setProfile(p => ({ ...p, prewritten_answers: u }))
            setConfirmRemoveAnswer(null)
          }}
          onCancel={() => setConfirmRemoveAnswer(null)}
        />
      )}
    </div>
  )
}