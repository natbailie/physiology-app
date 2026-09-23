-- Physiology Lab — accounts and progress.
--
-- HOW THIS GETS APPLIED: paste it into the Supabase dashboard's SQL Editor, or hand it to the
-- Supabase MCP connector as a migration. NOT `supabase db push` — that pushes files from
-- `supabase/migrations/`, and this project has no such directory and no `config.toml`. The
-- command therefore succeeds silently having done nothing, which costs an afternoon to notice.
-- The applied migration history is in `supabase_migrations.schema_migrations`.
--
-- Design notes:
-- * Every attempt is one row. The app's current ModuleSummary aggregates (attempted, correct,
--   lastOutcome) are derived from these rows client-side, but the rows themselves are what the
--   teacher dashboard will aggregate over later — never store only aggregates.
-- * module_id / question_id mirror the app's camelCase ids verbatim; they are opaque strings here.
-- * The whole file is idempotent: every statement is `if not exists`, `or replace`, or guarded.
--   It claimed to be re-runnable before and was not — the first `create table` aborted the run,
--   which meant a partially-applied schema could never be repaired by running it again.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  -- Billing. Written only by the Stripe webhook (service role), never by the client — see the
  -- column grants at the bottom of this file.
  subscription_status text not null default 'free',
  stripe_customer_id text,
  current_period_end timestamptz,
  -- Who the learner is revising as. Both are self-declared, both nullable, and both are written
  -- by the client — hence the explicit column grant at the bottom of this file.
  target_exam text,
  training_level text
);

create table if not exists public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id text not null,
  question_id text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create index if not exists question_attempts_user_module_idx
  on public.question_attempts (user_id, module_id);

create index if not exists question_attempts_module_idx
  on public.question_attempts (module_id);

-- A profile row for every new auth user.
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

-- `create trigger ... if not exists` does not exist in Postgres, so drop first.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

-- This is a TRIGGER function, but PostgREST exposes every function in the `public` schema as
-- an RPC regardless — /rest/v1/rpc/handle_new_user — and this one is `security definer`. The
-- trigger fires as the table owner and does not consult these grants, so revoking them costs
-- nothing and closes a callable SECURITY DEFINER endpoint.
--
-- It has to be PUBLIC. Postgres grants EXECUTE to PUBLIC on every function it creates, and
-- `anon` / `authenticated` inherit it from there — so revoking from those two by name looks
-- right, changes the ACL not at all, and leaves the linter warning exactly where it was.
revoke execute on function public.handle_new_user () from public;

alter table public.profiles enable row level security;
alter table public.question_attempts enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile"
  on public.profiles for select
  using (auth.uid () = id);

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile"
  on public.profiles for update
  using (auth.uid () = id)
  with check (auth.uid () = id);

-- The policy above governs *which row* a user may update, not which columns. Without the grants
-- below, anyone holding the anon key could set their own subscription_status to 'active' and let
-- themselves into the paid catalogue. Revoke the table-wide grant and hand back only the columns
-- a learner legitimately owns: their display name, and what they say they are revising for.
--
-- This pair is load-bearing and easy to undo by accident: any later `grant update on
-- public.profiles` anywhere re-opens the hole for every column, including the billing ones.
revoke update on public.profiles from authenticated;
grant update (display_name, target_exam, training_level) on public.profiles to authenticated;

drop policy if exists "read own attempts" on public.question_attempts;
create policy "read own attempts"
  on public.question_attempts for select
  using (auth.uid () = user_id);

drop policy if exists "insert own attempts" on public.question_attempts;
create policy "insert own attempts"
  on public.question_attempts for insert
  with check (auth.uid () = user_id);

drop policy if exists "delete own attempts" on public.question_attempts;
create policy "delete own attempts"
  on public.question_attempts for delete
  using (auth.uid () = user_id);

-- Self-service deletion (UK GDPR): one rpc wipes the auth user; profiles, attempts and any
-- future cohort memberships follow via ON DELETE CASCADE.
create or replace function public.delete_own_account ()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid ();
$$;

revoke execute on function public.delete_own_account () from anon, public;
grant execute on function public.delete_own_account () to authenticated;

-- ---------------------------------------------------------------------------
-- Billing columns, for a project created before they existed. The `create table` above already
-- declares them; this only matters when upgrading in place.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists subscription_status text not null default 'free',
  add column if not exists stripe_customer_id text,
  add column if not exists current_period_end timestamptz;

-- ---------------------------------------------------------------------------
-- The learner's own answer to "what are you revising for?", which filters the catalogue and
-- segments the audience in RevenueCat. Unlike the billing columns above, these ARE the client's
-- to write, so they are named in the grant below.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists target_exam text,
  add column if not exists training_level text;

-- Re-assert the column grants after the ALTERs, in case either re-granted anything.
--
-- This is the line that makes the two columns above writable at all. `revoke update ... from
-- authenticated` is total, so a column missing from the `grant` cannot be written by a signed-in
-- learner and — because PostgREST reports that as a silent no-op on an otherwise successful
-- request — the failure looks exactly like a UI that forgot to save.
revoke update on public.profiles from authenticated;
grant update (display_name, target_exam, training_level) on public.profiles to authenticated;
