-- 2026-11-16 적용됨 (Supabase migration: launch_free_period)
-- 출시 기념 무료 기간 (마이·버디·CEO 플래너와 같은 날: 2027-03-31)
-- 결제 스위치(pay_open)를 'true'로 바꾸기 전까지는 날짜가 지나도 계속 무료.
-- 결제를 열 때: update app_settings set value='true' where key='pay_open';  (+ 앱 js/site-config.js PROMO.PAY_OPEN 도 true)

insert into public.app_settings (key, value) values
  ('pay_open', 'false'),
  ('free_until', '2027-03-31T23:59:59+09:00')
on conflict (key) do nothing;

create or replace function public.rp_free_period()
returns boolean language sql stable security definer set search_path to 'pg_catalog'
as $$ select coalesce((select value from public.app_settings where key = 'pay_open'), 'false') <> 'true'; $$;
revoke all on function public.rp_free_period() from public, anon;
grant execute on function public.rp_free_period() to authenticated, service_role;

-- 개인 매니저 '유료 기능을 쓸 수 있는 기한' — 무료 기간에는 최소 '내일'까지
--   (보는 곳: artists_owner_guard, expenses_guard, reminders)
create or replace function public.indie_pro_until(p_user uuid)
returns timestamp with time zone language sql stable security definer set search_path to 'pg_catalog'
as $$
  select case
    when not (p_user = auth.uid() or auth.uid() is null) then null
    when public.rp_free_period() then greatest(
      (select max(period_end) from public.payments where user_id = p_user and plan = 'pro' and status = 'DONE'),
      now() + interval '1 day')
    else (select max(period_end) from public.payments where user_id = p_user and plan = 'pro' and status = 'DONE')
  end;
$$;
