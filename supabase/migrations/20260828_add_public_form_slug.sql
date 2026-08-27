-- Human-readable public paths such as /limited-3. The legacy ?respond=<id>
-- route remains valid, so existing shared links are never invalidated.
alter table public.form_public
  add column if not exists public_slug text;

alter table public.form_public
  drop constraint if exists form_public_public_slug_format;
alter table public.form_public
  add constraint form_public_public_slug_format
  check (
    public_slug is null
    or public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  );

create unique index if not exists form_public_public_slug_unique_idx
  on public.form_public (public_slug)
  where public_slug is not null;

comment on column public.form_public.public_slug is
  'Optional human-readable public path. Unique across active public forms; legacy UUID IDs remain supported.';
