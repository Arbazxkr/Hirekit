-- HireKit Database Schema (Supabase as database only, auth via Google Cloud Console)

-- Users (from Google login)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  google_id TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  skills TEXT[] DEFAULT '{}',
  experience TEXT DEFAULT '',
  education TEXT DEFAULT '',
  location TEXT DEFAULT '',
  target_role TEXT DEFAULT '',
  resume_text TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions (free / pro / premium)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due')),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily usage tracking
CREATE TABLE IF NOT EXISTS usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  chat_count INT DEFAULT 0,
  apply_count INT DEFAULT 0,
  resume_count INT DEFAULT 0,
  upload_count INT DEFAULT 0,
  UNIQUE(email, date)
);

-- Job applications tracker
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  company TEXT NOT NULL,
  job_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'interview', 'rejected', 'offer')),
  resume_used TEXT,
  notes TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat history
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  session_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resume history
CREATE TABLE IF NOT EXISTS resumes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  job_title TEXT NOT NULL,
  resume_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_subs_email ON subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_usage_email_date ON usage(email, date);
CREATE INDEX IF NOT EXISTS idx_apps_email ON applications(user_email);
CREATE INDEX IF NOT EXISTS idx_chat_email_session ON chat_history(user_email, session_id);
CREATE INDEX IF NOT EXISTS idx_resumes_email ON resumes(user_email);
