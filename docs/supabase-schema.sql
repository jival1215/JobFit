-- JobFIT Supabase schema
-- Run this in the Supabase SQL editor before pointing Railway at Supabase.
-- The backend uses the service-role key only on the server; do not expose it to the frontend.

create table if not exists public.jobfit_users (
  id bigserial primary key,
  email text not null unique,
  first_name text not null default '',
  last_name text not null default '',
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.jobfit_sessions (
  token text primary key,
  user_id bigint not null references public.jobfit_users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table if not exists public.jobfit_resumes (
  id bigserial primary key,
  user_id bigint not null references public.jobfit_users(id) on delete cascade,
  filename text not null,
  content_type text,
  file_size bigint not null default 0,
  sha256 text not null,
  file_blob text not null,
  extracted_text text not null,
  encrypted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.jobfit_match_runs (
  id bigserial primary key,
  user_id bigint not null references public.jobfit_users(id) on delete cascade,
  resume_id bigint references public.jobfit_resumes(id) on delete set null,
  source text not null,
  source_url text,
  fetched_at text,
  job_count integer not null default 0,
  new_count integer not null default 0,
  ai_enabled boolean not null default false,
  jobs_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.jobfit_saved_matches (
  id bigserial primary key,
  user_id bigint not null references public.jobfit_users(id) on delete cascade,
  job_id text not null,
  company text not null,
  title text not null,
  location text,
  apply_url text,
  source text,
  posted text,
  match_score double precision,
  status text not null check (status in ('Saved', 'Applied', 'Skipped')),
  notes text,
  job_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, job_id)
);


create table if not exists public.jobfit_job_cache (
  source_name text primary key,
  source_url text not null,
  fetched_at text not null,
  job_count integer not null default 0,
  jobs_json jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists jobfit_sessions_user_id_idx on public.jobfit_sessions(user_id);
create index if not exists jobfit_resumes_user_id_idx on public.jobfit_resumes(user_id);
create index if not exists jobfit_match_runs_user_id_idx on public.jobfit_match_runs(user_id);
create index if not exists jobfit_saved_matches_user_id_idx on public.jobfit_saved_matches(user_id);
