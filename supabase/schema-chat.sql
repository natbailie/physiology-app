-- Physiology Lab — the tutor's usage ledger. Depends on schema.sql.
-- Applied through the SQL Editor or the Supabase MCP connector, NOT `supabase db push` —
-- see the header of schema.sql for why that command does nothing here.
--
-- Design notes:
-- * One row per message sent, not a running total. The `chat` edge function counts rows since UTC
--   midnight to enforce the daily cap. An aggregate would be cheaper to read and impossible to
--   audit afterwards — the same reasoning as the question_attempts note in schema.sql.
-- * There is no content column, deliberately. A learner's questions to the tutor are not stored:
--   nothing here is worth the retention obligation, and the cap only needs to count.
-- * Idempotent throughout, like schema.sql, so a partially-applied run can be repaired by
--   running it again.

create table if not exists public.chat_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- The cap query is "this user, since midnight", so the index leads on user_id.
create index if not exists chat_usage_user_created_idx on public.chat_usage (user_id, created_at);

alter table public.chat_usage enable row level security;

drop policy if exists "read own chat usage" on public.chat_usage;
create policy "read own chat usage"
  on public.chat_usage for select
  using (auth.uid () = user_id);

drop policy if exists "insert own chat usage" on public.chat_usage;
create policy "insert own chat usage"
  on public.chat_usage for insert
  with check (auth.uid () = user_id);

-- No delete policy, and none is wanted: a learner who could delete their own usage rows could
-- reset the daily cap at will. Account deletion still clears them, via the cascade on user_id.
