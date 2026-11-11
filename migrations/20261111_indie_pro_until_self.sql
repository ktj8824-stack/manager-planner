-- 개인 매니저 유료 기간: 본인 것만 조회 (다른 사람 UUID로 만료일 알아내기 막기)
-- 서버 함수(서비스 키, auth.uid() 없음)는 그대로 조회 가능
create or replace function public.indie_pro_until(p_user uuid)
returns timestamptz language sql stable security definer set search_path to 'pg_catalog' as $$
  select max(period_end) from public.payments
  where user_id = p_user and plan = 'pro' and status = 'DONE'
    and (p_user = auth.uid() or auth.uid() is null);
$$;
revoke all on function public.indie_pro_until(uuid) from public, anon;
grant execute on function public.indie_pro_until(uuid) to authenticated, service_role;
