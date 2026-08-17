-- Encrypted form version history. Snapshot payloads are encrypted in the browser
-- with the form public key before they reach this table.
create table if not exists public.form_versions (
  id uuid primary key default gen_random_uuid(),
  form_id text not null references public.forms(id) on delete cascade,
  created_at timestamptz not null default now(),
  snapshot jsonb not null,
  summary jsonb not null default '{}'::jsonb
);

alter table public.form_versions enable row level security;

drop policy if exists "form versions owner select" on public.form_versions;
create policy "form versions owner select" on public.form_versions for select using (
  exists (select 1 from public.forms f where f.id = form_versions.form_id and f.owner = auth.uid())
);

drop policy if exists "form versions owner insert" on public.form_versions;
create policy "form versions owner insert" on public.form_versions for insert with check (
  exists (select 1 from public.forms f where f.id = form_versions.form_id and f.owner = auth.uid())
);

drop policy if exists "form versions owner delete" on public.form_versions;
create policy "form versions owner delete" on public.form_versions for delete using (
  exists (select 1 from public.forms f where f.id = form_versions.form_id and f.owner = auth.uid())
);

create index if not exists form_versions_form_id_created_at_idx
  on public.form_versions (form_id, created_at desc);

-- Keep the newest 60 encrypted snapshots per form to keep pilot storage predictable.
create or replace function public.trim_cokform_form_versions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.form_versions
  where id in (
    select id
    from public.form_versions
    where form_id = new.form_id
    order by created_at desc, id desc
    offset 60
  );
  return new;
end;
$$;

drop trigger if exists form_versions_trim on public.form_versions;
create trigger form_versions_trim
after insert on public.form_versions
for each row execute function public.trim_cokform_form_versions();
