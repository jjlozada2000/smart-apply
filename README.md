# Smart Apply

A full-stack job application platform. Generate tailored resumes and cover letters, track every application, and connect Gmail to auto-detect recruiter responses.

**Stack:** React + TypeScript + Vite · Flask + SQLAlchemy · PostgreSQL · Anthropic API · Gmail OAuth

---

## Quick start (local, no Docker)

### 1. Prerequisites

- Node 20+
- Python 3.12+
- PostgreSQL 15+ running locally

### 2. Database

```bash
psql -U postgres -c "CREATE DATABASE smart_apply;"
psql -U postgres -d smart_apply -f init.sql
```

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY and DATABASE_URL at minimum

python run.py
# → Running on http://localhost:5000
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
# → Running on http://localhost:5173
```

---

## Quick start (Docker)

```bash
cp backend/.env.example .env
# Fill in ANTHROPIC_API_KEY, GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET

docker-compose up --build
```

Frontend → http://localhost:5173  
Backend  → http://localhost:5000

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | ✅ | Flask secret key for JWT signing |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | ✅ | Your Anthropic API key (for generation) |
| `GMAIL_CLIENT_ID` | Phase 3 | Google OAuth client ID |
| `GMAIL_CLIENT_SECRET` | Phase 3 | Google OAuth client secret |
| `GMAIL_REDIRECT_URI` | Phase 3 | Must match Google Console setting |
| `FRONTEND_URL` | Phase 3 | Used for OAuth post-redirect |

---

## Project structure

```
smart-apply/
├── frontend/
│   └── src/
│       ├── pages/          # Dashboard, Applications, Apply, Profile, Settings
│       ├── components/     # Sidebar, ui/ (Button, Card, Modal, etc.)
│       ├── services/       # api.ts — typed fetch wrappers
│       ├── hooks/          # useAuth.tsx — JWT auth context
│       └── styles/         # globals.css — warm palette, Syne + DM Mono
│
├── backend/
│   └── app/
│       ├── routes/         # auth, applications, generator, profile, email
│       ├── models/         # User, Application, GeneratedContent, Profile
│       └── services/       # auth_service, job_parser, matcher, generator_service, email_service
│
├── init.sql                # DB schema (run once)
├── docker-compose.yml
└── README.md
```

---

## API reference

### Auth
| Method | Endpoint | Body |
|---|---|---|
| POST | `/auth/register` | `{ email, password }` |
| POST | `/auth/login` | `{ email, password }` |

All other endpoints require `Authorization: Bearer <token>`.

### Applications
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/applications` | List all for current user |
| POST | `/applications` | Create new |
| PATCH | `/applications/:id` | Update fields or status |
| DELETE | `/applications/:id` | Delete |

### Generator
| Method | Endpoint | Body |
|---|---|---|
| POST | `/generate/cover-letter` | `{ job_description, application_id? }` |
| POST | `/generate/resume` | `{ job_description, application_id? }` |

### Profile
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/profile` | Get current user's profile |
| PUT | `/profile` | Save/replace profile JSON |

### Email (Gmail)
| Method | Endpoint | Notes |
|---|---|---|
| GET | `/email/status` | Returns `{ connected, email? }` |
| POST | `/email/connect` | Returns Google OAuth URL |
| GET | `/email/callback` | OAuth redirect handler |
| POST | `/email/sync` | Scan inbox, update statuses |
| POST | `/email/disconnect` | Remove stored credentials |

---

## Gmail setup (Phase 3)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project → Enable **Gmail API**
3. OAuth consent screen → add your email as test user
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:5000/email/callback`
6. Copy client ID + secret into `.env`

---

## How generation works

Smart Apply does **not** freeform AI-write everything. Instead:

1. **Job parser** extracts keywords and requirements from the JD
2. **Matcher** scores and ranks your profile data by relevance
3. **Generator** fills a structured template with your actual experience

This keeps the output human-sounding and grounded in your real data.

---

## Build phases

| Phase | Status | Features |
|---|---|---|
| 1 | ✅ | Auth, application tracker, profile, basic generator |
| 2 | ✅ | Dashboard analytics, response rate, improved matching |
| 3 | ✅ stub | Gmail OAuth + inbox scan + auto-status updates |

---

## Future ideas

- Resume A/B testing (track which version gets responses)
- Follow-up reminder scheduler
- Chrome extension for one-click apply
- Export applications to CSV
- Application performance analytics over time
