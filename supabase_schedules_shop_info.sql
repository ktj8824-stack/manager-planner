-- 2026-11-04 적용됨: 헤어·메이크업 샵 상세(주소·소요시간)를 서버에 보관 (길안내·자동 동선용)
alter table public.schedules add column if not exists shop_info jsonb not null default '{}'::jsonb;
