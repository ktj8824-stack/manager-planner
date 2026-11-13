-- 일정에 현장 담당자 연락처·반복 일정 묶음 칸 추가 (대표 결정 11-13: CEO플래너 기능 가져오기)
--  · contact_info: {name, phone} — 본사 등록 창의 '현장 연락처'가 지금까지 서버에 안 올라가던 것 고침 (문자 초안에 씀)
--  · series: {id, kind, idx} — 반복 일정 묶음 (매주·평일·격주·매월). 이후 반복 함께 바꾸기·지우기
--  · 매니저는 여전히 status·timeline_items·status_logs 만 바꿀 수 있음 (security_guard_schedule 그대로)
alter table public.schedules add column if not exists contact_info jsonb not null default '{}'::jsonb;
alter table public.schedules add column if not exists series jsonb;
create index if not exists schedules_series_id_idx on public.schedules ((series->>'id')) where series is not null;
