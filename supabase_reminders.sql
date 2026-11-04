-- 2026-11-04 적용됨: 예약 알림 (출발 15분 전 · 전날 밤 9시 요약)
-- reminder_log: 같은 알림 한 번만 / app_settings: 서버 내부 설정 (둘 다 RLS 켜고 정책 없음)
create table if not exists public.reminder_log (key text primary key, sent_at timestamptz not null default now());
alter table public.reminder_log enable row level security;
create table if not exists public.app_settings (key text primary key, value text not null, updated_at timestamptz not null default now());
alter table public.app_settings enable row level security;
revoke all on public.reminder_log, public.app_settings from anon, authenticated;
insert into public.app_settings (key, value) values ('reminder_cron_key', encode(extensions.gen_random_bytes(32), 'hex')) on conflict (key) do nothing;
create extension if not exists pg_cron;
create extension if not exists pg_net;
-- 5분마다 reminders 함수 호출 (키는 표에서 읽음, 코드에 적지 않음)
-- select cron.schedule('roadplanner-reminders', '*/5 * * * *', $$ select net.http_post(url := 'https://gohxflsyhogyxantnlig.supabase.co/functions/v1/reminders', headers := jsonb_build_object('Content-Type','application/json','x-cron-key',(select value from public.app_settings where key='reminder_cron_key')), body := '{}'::jsonb, timeout_milliseconds := 20000); $$);
-- select cron.schedule('roadplanner-reminder-log-cleanup', '17 4 * * *', $$ delete from public.reminder_log where sent_at < now() - interval '14 days' $$);
