-- 2026-11-02 적용 완료 (Claude가 Supabase에 직접 적용)
-- '전체 아티스트(전원)' 일정은 특정 아티스트가 없으므로 artist_id를 비워(NULL) 저장한다.
ALTER TABLE public.schedules ALTER COLUMN artist_id DROP NOT NULL;
