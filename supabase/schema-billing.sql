-- Physiology Lab — entitlement. Run AFTER supabase/schema.sql and supabase/schema-teachers.sql
-- (a licence may name a cohort, so `cohorts` and `cohort_members` must already exist).
--
-- Two revenue streams, resolved into one answer:
--
--   * Individuals subscribe through RevenueCat. The webhook writes profiles.subscription_status
--     with the service role; the client has never been able to write that column and still cannot.
--   * Institutions buy seats offline — UK medical schools pay by purchase order, not by card — and
--     receive a licence code their students redeem. Nothing in this path touches RevenueCat.
--
-- `v_entitlement` is where the two meet, so the precedence rule lives in one place that a client
-- cannot route around. Everything reading entitlement reads that view.
--
-- Design notes:
-- * Licences are minted with the service role only. There is no insert policy and the grant is
--   revoked, exactly as public.cohorts restricts creation to its rpc.
-- * Seats are counted, never stored as a running total. A `seats_used` column drifts the first
--   time a row is deleted by hand; count(*) cannot.
-- * redeem_licence takes a row lock before counting, so two students redeeming the last seat at
--   the same moment cannot both get it.
-- * The whole file is idempotent, like the others.
--
-- Selling a licence, once the invoice is paid. Run in the SQL Editor, which runs as the service
-- role — `authenticated` cannot call mint_licence at all:
--
--   select code, seats, expires_at from public.mint_licence(
--     'Barts and The London', 350, '2027-07-31'::timestamptz, null, 'PO 44821'
--   );
--
-- Give that code to the school. To tie it to a teacher's cohort, pass the cohort id as the fourth
-- argument and every student who redeems it lands in that cohort too.
--
-- How many seats are gone:
--
--   select l.institution_name, l.seats, count(s.user_id) as claimed, l.expires_at
--   from public.licences l
--   left join public.licence_seats s on s.licence_id = l.id
--   group by l.id order by l.created_at desc;

-- ---------------------------------------------------------------------------
-- Licences and seats
-- ---------------------------------------------------------------------------

create table if not exists public.licences (
  id uuid primary key default gen_random_uuid (),
  institution_name text not null,
  seats int not null check (seats > 0),
  -- Null means perpetual. Most licences are an academic year and will carry a date.
  expires_at timestamptz,
  code text not null unique,
  -- When set, redeeming also enrols the student in this cohort: one code both pays for them and
  -- puts them in their teacher's dashboard.
  cohort_id uuid references public.cohorts (id) on delete set null,
  notes text,
  created_at timestamptz not null default now ()
);

create table if not exists public.licence_seats (
  licence_id uuid not null references public.licences (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  claimed_at timestamptz not null default now (),
  primary key (licence_id, user_id)
);

create index if not exists licence_seats_user_idx
  on public.licence_seats (user_id);

alter table public.licences enable row level security;
alter table public.licence_seats enable row level security;

-- A seat holder may see the licence they are on — the view below joins to it for the expiry date,
-- and the account page names the institution.
drop policy if exists "seat holders read their licence" on public.licences;
create policy "seat holders read their licence"
  on public.licences for select
  using (
    exists (
      select 1 from public.licence_seats s
      where s.licence_id = id and s.user_id = auth.uid ()
    )
  );

-- The policy above governs which ROW, not which COLUMN, and one of these columns is the join code.
-- Without the grants below any student on a licence could read their school's code straight out of
-- PostgREST and hand it to a friend at another university. Same construction, and same hazard, as
-- the billing columns on profiles: a later `grant select on public.licences` re-opens it.
revoke select on public.licences from authenticated;
grant select (id, institution_name, seats, expires_at, cohort_id, created_at)
  on public.licences to authenticated;

-- No insert/update/delete policy anywhere: licences are minted by mint_licence with the service
-- role after an invoice has been raised. The revoke is belt and braces.
revoke insert, update, delete on public.licences from authenticated;

drop policy if exists "read own seat" on public.licence_seats;
create policy "read own seat"
  on public.licence_seats for select
  using (user_id = auth.uid ());

-- Seats are claimed through redeem_licence, which does the expiry and capacity checks. A direct
-- insert would walk past both.
revoke insert, update, delete on public.licence_seats from authenticated;

-- ---------------------------------------------------------------------------
-- rpc: you mint a licence (service role only)
-- ---------------------------------------------------------------------------
create or replace function public.mint_licence (
  p_institution_name text,
  p_seats int,
  p_expires_at timestamptz default null,
  p_cohort_id uuid default null,
  p_notes text default null
)
returns public.licences
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text;
  created public.licences;
begin
  loop
    -- The alphabet join_cohort uses: no 0/O/1/I/L, because this code gets read off a slide,
    -- written on a handout and typed back in by four hundred people.
    select string_agg (character, '')
    into new_code
    from (
      select substr ('ABCDEFGHJKMNPQRSTUVWXYZ23456789', floor (random () * 31 + 1)::int, 1) as character
      from generate_series (1, 10)
    ) letters;

    exit when not exists (select 1 from public.licences where code = new_code);
  end loop;

  insert into public.licences (institution_name, seats, expires_at, code, cohort_id, notes)
  values (p_institution_name, p_seats, p_expires_at, new_code, p_cohort_id, p_notes)
  returning * into created;

  return created;
end;
$$;

-- Not for learners, not for teachers, not for anon. This one is yours.
revoke execute on function public.mint_licence (text, int, timestamptz, uuid, text)
  from anon, authenticated, public;
grant execute on function public.mint_licence (text, int, timestamptz, uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- rpc: a student claims a seat
-- ---------------------------------------------------------------------------
create or replace function public.redeem_licence (p_code text)
returns table (institution_name text, expires_at timestamptz, cohort_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  lic public.licences;
  taken int;
begin
  if auth.uid () is null then
    raise exception 'sign in before redeeming a licence';
  end if;

  -- `for update` is the whole concurrency story: it serialises every redemption of THIS licence,
  -- so the count below cannot be read by two sessions that then both insert.
  select * into lic
  from public.licences
  where code = upper (btrim (p_code))
  for update;

  if lic.id is null then
    raise exception 'no licence found for that code';
  end if;

  if lic.expires_at is not null and lic.expires_at <= now () then
    raise exception 'that licence has expired';
  end if;

  -- Redeeming twice is a learner pressing the button again, not a second seat.
  if exists (
    select 1 from public.licence_seats s
    where s.licence_id = lic.id and s.user_id = auth.uid ()
  ) then
    return query select lic.institution_name, lic.expires_at, lic.cohort_id;
    return;
  end if;

  select count (*) into taken
  from public.licence_seats s
  where s.licence_id = lic.id;

  if taken >= lic.seats then
    raise exception 'that licence has no seats left';
  end if;

  insert into public.licence_seats (licence_id, user_id)
  values (lic.id, auth.uid ());

  if lic.cohort_id is not null then
    insert into public.cohort_members (cohort_id, student_id)
    values (lic.cohort_id, auth.uid ())
    on conflict do nothing;
  end if;

  return query select lic.institution_name, lic.expires_at, lic.cohort_id;
end;
$$;

revoke execute on function public.redeem_licence (text) from anon, public;
grant execute on function public.redeem_licence (text) to authenticated;

-- ---------------------------------------------------------------------------
-- Webhook idempotency
--
-- RevenueCat retries a failed delivery five times (5, 10, 20, 40, 80 minutes) and can duplicate a
-- successful one. Every event is recorded here by its own id before anything is written, so a
-- replay is a no-op rather than a second grant. No policies at all: the service role only.
-- ---------------------------------------------------------------------------
create table if not exists public.billing_events (
  id text primary key,
  event_type text not null,
  app_user_id text,
  received_at timestamptz not null default now (),
  payload jsonb
);

alter table public.billing_events enable row level security;
revoke all on public.billing_events from anon, authenticated;

-- ---------------------------------------------------------------------------
-- The one answer both streams resolve to.
--
-- security_invoker means RLS applies as the calling learner, so this can only ever return their
-- own row — the same construction as v_cohort_progress. An institutional seat wins over a personal
-- subscription: a student whose school has paid should not also be charged, and the account page
-- uses `source` to tell them so.
-- ---------------------------------------------------------------------------
create or replace view public.v_entitlement
with (security_invoker = true) as
select
  p.id as user_id,
  case
    when seat.licence_id is not null then 'active'
    when p.subscription_status in ('active', 'trialing') then 'active'
    else 'free'
  end as status,
  case
    when seat.licence_id is not null then 'institution'
    when p.subscription_status in ('active', 'trialing') then 'subscription'
    else 'none'
  end as source,
  case
    when seat.licence_id is not null then seat.expires_at
    else p.current_period_end
  end as expires_at,
  seat.institution_name
from public.profiles p
left join lateral (
  select l.id as licence_id, l.expires_at, l.institution_name
  from public.licence_seats s
  join public.licences l on l.id = s.licence_id
  where s.user_id = p.id
    and (l.expires_at is null or l.expires_at > now ())
  -- A learner on two live licences keeps the one that lasts longest; nulls are perpetual.
  order by l.expires_at desc nulls first
  limit 1
) seat on true;

revoke all on public.v_entitlement from anon;
grant select on public.v_entitlement to authenticated;
