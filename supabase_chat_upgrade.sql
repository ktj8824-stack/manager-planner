-- 로디톡 업그레이드: 읽음 표시 (여러 번 실행해도 안전합니다)
-- supabase_chat_migration.sql 을 먼저 실행한 뒤 이 파일을 SQL Editor 에서 Run 하세요.

-- 이 대화방의 "상대방" 읽은 시각을 알려준다.
--  · 1:1방: 상대방 (본사가 보면 그 매니저, 매니저가 보면 본사 계정들)
--  · 전체방: 같은 회사 매니저/스태프 전원 (나 제외)
-- 방을 볼 수 있는 사람만 결과를 받는다.
CREATE OR REPLACE FUNCTION public.chat_read_status(p_room uuid)
RETURNS TABLE(user_id uuid, role text, last_read_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
DECLARE r public.chat_rooms%ROWTYPE; v_hq boolean;
BEGIN
  SELECT * INTO r FROM public.chat_rooms WHERE id = p_room;
  IF NOT FOUND OR NOT public.chat_can_see_room(r.company_id, r.kind, r.manager_id) THEN RETURN; END IF;
  v_hq := public.is_ceo_or_hq_admin();
  RETURN QUERY
    SELECT p.id, p.role, cr.last_read_at
      FROM public.profiles p
      LEFT JOIN public.chat_reads cr ON cr.room_id = p_room AND cr.user_id = p.id
     WHERE p.company_id = r.company_id AND p.id <> auth.uid()
       AND CASE
             WHEN r.kind = 'all'  THEN p.role IN ('manager', 'staff')
             WHEN v_hq            THEN p.id = r.manager_id
             ELSE p.role IN ('ceo', 'hq_admin')
           END;
END $$;
REVOKE ALL ON FUNCTION public.chat_read_status(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chat_read_status(uuid) TO authenticated;

-- 대화 검색 속도 (메시지 내용 검색)
CREATE INDEX IF NOT EXISTS chat_messages_room_created_idx ON public.chat_messages(room_id, created_at DESC);
