-- Restores the column already expected by the public response submit client.
-- The opaque token is browser-local and is used only for optional one-response-per-browser enforcement.
alter table public.responses add column if not exists respondent_token text;

create unique index if not exists responses_one_per_respondent_idx
  on public.responses (form_id, respondent_token)
  where respondent_token is not null;
