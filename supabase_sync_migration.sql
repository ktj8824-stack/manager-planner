-- 서버 동기화용 컬럼 추가 (여러 번 실행해도 안전)
ALTER TABLE public.artists  ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '운행가능';
