-- ==============================================================================
-- 대화창(채팅) 기능 추가: 대표↔매니저 1:1 대화방 + 전체 대화방 + 사진 전송
-- 여러 번 실행해도 안전합니다. Supabase SQL Editor에서 한 번에 실행하세요.
-- ==============================================================================

-- 내 회사 번호 (권한 검사용)
CREATE OR REPLACE FUNCTION public.chat_my_company()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid(); $$;

-- 이 대화방을 볼 수 있는 사람인가? (같은 회사 + [본사 | 전체방 | 내 1:1방])
CREATE OR REPLACE FUNCTION public.chat_can_see_room(p_company uuid, p_kind text, p_manager uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.profiles me
  WHERE me.id = auth.uid() AND me.company_id IS NOT NULL AND me.company_id = p_company
    AND (me.role IN ('ceo', 'hq_admin') OR p_kind = 'all' OR p_manager = me.id)
); $$;

CREATE TABLE IF NOT EXISTS public.chat_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('direct', 'all')),
  manager_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chat_rooms_kind_manager CHECK (
    (kind = 'direct' AND manager_id IS NOT NULL) OR (kind = 'all' AND manager_id IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS chat_rooms_direct_uniq ON public.chat_rooms (company_id, manager_id) WHERE kind = 'direct';
CREATE UNIQUE INDEX IF NOT EXISTS chat_rooms_all_uniq ON public.chat_rooms (company_id) WHERE kind = 'all';

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '' CHECK (char_length(body) <= 2000),
  image_path TEXT,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chat_messages_nonempty CHECK (char_length(btrim(body)) > 0 OR image_path IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS chat_messages_room_time ON public.chat_messages (room_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_reads (
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (room_id, user_id)
);

ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_reads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.chat_rooms, public.chat_messages, public.chat_reads FROM anon, PUBLIC;
REVOKE UPDATE, DELETE ON public.chat_messages FROM authenticated;
REVOKE UPDATE, DELETE ON public.chat_rooms FROM authenticated;
GRANT SELECT, INSERT ON public.chat_rooms, public.chat_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.chat_reads TO authenticated;

DROP POLICY IF EXISTS chat_rooms_read ON public.chat_rooms;
DROP POLICY IF EXISTS chat_rooms_insert ON public.chat_rooms;
CREATE POLICY chat_rooms_read ON public.chat_rooms FOR SELECT TO authenticated
USING (public.chat_can_see_room(company_id, kind, manager_id));
CREATE POLICY chat_rooms_insert ON public.chat_rooms FOR INSERT TO authenticated
WITH CHECK (
  company_id = public.chat_my_company() AND (
    (public.is_ceo_or_hq_admin() AND (kind = 'all' OR public.security_same_tenant(manager_id)))
    OR (kind = 'direct' AND manager_id = auth.uid())
  )
);

DROP POLICY IF EXISTS chat_messages_read ON public.chat_messages;
DROP POLICY IF EXISTS chat_messages_insert ON public.chat_messages;
CREATE POLICY chat_messages_read ON public.chat_messages FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id));
CREATE POLICY chat_messages_insert ON public.chat_messages FOR INSERT TO authenticated
WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id));

DROP POLICY IF EXISTS chat_reads_own ON public.chat_reads;
CREATE POLICY chat_reads_own ON public.chat_reads FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.chat_rooms r WHERE r.id = room_id));

-- 보낸 사람·이름·긴급 표시는 서버가 정한다 (앱에서 속일 수 없음)
CREATE OR REPLACE FUNCTION public.chat_messages_before_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
DECLARE v_name text; v_hq boolean;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501'; END IF;
  SELECT COALESCE(NULLIF(p.name, ''), p.email), p.role IN ('ceo', 'hq_admin')
    INTO v_name, v_hq FROM public.profiles p WHERE p.id = auth.uid();
  NEW.sender_id := auth.uid();
  NEW.sender_name := COALESCE(v_name, '');
  NEW.is_urgent := COALESCE(NEW.is_urgent, false) AND COALESCE(v_hq, false);
  NEW.body := btrim(COALESCE(NEW.body, ''));
  NEW.created_at := statement_timestamp();
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS chat_messages_before_insert ON public.chat_messages;
CREATE TRIGGER chat_messages_before_insert BEFORE INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_messages_before_insert();

CREATE OR REPLACE FUNCTION public.chat_messages_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
BEGIN
  UPDATE public.chat_rooms SET last_message_at = NEW.created_at,
    last_message_preview = left(CASE WHEN NEW.body <> '' THEN NEW.body ELSE '(사진)' END, 80)
  WHERE id = NEW.room_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS chat_messages_after_insert ON public.chat_messages;
CREATE TRIGGER chat_messages_after_insert AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.chat_messages_after_insert();

REVOKE ALL ON FUNCTION public.chat_messages_before_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.chat_messages_after_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.chat_my_company() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.chat_can_see_room(uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chat_my_company() TO authenticated;
GRANT EXECUTE ON FUNCTION public.chat_can_see_room(uuid, text, uuid) TO authenticated;

-- 안 읽은 메시지 수 (내가 볼 수 있는 방만 계산됨)
CREATE OR REPLACE FUNCTION public.chat_unread_counts()
RETURNS TABLE (room_id uuid, unread bigint) LANGUAGE sql STABLE SECURITY INVOKER SET search_path = pg_catalog, public
AS $$
  SELECT m.room_id, count(*)::bigint
  FROM public.chat_messages m
  LEFT JOIN public.chat_reads r ON r.room_id = m.room_id AND r.user_id = auth.uid()
  WHERE m.sender_id IS DISTINCT FROM auth.uid() AND m.created_at > COALESCE(r.last_read_at, 'epoch'::timestamptz)
  GROUP BY m.room_id;
$$;
REVOKE ALL ON FUNCTION public.chat_unread_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.chat_unread_counts() TO authenticated;

-- 실시간 알림 (이미 등록돼 있어도 오류 없이 넘어감)
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- 사진 저장소 (비공개, 5MB, jpg/png/webp). 폴더 이름 = 대화방 번호
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('chat-images', 'chat-images', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS chat_images_read ON storage.objects;
DROP POLICY IF EXISTS chat_images_insert ON storage.objects;
CREATE POLICY chat_images_read ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-images' AND EXISTS (
  SELECT 1 FROM public.chat_rooms r WHERE r.id::text = (storage.foldername(name))[1]));
CREATE POLICY chat_images_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-images' AND EXISTS (
  SELECT 1 FROM public.chat_rooms r WHERE r.id::text = (storage.foldername(name))[1]));
