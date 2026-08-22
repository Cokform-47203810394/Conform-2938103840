-- Recovery-first form deletion.
-- Moving a form to trash keeps its private row, encrypted responses, encrypted
-- version history, and audit trail intact. The public row is removed by the app
-- so respondents can no longer access the form. A later permanent-purge job may
-- remove rows older than the published retention period; until then restoration
-- is an owner-only metadata update with no ciphertext rewriting.

alter table public.forms
  add column if not exists deleted_at timestamptz;

create index if not exists forms_owner_deleted_updated_at_idx
  on public.forms (owner, deleted_at, updated_at desc);

comment on column public.forms.deleted_at is
  'Owner-initiated trash timestamp. Null means active; non-null keeps data recoverable before permanent purge.';
