-- ============================================================
-- Jumo — Supabase setup SQL
-- Run this entire file in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── 1. Jobs table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id      TEXT NOT NULL UNIQUE,          -- matches the UUID from Railway
    user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status      TEXT NOT NULL DEFAULT 'pending',
    progress    INTEGER NOT NULL DEFAULT 0,
    message     TEXT NOT NULL DEFAULT '',
    clips       JSONB NOT NULL DEFAULT '[]',
    logs        JSONB NOT NULL DEFAULT '[]',
    filename    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS jobs_updated_at ON public.jobs;
CREATE TRIGGER jobs_updated_at
    BEFORE UPDATE ON public.jobs
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── 2. RLS policies ──────────────────────────────────────────
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Authenticated users can see their own jobs
CREATE POLICY "Users see own jobs"
    ON public.jobs FOR SELECT
    USING (user_id = auth.uid());

-- Authenticated users can insert their own jobs
CREATE POLICY "Users insert own jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Authenticated users can update their own jobs
CREATE POLICY "Users update own jobs"
    ON public.jobs FOR UPDATE
    USING (user_id = auth.uid());

-- Service role can do everything (used by Railway backend — bypasses RLS)
-- This is automatic for service_role key — no extra policy needed.

-- ── 3. User settings table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    subtitle_style  JSONB NOT NULL DEFAULT '{}'::jsonb,
    content_type    TEXT NOT NULL DEFAULT 'retail' CHECK (content_type IN ('retail', 'podcast')),
    whisper_vocab   TEXT NOT NULL DEFAULT '',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS user_settings_updated_at ON public.user_settings;
CREATE TRIGGER user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own settings" ON public.user_settings;
CREATE POLICY "Users see own settings"
    ON public.user_settings FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users insert own settings" ON public.user_settings;
CREATE POLICY "Users insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users update own settings" ON public.user_settings;
CREATE POLICY "Users update own settings"
    ON public.user_settings FOR UPDATE
    USING (user_id = auth.uid());

-- ── 4. Storage buckets ───────────────────────────────────────
-- Run these one at a time if the bucket already exists

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'clips',
    'clips',
    true,              -- public: clip URLs work without auth
    524288000,         -- 500 MB per file
    ARRAY['video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
    'uploads',
    'uploads',
    false,             -- private: raw uploads only accessible via service key
    2147483648         -- 2 GB per file
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: anyone can read from clips bucket (public bucket)
CREATE POLICY "Public clips readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'clips');

-- Only service role can insert/delete in clips (backend does this)
-- Service role bypasses RLS automatically.

-- ── 5. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS jobs_user_id_idx ON public.jobs (user_id);
CREATE INDEX IF NOT EXISTS jobs_job_id_idx  ON public.jobs (job_id);
CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON public.jobs (created_at DESC);
