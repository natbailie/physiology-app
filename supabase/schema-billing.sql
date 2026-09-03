-- Physiology Lab — entitlement. Run AFTER supabase/schema.sql and supabase/schema-teachers.sql
-- (a licence may name a cohort, so `cohorts` and `cohort_members` must already exist).
--
-- Two revenue streams, resolved into one answer:
--
--   * Individuals subscribe through RevenueCat. The webhook writes profiles.subscription_status
--     with the service role; the client has never been able to write that column and still cannot.
--   * Institutions buy seats against a Stripe invoice — UK medical schools pay by purchase order,
--     not by card — and receive a licence code their students redeem. `invoice.paid` mints it, or
--     you mint it by hand. Nothing in this path touches RevenueCat.
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
-- SELLING A LICENCE, the normal way: raise the invoice in the Stripe dashboard and let it mint
-- itself. Add these keys to the invoice's METADATA before you send it, and `invoice.paid` does the
-- rest through supabase/functions/stripe-webhook/ — there is no admin UI because the Stripe
-- dashboard is the admin UI:
--
--   physiology_licence  true                 (the marker; without it the invoice is ignored)
--   seats               350
--   expires_at          2027-07-31           (optional — omit for a perpetual licence)
--   cohort_id           <uuid>               (optional — also enrols every student in that cohort)
--   institution_name    Barts and The London (optional — defaults to the customer's name)
--
-- The minted code is written back onto the invoice's metadata as `licence_code`, so it ends up
-- beside the thing that bought it. A bare `expires_at` date means the END of that day: a licence
-- reading 2027-07-31 works through the 31st, which is what a finance officer means by it.
--
-- SELLING A LICENCE BY HAND, still supported and still the answer for a school that pays some
-- other way. Run in the SQL Editor, which runs as the service role — `authenticated` cannot call
-- mint_licence at all:
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

-- Which Stripe invoice bought this licence, when one did. Null for a licence minted by hand.
--
-- The UNIQUE is the point of the column rather than a side effect of it: it is what makes a second
-- delivery of the same `invoice.paid` physically unable to mint a second licence, independently of
-- the billing_events check the webhook does first. Two guards, because the failure this prevents —
-- a school silently issued two codes and two seat pools off one payment — is invisible until
-- somebody counts.
alter table public.licences
  add column if not exists stripe_invoice_id text unique;

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

-- No insert/update/delete policy anywhere: licences are minted by mint_licence, or by
-- mint_licence_for_invoice on the webhook's behalf, and both need the service role. The revoke is
-- belt and braces.
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
-- rpc: a paid Stripe invoice mints its own licence (service role only)
--
-- The same sale as mint_licence above, arriving on its own instead of being typed out after you
-- notice the money. `supabase/functions/stripe-webhook/` calls this when `invoice.paid` fires, with
-- the seat count and expiry read off the invoice's metadata.
--
-- It WRAPS mint_licence rather than replacing it, and mint_licence keeps its exact signature.
-- That signature is named in the revoke/grant statements above and the SQL-editor workflow at the
-- top of this file calls it positionally, so adding a parameter there would quietly break both.
-- The hand-minting path stays exactly as it was, and is still the answer for a school that pays
-- some other way.
--
-- Idempotent by construction, which matters because Stripe retries a failed delivery for three
-- days and can duplicate a successful one:
--   * the advisory lock serialises concurrent deliveries of the SAME invoice, so two of them
--     cannot both find nothing and both mint;
--   * a redelivery after the fact finds the existing row and returns it unchanged;
--   * licences.stripe_invoice_id is unique, so even a bug here cannot produce two.
-- ---------------------------------------------------------------------------
create or replace function public.mint_licence_for_invoice (
  p_stripe_invoice_id text,
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
  existing public.licences;
  created public.licences;
begin
  if p_stripe_invoice_id is null or btrim (p_stripe_invoice_id) = '' then
    raise exception 'an invoice id is required to mint against an invoice';
  end if;

  -- Held to the end of the transaction, and scoped to this invoice rather than to the table, so
  -- two schools paying in the same second do not queue behind each other.
  perform pg_advisory_xact_lock (hashtext (p_stripe_invoice_id));

  select * into existing
  from public.licences
  where stripe_invoice_id = p_stripe_invoice_id;

  -- Already minted. Return what the first delivery produced rather than a second code: the school
  -- has the first one on a handout by now.
  if existing.id is not null then
    return existing;
  end if;

  created := public.mint_licence (
    p_institution_name, p_seats, p_expires_at, p_cohort_id, p_notes
  );

  update public.licences
  set stripe_invoice_id = p_stripe_invoice_id
  where id = created.id
  returning * into created;

  return created;
end;
$$;

revoke execute on function public.mint_licence_for_invoice (text, text, int, timestamptz, uuid, text)
  from anon, authenticated, public;
grant execute on function public.mint_licence_for_invoice (text, text, int, timestamptz, uuid, text)
  to service_role;

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

-- Why an event was not acted on, when it was ours and could not be honoured — seats typed as
-- "three hundred", an expiry that is not a date. Null on every event that went through cleanly.
--
-- This column is the difference between a bad invoice being visible and being silent. A retry
-- cannot fix a typo, so the webhook answers those with a 200; without somewhere to put the reason,
-- a school would have paid, received nothing, and left no trace anywhere but a log line:
--
--   select id, event_type, error, received_at from public.billing_events
--   where error is not null order by received_at desc;
alter table public.billing_events
  add column if not exists error text;

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
