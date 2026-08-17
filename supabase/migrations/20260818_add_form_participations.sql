-- Participation history: stores only public form metadata, never encrypted answers.
create table if not exists public.form_participations (
  id uuid primary key default gen_random_uuid(),
  form_id text not null references public.forms(id) on delete cascade,
  participant_id uuid references auth.users(id) on delete cascade,
  form_title text not null default '제목 없는 설문지',
  question_count integer not null default 0 check (question_count >= 0),
  first_participated_at timestamptz not null default now(),
  last_participated_at timestamptz not null default now(),
  constraint form_participations_logged_in_identity check (participant_id is not null)
);

create unique index if not exists form_participations_user_form_idx
  on public.form_participations (participant_id, form_id);
create index if not exists form_participations_user_recent_idx
  on public.form_participations (participant_id, last_participated_at desc);

alter table public.form_participations enable row level security;

drop policy if exists "participations user select" on public.form_participations;
create policy "participations user select" on public.form_participations for select
  using (auth.uid() = participant_id);

drop policy if exists "participations user insert" on public.form_participations;
create policy "participations user insert" on public.form_participations for insert
  with check (
    auth.uid() = participant_id
    and exists (select 1 from public.form_public p where p.id = form_participations.form_id)
  );

drop policy if exists "participations user update" on public.form_participations;
create policy "participations user update" on public.form_participations for update
  using (auth.uid() = participant_id)
  with check (auth.uid() = participant_id);

drop policy if exists "participations user delete" on public.form_participations;
create policy "participations user delete" on public.form_participations for delete
  using (auth.uid() = participant_id);
