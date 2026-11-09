-- 위치정보법 준비 (A안)
--  1) location_consents : 본인의 개인위치정보 이용 동의 상태 (본인만 쓰기, 같은 회사 본사는 보기만)
--  2) location_logs     : 위치정보 이용·제공사실 확인자료 (위치정보법 제16조) — 본인 기록만 추가, 고치기·지우기 불가
--  3) 1년 지난 기록은 매일 자동 삭제
create table if not exists public.location_consents (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  agreed boolean not null,
  terms_version text not null default '2026-11-09',
  updated_at timestamptz not null default now()
);
alter table public.location_consents enable row level security;
drop policy if exists location_consents_own on public.location_consents;
create policy location_consents_own on public.location_consents for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists location_consents_hq on public.location_consents;
create policy location_consents_hq on public.location_consents for select to authenticated
  using (public.is_ceo_or_hq_admin() and exists (
    select 1 from public.profiles p where p.id = location_consents.user_id and p.company_id = public.tenant_my_company()));
grant select, insert, update on public.location_consents to authenticated;

create or replace function public.location_consents_touch() returns trigger language plpgsql
set search_path = pg_catalog as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists location_consents_touch on public.location_consents;
create trigger location_consents_touch before insert or update on public.location_consents
  for each row execute function public.location_consents_touch();

create table if not exists public.location_logs (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  kind text not null check (kind in ('consent','withdraw','eta','delay_report','sos')),
  recipient text,            -- 제공받는 곳 (예: 소속 회사 본사). 본인만 쓴 경우 null
  purpose text,
  created_at timestamptz not null default now()
);
create index if not exists location_logs_user_idx on public.location_logs (user_id, created_at desc);
alter table public.location_logs enable row level security;
drop policy if exists location_logs_read on public.location_logs;
create policy location_logs_read on public.location_logs for select to authenticated
  using (user_id = auth.uid());
drop policy if exists location_logs_insert on public.location_logs;
create policy location_logs_insert on public.location_logs for insert to authenticated
  with check (user_id = auth.uid());
grant select, insert on public.location_logs to authenticated;
-- 시각은 서버 시각으로 고정 (기기 시계로 기록을 조작하지 못하게)
create or replace function public.location_logs_now() returns trigger language plpgsql
set search_path = pg_catalog as $$
begin new.created_at := now(); return new; end $$;
drop trigger if exists location_logs_now on public.location_logs;
create trigger location_logs_now before insert on public.location_logs
  for each row execute function public.location_logs_now();

-- 1년 지난 확인자료 자동 삭제 (매일 04:10 KST = 19:10 UTC)
select cron.unschedule(jobid) from cron.job where jobname = 'location_logs_purge';
select cron.schedule('location_logs_purge', '10 19 * * *',
  $$delete from public.location_logs where created_at < now() - interval '1 year'$$);
