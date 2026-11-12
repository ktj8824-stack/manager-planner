-- 로드비서(roadplanner-ai) 하루 사용량 — 버디플래너 Supabase 프로젝트(iaccdqcthhtvvetmbryr)에 있는 것을 기록으로 남김 (11-12 서버에서 그대로 옮김)
-- 서버 함수만 부름 (service_role). 앱에서는 직접 못 읽고 못 씀 (RLS 켜짐, 정책 없음)
create table if not exists public.rp_ai_usage (
  user_id uuid not null,
  day date not null,
  kind text not null default 'chat',
  count integer not null default 0,
  primary key (user_id, day, kind)
);
alter table public.rp_ai_usage enable row level security;

-- 한 번 쓰고 남은 횟수를 돌려줌. 한도를 넘으면 -1
create or replace function public.rp_ai_try_use(p_user uuid, p_kind text, p_limit integer)
returns integer language plpgsql security definer set search_path to '' as $$
declare today date := (now() at time zone 'Asia/Seoul')::date; n integer;
begin
  insert into public.rp_ai_usage (user_id, day, kind, count) values (p_user, today, p_kind, 1)
  on conflict (user_id, day, kind) do update set count = public.rp_ai_usage.count + 1
  where public.rp_ai_usage.count < p_limit
  returning count into n;
  return case when n is null then -1 else p_limit - n end;
end $$;
revoke all on function public.rp_ai_try_use(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.rp_ai_try_use(uuid, text, integer) to service_role;
