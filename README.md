# <img src="public/favicon.png" width="32" height="32" alt="HireKit" /> HireKit — AI Job Assistant

> Your AI-powered career companion. Chat in Hindi, get results in English. Build ATS resumes, search jobs, auto-apply — all from a single chat interface.

[![Live Demo](https://img.shields.io/badge/Live-megusta.world-111?style=for-the-badge&logo=vercel&logoColor=white)](https://www.megusta.world)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](/)
[![Next.js](https://img.shields.io/badge/Next.js_16-000?style=for-the-badge&logo=next.js&logoColor=white)](/)
[![Gemini](https://img.shields.io/badge/Gemini_2.5-4285F4?style=for-the-badge&logo=google&logoColor=white)](/)

---

## ✨ What It Does

| Feature | Description |
|---------|-------------|
| 🤖 **AI Chat** | ChatGPT-style interface powered by Gemini 2.5 Flash with multi-provider fallback |
| 🎙️ **Hindi Voice Input** | Speak in Hindi → transcribed to English characters (Hinglish) via Web Speech API |
| 📄 **ATS Resume Builder** | Generates profession-specific, ATS-optimized resumes with PDF & image download |
| 📊 **Resume Scoring** | Scores your resume against any job description with actionable feedback |
| 🔍 **Job Search** | Real-time job listings from Adzuna API for India & Gulf markets |
| 🚀 **Auto-Apply** | Browser automation (Puppeteer) to auto-fill and submit job applications |
| 📎 **Document Upload** | Upload PDFs, images, certificates — AI extracts and builds your profile |
| 💳 **Razorpay Payments** | Subscription plans with INR pricing via Razorpay payment links |
| 🔐 **Google OAuth** | Passwordless login via Google Cloud Console |

---

## 🏗️ Architecture

```
┌──────────────────────────────┐
│  Frontend (Next.js 16)       │
│  Vercel · megusta.world      │
│                              │
│  • Chat UI with streaming    │
│  • Voice input (Hindi→EN)    │
│  • Resume preview + PDF/IMG  │
│  • Google OAuth login        │
│  • Dynamic suggestion chips  │
└──────────┬───────────────────┘
           │ REST API
           ▼
┌──────────────────────────────┐
│  Backend (Express + TS)      │
│  Render                      │
│                              │
│  • Gemini 2.5 Flash AI       │
│  • Multi-LLM fallback       │
│  • Job search (Adzuna)       │
│  • Auto-apply (Puppeteer)    │
│  • Razorpay subscriptions    │
│  • Usage tracking & limits   │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│  Database (Supabase)         │
│  PostgreSQL                  │
│                              │
│  users · profiles · usage    │
│  subscriptions · chat_history│
│  applications · resumes      │
└──────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript, Lucide Icons |
| **Backend** | Express.js, TypeScript, Node.js |
| **AI** | Google Gemini 2.5 Flash (+ Anthropic/OpenAI fallback ready) |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Google OAuth 2.0 (Cloud Console) |
| **Payments** | Razorpay Payment Links + Webhooks |
| **Jobs API** | Adzuna (India, UK, Gulf) |
| **Auto-Apply** | Puppeteer + Chromium |
| **Voice** | Web Speech API (en-IN) |
| **Hosting** | Vercel (frontend) + Render (backend) |

---

## 📸 Features

### 💬 AI Chat Interface
- ChatGPT-style conversation UI
- Profession-aware AI — adapts for tech, hospitality, healthcare, blue-collar, Gulf jobs
- Context-aware suggestion chips based on past conversations
- Witty, personality-driven welcome messages

### 🎙️ Hindi Voice Input
- Continuous real-time transcription using Web Speech API
- Speak in Hindi → written in English characters (Hinglish)
- Live interim results as you speak
- Designed for users who aren't fluent in English

### 📄 Resume Builder
- ATS-optimized, profession-specific templates
- SVG badge icons for contact section
- No placeholder text — only includes info the user provides
- Download as **PDF** or **Image** (html2canvas + jsPDF)
- Saved to profile for future access

### 📊 ATS Resume Scoring
- Score 0-100 against any job description
- Actionable feedback and missing keyword detection
- Accepts job title if user doesn't have a full JD

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Google Cloud Console](https://console.cloud.google.com) project with OAuth 2.0 credentials
- A [Supabase](https://supabase.com) project
- A [Gemini API key](https://aistudio.google.com/app/apikey)

### 1. Clone & Install

```bash
git clone https://github.com/Arbazxkr/Hirekit.git
cd Hirekit

# Frontend
npm install

# Backend
cd server
npm install
```

### 2. Environment Variables

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

**Backend** (`server/.env`):
```env
GEMINI_API_KEY=your_gemini_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
GOOGLE_CLIENT_ID=your_google_client_id
ADZUNA_APP_ID=your_adzuna_id
ADZUNA_APP_KEY=your_adzuna_key
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

### 3. Database Setup

Run `server/supabase-schema.sql` in your Supabase SQL Editor.

### 4. Run Locally

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
Hirekit/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Chat interface
│   │   ├── login/page.tsx        # Google OAuth login
│   │   ├── profile/page.tsx      # User profile + resumes + applications
│   │   ├── layout.tsx            # Root layout + SEO
│   │   └── globals.css           # Global styles
│   └── components/
│       └── ResumePreview.tsx     # Resume renderer + PDF/Image download
│
├── server/
│   ├── src/
│   │   ├── index.ts              # Express server (port 4000)
│   │   ├── routes/               # API routes (auth, chat, jobs, resume, apply, profile, subscription)
│   │   └── services/             # Business logic (gemini, database, auth, autoapply, subscription)
│   ├── supabase-schema.sql       # Database schema
│   └── Dockerfile                # Container deployment
│
└── public/                       # Static assets
```

---

## 🌍 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/google` | Google OAuth login |
| `POST` | `/api/chat` | AI conversation |
| `POST` | `/api/upload` | Document upload + AI extraction |
| `GET` | `/api/jobs` | Job search |
| `POST` | `/api/resume` | Generate resume |
| `POST` | `/api/resume/score` | ATS scoring |
| `POST` | `/api/apply` | Auto-apply to job |
| `GET/POST` | `/api/profile` | User profile CRUD |
| `GET` | `/api/subscription` | Plan + usage stats |
| `POST` | `/api/subscription/checkout` | Razorpay payment link |

---

## 📄 License

MIT

---

**Built by [@Arbazxkr](https://github.com/Arbazxkr)** · [Live Demo →](https://www.megusta.world)
