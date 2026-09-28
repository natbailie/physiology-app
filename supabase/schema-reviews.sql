-- Physiology Lab — learner reviews. Depends on schema.sql; apply after schema-privacy.sql.
-- Idempotent: safe to run again. Applied through the SQL Editor or the Supabase MCP connector,
-- NOT `supabase db push` — see the header of schema.sql.
--
-- The rules this table exists to enforce (DMCC Act 2024 Sch. 20 bans fake reviews and
-- publishing reviews in a misleading way; the moderation policy is on the #reviews page and in
-- the Terms):
-- * Only a signed-in account holder can write one, and only ONE per account — a review is
--   somebody's own experience, not a vote that can be stuffed.
-- * Every review starts `pending` and is published by a human. There is no admin UI and none is
--   wanted, as with Stripe: moderate in the dashboard's Table Editor by setting `status` to
--   `published` or `rejected` (with a `rejection_reason`). Reject ONLY for abuse, spam, personal
--   data, off-topic content or something that is not the writer's own experience — never for
--   being negative. Selective publication of positive reviews is itself a banned practice.
-- * Editing a review sends it back to `pending`, so a published review cannot be swapped for
--   something that was never checked.
-- * Nobody outside the table sees who wrote a review. The public read is a view with no user_id.
-- * The page computes the average from what is published. There is no place to type a rating.

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 10 and 1000),
  display_name text check (display_name is null or char_length(display_name) between 1 and 40),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  rejection_reason text,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now (),
  moderated_at timestamptz
);

create index if not exists reviews_published_idx on public.reviews (created_at desc) where status = 'published';

alter table public.reviews enable row level security;

-- A learner reads, writes and deletes their own row and nothing else. The public reads the view.
drop policy if exists "read own review" on public.reviews;
create policy "read own review" on public.reviews for select using (auth.uid () = user_id);

drop policy if exists "insert own review" on public.reviews;
create policy "insert own review" on public.reviews for insert
  with check (auth.uid () = user_id and status = 'pending' and moderated_at is null);

drop policy if exists "update own review" on public.reviews;
create policy "update own review" on public.reviews for update
  using (auth.uid () = user_id) with check (auth.uid () = user_id);

drop policy if exists "delete own review" on public.reviews;
create policy "delete own review" on public.reviews for delete using (auth.uid () = user_id);

-- The client may write only these; status, moderation and timestamps are the server's.
revoke insert, update on public.reviews from anon, authenticated;
grant insert (user_id, rating, body, display_name) on public.reviews to authenticated;
grant update (rating, body, display_name) on public.reviews to authenticated;
grant select, delete on public.reviews to authenticated;

-- Any edit by the author goes back into the queue. Moderation (dashboard / service role) does not.
create or replace function public.reviews_requeue_on_edit ()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(auth.role (), '') = 'authenticated' then
    new.status := 'pending';
    new.moderated_at := null;
    new.rejection_reason := null;
  elsif new.status is distinct from old.status then
    new.moderated_at := now ();
  end if;
  new.updated_at := now ();
  return new;
end;
$$;

drop trigger if exists reviews_requeue_on_edit on public.reviews;
create trigger reviews_requeue_on_edit
  before update on public.reviews
  for each row execute function public.reviews_requeue_on_edit ();

revoke execute on function public.reviews_requeue_on_edit () from anon, authenticated, public;

-- The public face: published reviews, no author identity. Runs as its owner (security_invoker
-- off) precisely so anonymous visitors can read published rows without a policy that would also
-- expose user_id.
create or replace view public.v_published_reviews as
select id, rating, body, display_name, created_at
from public.reviews
where status = 'published'
order by created_at desc;

grant select on public.v_published_reviews to anon, authenticated;
