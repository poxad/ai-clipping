create table if not exists public.job_clips (
    id uuid primary key default gen_random_uuid(),
    job_id text not null references public.jobs(job_id) on delete cascade,
    clip_name text not null,
    clip_index integer not null default 1,
    video_url text,
    raw_artifact_name text,
    words_artifact_name text,
    transcript text not null default '',
    subtitle_words jsonb not null default '[]'::jsonb,
    subtitle_style jsonb not null default '{}'::jsonb,
    source text,
    clip_start double precision,
    clip_end double precision,
    duration double precision,
    score double precision,
    score_summary text,
    caption text,
    clip_type text,
    score_metrics jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (job_id, clip_name)
);

create index if not exists job_clips_job_id_idx on public.job_clips(job_id);

create or replace function public.set_job_clips_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists trg_job_clips_updated_at on public.job_clips;

create trigger trg_job_clips_updated_at
before update on public.job_clips
for each row
execute function public.set_job_clips_updated_at();

alter table public.job_clips enable row level security;

drop policy if exists "Users can view their own job clips" on public.job_clips;
create policy "Users can view their own job clips"
on public.job_clips
for select
using (
    exists (
        select 1
        from public.jobs
        where jobs.job_id = job_clips.job_id
          and jobs.user_id = auth.uid()
    )
);

