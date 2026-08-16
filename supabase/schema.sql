-- Cokform production-oriented schema.
-- Run in Supabase SQL Editor, then test with an owner session and an anonymous session.

create extension if not exists pgcrypto;

create table if not exists public.forms (
  id text primary key,
  title text not null default '제목 없는 설문지',
  data jsonb not null default '{}'::jsonb,
  owner uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.form_public (
  id text primary key references public.forms(id) on delete cascade,
  title text not null default '제목 없는 설문지',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.responses (
  id text primary key,
  form_id text not null references public.forms(id) on delete cascade,
  submitted_at timestamptz not null default now(),
  answers jsonb not null default '{}'::jsonb
);

alter table public.forms enable row level security;
alter table public.form_public enable row level security;
alter table public.responses enable row level security;

-- Owner-only editor access.
drop policy if exists "forms owner select" on public.forms;
create policy "forms owner select" on public.forms for select using (auth.uid() = owner);
drop policy if exists "forms owner insert" on public.forms;
create policy "forms owner insert" on public.forms for insert with check (auth.uid() = owner);
drop policy if exists "forms owner update" on public.forms;
create policy "forms owner update" on public.forms for update using (auth.uid() = owner) with check (auth.uid() = owner);
drop policy if exists "forms owner delete" on public.forms;
create policy "forms owner delete" on public.forms for delete using (auth.uid() = owner);

-- Public respondents can read only sanitized form data.
drop policy if exists "form public read" on public.form_public;
create policy "form public read" on public.form_public for select using (true);
drop policy if exists "form public owner write" on public.form_public;
create policy "form public owner write" on public.form_public for all using (
  exists (select 1 from public.forms f where f.id = form_public.id and f.owner = auth.uid())
) with check (
  exists (select 1 from public.forms f where f.id = form_public.id and f.owner = auth.uid())
);

-- Public respondents may insert answers, but cannot read, update, or delete them.
drop policy if exists "responses public insert" on public.responses;
create policy "responses public insert" on public.responses for insert with check (
  exists (select 1 from public.form_public p where p.id = responses.form_id)
);
drop policy if exists "responses owner read" on public.responses;
create policy "responses owner read" on public.responses for select using (
  exists (select 1 from public.forms f where f.id = responses.form_id and f.owner = auth.uid())
);
drop policy if exists "responses owner delete" on public.responses;
create policy "responses owner delete" on public.responses for delete using (
  exists (select 1 from public.forms f where f.id = responses.form_id and f.owner = auth.uid())
);

create index if not exists responses_form_id_submitted_at_idx
  on public.responses (form_id, submitted_at desc);
