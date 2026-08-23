-- Physiology Lab — accounts and progress.
-- Run in the Supabase dashboard (SQL Editor), or via `supabase db push` once the CLI is set up.
--
-- Design notes:
-- * Every attempt is one row. The app's current ModuleSummary aggregates (attempted, correct,
--   lastOutcome) are derived from these rows client-side, but the rows themselves are what the
--   teacher dashboard will aggregate over later — never store only aggregates.
-- * module_id / question_id mirror the app's camelCase ids verbatim; they are opaque strings here.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  -- Billing. Written only by the Stripe webhook (service role), never by the client — see the
  -- column grants at the bottom of this file.
  subscription_status text not null default 'free',
  stripe_customer_id text,
  current_period_end timestamptz
);

create table public.question_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  module_id text not null,
  question_id text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

create index question_attempts_user_module_idx
  on public.question_attempts (user_id, module_id);

create index question_attempts_module_idx
  on public.question_attempts (module_id);

-- A profile row for every new auth user.
create function public.handle_new_user ()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

alter table public.profiles enable row level security;
alter table public.question_attempts enable row level security;

create policy "read own profile"
  on public.profiles for select
  using (auth.uid () = id);

create policy "update own profile"
  on public.profiles for update
  using (auth.uid () = id);

-- The policy above governs *which row* a user may update, not which columns. Without the grants
-- below, anyone holding the anon key could set their own subscription_status to 'active' and let
-- themselves into the paid catalogue. Revoke the table-wide grant and hand back only the column
-- a learner legitimately owns.
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy "read own attempts"
  on public.question_attempts for select
  using (auth.uid () = user_id);

create policy "insert own attempts"
  on public.question_attempts for insert
  with check (auth.uid () = user_id);

create policy "delete own attempts"
  on public.question_attempts for delete
  using (auth.uid () = user_id);


-- ---------------------------------------------------------------------------
-- Migration for a project that already has these tables. Safe to re-run.
-- ---------------------------------------------------------------------------
-- alter table public.profiles
--   add column if not exists subscription_status text not null default 'free',
--   add column if not exists stripe_customer_id text,
--   add column if not exists current_period_end timestamptz;
--
-- revoke update on public.profiles from authenticated;
-- grant update (display_name) on public.profiles to authenticated;
