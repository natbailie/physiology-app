-- Physiology Lab — cohorts and the teacher view. Run AFTER supabase/schema.sql.
--
-- Design notes:
-- * Roles live on profiles (student by default). Teachers are promoted manually from the
--   Supabase dashboard until an admin UI exists: update public.profiles set role = 'teacher'
--   where id = '<uuid>';
-- * Joining is by short human-shareable code, generated server-side from an alphabet without
--   0/O/1/I/L so codes survive being read aloud or written down.
-- * create_cohort / join_cohort are security definer because joining must not require reading
--   the cohorts table (codes are meant to be semi-secret, not row-visible).
-- * The teacher's access to attempt rows is a plain RLS policy on question_attempts, so every
--   future aggregation (views included) inherits it through security-invoker semantics.

alter table public.profiles
  add column if not exists role text not null default 'student'
  check (role in ('student', 'teacher'));

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  join_code text not null unique,
  created_at timestamptz not null default now ()
);

create table if not exists public.cohort_members (
  cohort_id uuid not null references public.cohorts (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now (),
  primary key (cohort_id, student_id)
);

create index if not exists cohort_members_student_idx
  on public.cohort_members (student_id);

alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;

-- `for all` here let ANY authenticated user INSERT a cohort naming themselves the teacher,
-- straight through PostgREST, which walks past the role check create_cohort enforces below.
-- Paired with "teachers read their cohort's attempts", a student who talked a classmate into
-- joining their self-minted code could then read that classmate's whole attempt history.
-- Creation now goes through the rpc only; read/update/delete stay row-scoped to the owner.
drop policy if exists "teachers manage own cohorts" on public.cohorts;

drop policy if exists "teachers read own cohorts" on public.cohorts;
create policy "teachers read own cohorts"
  on public.cohorts for select
  using (teacher_id = auth.uid ());

drop policy if exists "teachers update own cohorts" on public.cohorts;
create policy "teachers update own cohorts"
  on public.cohorts for update
  using (teacher_id = auth.uid ())
  with check (
    teacher_id = auth.uid ()
    and (select role from public.profiles where id = auth.uid ()) = 'teacher'
  );

drop policy if exists "teachers delete own cohorts" on public.cohorts;
create policy "teachers delete own cohorts"
  on public.cohorts for delete
  using (teacher_id = auth.uid ());

-- No insert policy at all: create_cohort is security definer and does the role check itself.
-- The revoke is belt and braces — with no policy, RLS already denies every direct insert.
revoke insert on public.cohorts from authenticated;

drop policy if exists "members see their own cohorts" on public.cohorts;
create policy "members see their own cohorts"
  on public.cohorts for select
  using (
    exists (
      select 1 from public.cohort_members cm
      where cm.cohort_id = id and cm.student_id = auth.uid ()
    )
  );

drop policy if exists "read memberships you belong to or teach" on public.cohort_members;
create policy "read memberships you belong to or teach"
  on public.cohort_members for select
  using (
    student_id = auth.uid ()
    or exists (
      select 1 from public.cohorts c
      where c.id = cohort_id and c.teacher_id = auth.uid ()
    )
  );

drop policy if exists "join a cohort yourself" on public.cohort_members;
create policy "join a cohort yourself"
  on public.cohort_members for insert
  with check (student_id = auth.uid ());

drop policy if exists "leave your own cohort" on public.cohort_members;
create policy "leave your own cohort"
  on public.cohort_members for delete
  using (student_id = auth.uid ());

drop policy if exists "teacher removes members" on public.cohort_members;
create policy "teacher removes members"
  on public.cohort_members for delete
  using (
    exists (
      select 1 from public.cohorts c
      where c.id = cohort_id and c.teacher_id = auth.uid ()
    )
  );

-- A teacher may read the attempts of anyone in one of their cohorts; this is what makes the
-- dashboard possible without ever exposing another learner's data to students.
drop policy if exists "teachers read their cohort's attempts" on public.question_attempts;
create policy "teachers read their cohort's attempts"
  on public.question_attempts for select
  using (
    exists (
      select 1
      from public.cohort_members cm
      join public.cohorts c on c.id = cm.cohort_id
      where cm.student_id = question_attempts.user_id
        and c.teacher_id = auth.uid ()
    )
  );

-- ---------------------------------------------------------------------------
-- rpc: teacher creates a cohort and receives its join code
-- ---------------------------------------------------------------------------
create or replace function public.create_cohort (p_name text)
returns public.cohorts
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_code text;
  created public.cohorts;
begin
  if (select role from public.profiles where id = auth.uid ()) is distinct from 'teacher' then
    raise exception 'only teachers can create cohorts';
  end if;

  loop
    select string_agg(character, '')
    into new_code
    from (
      select substr ('ABCDEFGHJKMNPQRSTUVWXYZ23456789', floor (random () * 31 + 1)::int, 1) as character
      from generate_series (1, 8)
    ) letters;

    exit when not exists (select 1 from public.cohorts where join_code = new_code);
  end loop;

  insert into public.cohorts (name, teacher_id, join_code)
  values (p_name, auth.uid (), new_code)
  returning * into created;

  return created;
end;
$$;

-- ---------------------------------------------------------------------------
-- rpc: student joins by code
-- ---------------------------------------------------------------------------
create or replace function public.join_cohort (p_join_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  cohort_id uuid;
begin
  select id into cohort_id
  from public.cohorts
  where join_code = upper (btrim (p_join_code));

  if cohort_id is null then
    raise exception 'no cohort found for that code';
  end if;

  insert into public.cohort_members (cohort_id, student_id)
  values (cohort_id, auth.uid ())
  on conflict do nothing;

  return cohort_id;
end;
$$;

revoke execute on function public.create_cohort (text) from anon, public;
grant execute on function public.create_cohort (text) to authenticated;

revoke execute on function public.join_cohort (text) from anon, public;
grant execute on function public.join_cohort (text) to authenticated;

-- ---------------------------------------------------------------------------
-- Aggregation the dashboard reads. security_invoker means RLS applies as the calling
-- teacher, so this view cannot leak a cohort they do not teach.
-- ---------------------------------------------------------------------------
create or replace view public.v_cohort_progress
with (security_invoker = true) as
select
  c.id as cohort_id,
  c.name as cohort_name,
  a.user_id,
  a.module_id,
  count (*)::int as attempted,
  sum (case when a.is_correct then 1 else 0 end)::int as correct,
  max (a.created_at) as last_attempt_at
from public.cohorts c
join public.cohort_members cm on cm.cohort_id = c.id
join public.question_attempts a on a.user_id = cm.student_id
group by c.id, c.name, a.user_id, a.module_id;

revoke all on public.v_cohort_progress from anon;
grant select on public.v_cohort_progress to authenticated;
