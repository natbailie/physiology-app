-- Physiology Lab — data minimisation and retention. Depends on schema.sql, schema-chat.sql and
-- schema-billing.sql; apply AFTER them. Idempotent: safe to run again.
-- Applied through the SQL Editor or the Supabase MCP connector, NOT `supabase db push` — see the
-- header of schema.sql for why that command does nothing here.
--
-- What it changes, and why each is in the privacy policy (src/shared/legal/privacy.ts):
-- * profiles.display_name stops being filled from the part of the email before the @. Nothing
--   reads it; holding a second copy of part of an email address for no purpose fails UK GDPR's
--   data-minimisation principle. Existing values that are exactly that prefix are cleared.
-- * profiles.stripe_customer_id is dropped. Institutional billing goes through Stripe invoices
--   keyed on the invoice, and individuals through RevenueCat; the column has been unused since.
-- * Deleting an account now also strips the webhook PAYLOAD from that user's billing_events.
--   The row, its id and its type stay: HMRC wants payment records for six years, and the id is
--   what keeps the webhooks idempotent. The payload (email, product, price, store details) is
--   what the six-year duty does not need.
-- * chat_usage rows older than 90 days can be purged. They exist only to count today's messages.

-- 1. Stop inventing a display name ---------------------------------------------------------
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user () from public;
revoke execute on function public.handle_new_user () from anon, authenticated;

update public.profiles p
set display_name = null
from auth.users u
where u.id = p.id
  and p.display_name is not null
  and p.display_name = split_part(u.email, '@', 1);

-- 2. Drop the unused legacy column ---------------------------------------------------------
alter table public.profiles drop column if exists stripe_customer_id;

-- 3. Account deletion takes the billing payloads with it ------------------------------------
create or replace function public.delete_own_account ()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid ();
begin
  if uid is null then
    raise exception 'sign in first';
  end if;
  -- Keep the minimum HMRC record (id, type, time); lose everything personal in the payload.
  update public.billing_events
  set payload = null
  where app_user_id = uid::text;
  -- profiles, attempts, cohort memberships, licence seats, chat usage and reviews all follow
  -- via ON DELETE CASCADE.
  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_own_account () from anon, public;
grant execute on function public.delete_own_account () to authenticated;

-- 4. Tutor usage is kept for 90 days --------------------------------------------------------
create or replace function public.purge_old_chat_usage ()
returns integer
language sql
security definer
set search_path = ''
as $$
  with gone as (
    delete from public.chat_usage where created_at < now () - interval '90 days' returning 1
  )
  select count(*)::integer from gone;
$$;

-- Nobody but the scheduler (running as postgres) calls it.
revoke execute on function public.purge_old_chat_usage () from anon, authenticated, public;

-- Schedule it daily with pg_cron (Dashboard → Database → Extensions → pg_cron, then):
--
--   select cron.schedule('purge-chat-usage', '17 3 * * *', 'select public.purge_old_chat_usage()');
--
-- The privacy policy promises 90 days, so until this is scheduled that promise is not being kept.
