-- =====================================================================
-- 2026-11-23 점검 R16 — 아직 적용 안 함 (대표님 승인 후 Supabase 에 적용해 주세요)
--   일정 공유 링크(앱 없는 외부 스타일리스트용)
--   1) 받는 화면에 숙소 출발·픽업 정보를 주지 않음: 'departure' 빼고, 동선에서 [기상·준비]/[픽업 출발] 단계 빼기
--   2) '메모도 함께 보이기': schedule_shares.show_memo 칸 + create_schedule_share(p_schedule, p_show_memo)
--      켜 둔 링크만 get_shared_schedule 이 'memo'(일정 특이사항)를 돌려줌
--   앱(share.html)은 이 마이그레이션 전에도 출발·픽업을 화면에서 숨기고, 2인자 함수가 없으면 메모 칸을 끔
-- =====================================================================

alter table public.schedule_shares add column if not exists show_memo boolean not null default false;

-- 기존 1인자 함수: 결과에 show_memo 만 더함 (나머지 그대로)
create or replace function public.create_schedule_share(p_schedule uuid)
returns json
language plpgsql
security definer
set search_path to ''
as $function$
DECLARE
  s public.schedules%ROWTYPE;
  v_token text;
  v_exp timestamptz;
  v_memo boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION '로그인이 필요합니다' USING ERRCODE = '42501'; END IF;
  SELECT * INTO s FROM public.schedules WHERE id = p_schedule;
  IF NOT FOUND THEN RAISE EXCEPTION '일정을 찾을 수 없습니다' USING ERRCODE = 'P0002'; END IF;
  IF NOT public.security_schedule_access(s.artist_id, s.manager_id, s.created_by, s.is_secret, s.secret_level) THEN
    RAISE EXCEPTION '이 일정을 공유할 권한이 없습니다' USING ERRCODE = '42501';
  END IF;
  IF s.is_secret OR COALESCE(s.secret_level, 'public') = 'confidential' THEN
    RAISE EXCEPTION '비공개 일정은 공유할 수 없습니다' USING ERRCODE = '42501';
  END IF;
  v_exp := ((s.date + 2)::timestamp AT TIME ZONE 'Asia/Seoul');
  SELECT token, show_memo INTO v_token, v_memo FROM public.schedule_shares
    WHERE schedule_id = p_schedule AND NOT revoked AND expires_at > now()
    ORDER BY created_at DESC LIMIT 1;
  IF v_token IS NULL THEN
    v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
    v_memo := false;
    INSERT INTO public.schedule_shares(token, schedule_id, created_by, expires_at) VALUES (v_token, p_schedule, auth.uid(), v_exp);
  ELSE
    UPDATE public.schedule_shares SET expires_at = v_exp WHERE token = v_token;
  END IF;
  RETURN json_build_object('token', v_token, 'expires_at', v_exp, 'show_memo', COALESCE(v_memo, false));
END; $function$;

-- 새 2인자 함수: 같은 링크(토큰)는 그대로 두고 메모 보이기만 바꿈
create or replace function public.create_schedule_share(p_schedule uuid, p_show_memo boolean)
returns json
language plpgsql
security definer
set search_path to ''
as $function$
DECLARE
  r json;
BEGIN
  r := public.create_schedule_share(p_schedule);   -- 권한·비공개·만료 검사는 1인자 함수에서
  UPDATE public.schedule_shares SET show_memo = COALESCE(p_show_memo, false) WHERE token = r->>'token';
  RETURN json_build_object('token', r->>'token', 'expires_at', r->'expires_at', 'show_memo', COALESCE(p_show_memo, false));
END; $function$;

revoke all on function public.create_schedule_share(uuid, boolean) from public, anon;
grant execute on function public.create_schedule_share(uuid, boolean) to authenticated;

create or replace function public.get_shared_schedule(p_token text)
returns json
language plpgsql
stable security definer
set search_path to ''
as $function$
DECLARE
  sh public.schedule_shares%ROWTYPE;
  s public.schedules%ROWTYPE;
  v_artist text;
  v_mgr_name text;
  v_mgr_phone text;
  v_tl json;
BEGIN
  IF p_token IS NULL OR length(p_token) <> 64 THEN RETURN NULL; END IF;
  SELECT * INTO sh FROM public.schedule_shares WHERE token = p_token;
  IF NOT FOUND OR sh.revoked THEN RETURN NULL; END IF;
  SELECT * INTO s FROM public.schedules WHERE id = sh.schedule_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF s.is_secret OR COALESCE(s.secret_level, 'public') = 'confidential' THEN RETURN NULL; END IF;
  IF now() >= ((s.date + 2)::timestamp AT TIME ZONE 'Asia/Seoul') THEN RETURN json_build_object('expired', true); END IF;
  SELECT name INTO v_artist FROM public.artists WHERE id = s.artist_id;
  SELECT name, phone INTO v_mgr_name, v_mgr_phone FROM public.profiles WHERE id = s.manager_id;
  -- 숙소 기상·픽업 단계는 외부 사람에게 보내지 않음
  SELECT COALESCE(json_agg(json_build_object('time', e->>'time', 'label', e->>'label', 'done', COALESCE((e->>'done')::boolean, false)) ORDER BY ord), '[]'::json)
    INTO v_tl
    FROM jsonb_array_elements(CASE WHEN jsonb_typeof(s.timeline_items) = 'array' THEN s.timeline_items ELSE '[]'::jsonb END) WITH ORDINALITY AS t(e, ord)
    WHERE COALESCE(e->>'label', '') !~ '^\s*\[(기상|픽업)';
  RETURN json_build_object(
    'title', s.title, 'artist', COALESCE(v_artist, CASE WHEN s.artist_id IS NULL THEN '전원' END),
    'date', s.date, 'start_time', to_char(s.start_time, 'HH24:MI'), 'end_time', to_char(s.end_time, 'HH24:MI'),
    'location', s.location, 'shop', s.shop_location,
    'status', s.status, 'timeline', v_tl,
    'memo', CASE WHEN sh.show_memo THEN NULLIF(btrim(COALESCE(s.notes, '')), '') END,
    'manager_name', v_mgr_name, 'manager_phone', v_mgr_phone,
    'updated_at', s.updated_at, 'expires_at', ((s.date + 2)::timestamp AT TIME ZONE 'Asia/Seoul')
  );
END; $function$;
