-- Keep owner workspaces, notification lookups, participation history, and response
-- workflow queries predictable as Cokform grows. These indexes also cover the
-- foreign-key columns flagged by the Supabase performance advisor.

create index if not exists forms_owner_updated_at_idx
  on public.forms (owner, updated_at desc);

create index if not exists form_notifications_form_id_idx
  on public.form_notifications (form_id);

create index if not exists form_notifications_response_id_idx
  on public.form_notifications (response_id);

create index if not exists form_participations_form_id_idx
  on public.form_participations (form_id);

create index if not exists form_response_workflow_response_id_idx
  on public.form_response_workflow (response_id);
