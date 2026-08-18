-- Response workflow metadata (2026-08-19)
-- Keeps operational state separate from the E2EE answer envelope. Only the form
-- owner can read or change a response's status; plaintext answers are never
-- copied into this table.

create table if not exists public.form_response_workflow (
  form_id text not null references public.forms(id) on delete cascade,
  response_id text not null references public.responses(id) on delete cascade,
  status text not null default 'new' check (status in ('new', 'reviewing', 'in_progress', 'done', 'archived')),
  updated_at timestamptz not null default now(),
  primary key (form_id, response_id)
);

alter table public.form_response_workflow enable row level security;

drop policy if exists "response workflow owner read" on public.form_response_workflow;
create policy "response workflow owner read" on public.form_response_workflow
for select using (
  exists (select 1 from public.forms f where f.id = form_response_workflow.form_id and f.owner = auth.uid())
);

drop policy if exists "response workflow owner write" on public.form_response_workflow;
create policy "response workflow owner write" on public.form_response_workflow
for all using (
  exists (select 1 from public.forms f where f.id = form_response_workflow.form_id and f.owner = auth.uid())
) with check (
  exists (select 1 from public.forms f where f.id = form_response_workflow.form_id and f.owner = auth.uid())
);

create index if not exists form_response_workflow_form_status_idx
  on public.form_response_workflow (form_id, status, updated_at desc);
