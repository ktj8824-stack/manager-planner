-- 서버 동기화용 컬럼 추가 (여러 번 실행해도 안전)
ALTER TABLE public.artists  ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS data JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '운행가능';

-- 매니저 추가 슬롯: 결제 시스템 연결 전까지 운영자가 직접 숫자를 올려 줌 (앱에서는 수정 불가)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS extra_manager_slots INT NOT NULL DEFAULT 0;
