const BASE = '/api'

function getToken() {
  return localStorage.getItem('sa_token')
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(err.message || 'Request failed')
  }
  return res.json()
}

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: { id: number; email: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (email: string, password: string) =>
    request<{ token: string; user: { id: number; email: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
}

// ── Applications ──────────────────────────────────────────────
export interface Application {
  id: number
  company: string
  role: string
  job_link?: string
  status: 'applied' | 'awaiting' | 'interview' | 'rejected' | 'offer'
  date_applied: string
  notes?: string
}

export const applicationsApi = {
  list: () => request<Application[]>('/applications'),

  create: (data: Omit<Application, 'id'>) =>
    request<Application>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<Application>) =>
    request<Application>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`/applications/${id}`, { method: 'DELETE' }),
}

// ── Profile ───────────────────────────────────────────────────
export interface ProfileBasics {
  name: string
  headline: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  website: string
  summary: string
}

export interface ProfileEEO {
  gender: string
  pronouns: string
  ethnicity: string
  veteran_status: string
  disability_status: string
  citizenship: string
  requires_sponsorship: string
  work_authorization: string
}

export interface Profile {
  basics: ProfileBasics
  eeo: ProfileEEO
  projects: Array<{ name: string; description: string; tech: string[] }>
  experience: Array<{ company: string; role: string; start: string; end: string; bullets: string[] }>
  skills: string[]
  prewritten_answers: Record<string, string>
}

export const profileApi = {
  get: () => request<Profile>('/profile'),
  save: (data: Profile) =>
    request<Profile>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
}

// ── Generator ─────────────────────────────────────────────────
export const generatorApi = {
  coverLetter: (jobDescription: string, applicationId?: number) =>
    request<{ content: string }>('/generate/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ job_description: jobDescription, application_id: applicationId }),
    }),

  resume: (jobDescription: string, applicationId?: number) =>
    request<{ content: string }>('/generate/resume', {
      method: 'POST',
      body: JSON.stringify({ job_description: jobDescription, application_id: applicationId }),
    }),
}

// ── Email ─────────────────────────────────────────────────────
export const emailApi = {
  status: () => request<{ connected: boolean; email?: string }>('/email/status'),
  connect: () => request<{ auth_url: string }>('/email/connect'),
  sync: () => request<{ updated: number }>('/email/sync'),
  disconnect: () => request<void>('/email/disconnect'),
}