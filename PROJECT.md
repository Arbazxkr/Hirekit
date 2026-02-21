# HireKit — What We've Built

## Overview

HireKit is an AI-powered SaaS that helps job seekers find jobs, build resumes,
and auto-apply — all through a ChatGPT-style chat interface.

We use Google Gemini as the AI brain. We don't build AI — we build the product around it.

---

## Architecture

```
┌─────────────────────────┐
│  FRONTEND (Next.js)     │
│  Hosted on: Vercel      │
│  Cost: FREE             │
│                         │
│  • Chat UI              │
│  • File upload (📎)     │
│  • Resume preview       │
│  • PDF/Image download   │
│  • Google login button  │
│  • Suggestion chips     │
└──────────┬──────────────┘
           │ REST API
           ▼
┌─────────────────────────┐
│  BACKEND (Express.js)   │
│  Hosted on: AWS EC2     │
│  Cost: ~$8/month        │
│                         │
│  • AI Chat (Gemini)     │
│  • File parsing         │
│  • Job search (Adzuna)  │
│  • Resume generator     │
│  • ATS scoring          │
│  • Auto-apply (Chrome)  │
│  • Auth (Google OAuth)  │
│  • Subscriptions        │
│  • Usage tracking       │
└──────────┬──────────────┘
           │ SQL
           ▼
┌─────────────────────────┐
│  DATABASE (Supabase)    │
│  Cost: FREE tier        │
│                         │
│  • users                │
│  • profiles             │
│  • subscriptions        │
│  • usage                │
│  • applications         │
│  • chat_history         │
└─────────────────────────┘
```

---

## Frontend — Built ✅

**Location:** `/src/`

| File | What It Does |
|------|-------------|
| `app/page.tsx` | ChatGPT-style chat interface with logo, avatars, suggestion chips, file upload button |
| `app/layout.tsx` | Root layout, Inter font, SEO meta tags |
| `app/globals.css` | Clean white UI styling |
| `components/ResumePreview.tsx` | Renders AI-generated resumes as formatted documents with PDF and Image download |

**Features in frontend:**
- ✅ Chat with AI (sends to backend)
- ✅ File upload — PDF, images, text files (📎 button)
- ✅ Resume preview with Download PDF + Download Image
- ✅ Suggestion chips on first message
- ✅ Logo in header + as AI avatar
- ✅ Loading animation
- ✅ Auto-scroll to latest message
- ✅ Connects to backend via `API_URL` env variable

---

## Backend — Built ✅

**Location:** `/server/src/`

### API Endpoints (12 total)

| Method | Endpoint | What It Does | Auth? |
|--------|----------|-------------|-------|
| `POST` | `/api/auth/google` | Google login → saves user to DB | Google token |
| `GET` | `/api/auth/me` | Get current logged-in user | Google token |
| `POST` | `/api/chat` | AI conversation (with daily usage limits) | Optional |
| `POST` | `/api/upload` | Upload PDF/image/text → extract content | No |
| `GET` | `/api/jobs?query=&location=` | Search real job listings (Adzuna API) | No |
| `POST` | `/api/resume` | Generate ATS-friendly resume | No |
| `POST` | `/api/resume/score` | Score resume against job description | No |
| `POST` | `/api/apply` | Auto-apply to job (Puppeteer/Chrome) | No |
| `GET` | `/api/apply/track?email=` | Get all tracked applications | No |
| `PATCH` | `/api/apply/:id` | Update application status | No |
| `GET/POST` | `/api/profile` | Get/update user profile | No |
| `GET` | `/api/subscription` | Get plan + daily usage stats | Google token |
| `POST` | `/api/subscription/upgrade` | Upgrade plan | Google token |
| `GET` | `/api/subscription/plans` | List available plans + prices | No |
| `GET` | `/api/health` | Server status check | No |

### Services (5 total)

| File | What It Does |
|------|-------------|
| `services/gemini.ts` | Calls Gemini API — chat + image vision (OCR) |
| `services/database.ts` | Supabase CRUD — profiles, applications, chat history |
| `services/auth.ts` | Verifies Google token on every request (no JWT) |
| `services/autoapply.ts` | Puppeteer — opens job page, finds Apply button, fills form |
| `services/subscription.ts` | Plan limits, daily usage counters, quota checking |

### Authentication

- Google OAuth via Google Cloud Console
- No passwords, no JWT, no bcrypt
- Frontend sends Google ID token → backend verifies with Google
- Every request verified, no sessions stored

### Subscription Plans

| Plan | Price | Chats/day | Resumes/day | Uploads/day | Auto-applies/day |
|------|-------|-----------|-------------|-------------|------------------|
| Free | $0 | 5 | 1 | 2 | 0 |
| Pro | $9/mo | 100 | 20 | 50 | 10 |
| Premium | $19/mo | Unlimited | Unlimited | Unlimited | Unlimited |

---

## Database Schema — Built ✅

**File:** `/server/supabase-schema.sql`

| Table | Columns | Purpose |
|-------|---------|---------|
| `users` | email, name, google_id, avatar_url | User accounts |
| `profiles` | skills, experience, education, location, target_role, resume_text | Job seeker profile |
| `subscriptions` | plan, stripe_customer_id, status, period_end | Billing |
| `usage` | date, chat_count, apply_count, resume_count, upload_count | Daily limits |
| `applications` | job_title, company, job_url, status, notes | Application tracker |
| `chat_history` | session_id, role, content | Conversation memory |

---

## Deployment — Ready ✅

| Component | Where | How |
|-----------|-------|-----|
| Frontend | Vercel | `git push` → auto-deploys |
| Backend | AWS EC2 | `npm install && npm run build && node dist/index.js` |
| Database | Supabase | Run `supabase-schema.sql` in SQL Editor |
| Dockerfile | Included | `docker build -t hirekit . && docker run -p 4000:4000 hirekit` |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js (React) | Fast, SEO, Vercel hosting |
| Backend | Express.js + TypeScript | Simple, fast, Node.js ecosystem |
| AI | Google Gemini API | Free tier, vision capable, fast |
| Database | Supabase (PostgreSQL) | Free, managed, real-time |
| Auth | Google Cloud Console OAuth | No passwords, trusted |
| Job Data | Adzuna API | Free, real listings |
| Auto-Apply | Puppeteer + Chromium | Browser automation |
| Payments | Stripe (TODO) | Industry standard |

---

## What's NOT Built Yet

| Feature | Status |
|---------|--------|
| Stripe payment integration | TODO — plan upgrade works but no real payment |
| Frontend login page | TODO — Google login button not on frontend yet |
| Frontend dashboard | TODO — plan/usage display not on frontend yet |
| Frontend application tracker UI | TODO — API built, no UI |
| Frontend job search UI | TODO — API built, no UI |

---

## File Tree

```
Hirekit/
├── src/                          ← FRONTEND
│   ├── app/
│   │   ├── page.tsx              ← Chat UI
│   │   ├── layout.tsx            ← Layout + SEO
│   │   └── globals.css           ← Styling
│   └── components/
│       └── ResumePreview.tsx     ← Resume preview + download
│
├── server/                       ← BACKEND
│   ├── src/
│   │   ├── index.ts              ← Express server (port 4000)
│   │   ├── routes/
│   │   │   ├── auth.ts           ← Google login
│   │   │   ├── chat.ts           ← AI chat + usage limits
│   │   │   ├── upload.ts         ← File upload + parsing
│   │   │   ├── jobs.ts           ← Job search
│   │   │   ├── resume.ts         ← Resume builder + ATS score
│   │   │   ├── apply.ts          ← Auto-apply + tracker
│   │   │   ├── profile.ts        ← User profiles
│   │   │   └── subscription.ts   ← Plans + usage
│   │   └── services/
│   │       ├── gemini.ts         ← AI (chat + vision)
│   │       ├── database.ts       ← Supabase
│   │       ├── auth.ts           ← Google OAuth verification
│   │       ├── autoapply.ts      ← Puppeteer automation
│   │       └── subscription.ts   ← Plan limits + counters
│   ├── supabase-schema.sql       ← Database tables
│   ├── Dockerfile                ← EC2 deployment
│   ├── .env                      ← API keys
│   └── package.json
│
├── PROJECT.md                    ← This file
└── public/
    └── logo.png                  ← HireKit logo
```
