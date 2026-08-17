-- Server-side submission guard for Cokform response scheduling.
-- The client has matching UX checks, but this policy is authoritative for any
-- direct Data API request made with the public key.

drop policy if exists "responses public insert" on public.responses;
create policy "responses public insert" on public.responses for insert with check (
  exists (
    select 1
    from public.form_public p
    where p.id = responses.form_id
      and coalesce((p.data->'settings'->>'acceptingResponses')::boolean, true)
      and (
        p.data->'settings'->>'responseStartAt' is null
        or (p.data->'settings'->>'responseStartAt')::timestamptz <= now()
      )
      and (
        p.data->'settings'->>'responseEndAt' is null
        or (p.data->'settings'->>'responseEndAt')::timestamptz > now()
      )
  )
);
