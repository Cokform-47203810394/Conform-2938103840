-- Atomic response-cap enforcement (2026-08-19)
-- The public Edge Function calls this function with the service role. The function
-- serializes submissions per form, re-checks the public response window, and
-- inserts the encrypted envelope only when the configured maximum is not reached.

create or replace function public.submit_cokform_encrypted_response(
  p_id text,
  p_form_id text,
  p_submitted_at timestamptz,
  p_answers jsonb,
  p_respondent_token text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_settings jsonb;
  v_limit_text text;
  v_limit integer;
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_form_id, 0));

  select data->'settings' into v_settings
  from public.form_public
  where id = p_form_id;

  if v_settings is null
    or coalesce((v_settings->>'acceptingResponses')::boolean, true) is false
    or (v_settings->>'responseStartAt' is not null and (v_settings->>'responseStartAt')::timestamptz > now())
    or (v_settings->>'responseEndAt' is not null and (v_settings->>'responseEndAt')::timestamptz <= now()) then
    return 'form_unavailable';
  end if;

  v_limit_text := nullif(v_settings->>'maxResponses', '');
  if v_limit_text ~ '^[1-9][0-9]{0,5}$' then
    v_limit := v_limit_text::integer;
    select count(*) into v_count from public.responses where form_id = p_form_id;
    if v_count >= v_limit then
      return 'response_limit_reached';
    end if;
  end if;

  begin
    insert into public.responses (id, form_id, submitted_at, answers, respondent_token)
    values (p_id, p_form_id, p_submitted_at, p_answers, p_respondent_token);
  exception when unique_violation then
    return 'duplicate';
  end;

  return 'ok';
end;
$$;

revoke all on function public.submit_cokform_encrypted_response(text, text, timestamptz, jsonb, text) from public, anon, authenticated;
grant execute on function public.submit_cokform_encrypted_response(text, text, timestamptz, jsonb, text) to service_role;
