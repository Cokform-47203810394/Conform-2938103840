-- Owner-only response notifications (2026-08-19)
-- Notification rows never contain decrypted answers, respondent identifiers, or
-- encryption keys. They only tell the form owner that an encrypted response arrived.

create table if not exists public.form_notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  form_id text not null references public.forms(id) on delete cascade,
  response_id text not null references public.responses(id) on delete cascade,
  kind text not null default 'response_received' check (kind in ('response_received')),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (owner_id, response_id, kind)
);

alter table public.form_notifications enable row level security;

drop policy if exists "form notification owner read" on public.form_notifications;
create policy "form notification owner read" on public.form_notifications
for select using (owner_id = auth.uid());

drop policy if exists "form notification owner update" on public.form_notifications;
create policy "form notification owner update" on public.form_notifications
for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "form notification owner delete" on public.form_notifications;
create policy "form notification owner delete" on public.form_notifications
for delete using (owner_id = auth.uid());

create index if not exists form_notifications_owner_created_idx
  on public.form_notifications (owner_id, read_at, created_at desc);
