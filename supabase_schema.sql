-- ==============================================================================
-- 🏢 엔터테인먼트 매니저 플래너 & HQ 마스터 관제 시스템 - Supabase SQL Schema (v2.0 Enterprise)
-- ==============================================================================
-- 이 스크립트를 Supabase 대시보드 -> [SQL Editor]에 붙여넣고 [Run]을 누르시면
-- 4대 역할(CEO/HQ/매니저/스태프), 비공개 스케줄(Secret Mode), RLS 보안 정책 및 
-- 초기 기본 데이터(아티스트/차량/프로필)가 완벽하게 세팅됩니다.
-- ==============================================================================

-- 0. 가입된 엔터테인먼트 회사 테이블 (B2B)
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. 사용자 프로필 테이블 (Profiles) - Supabase Auth와 연동
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'indie_manager' CHECK (role IN ('ceo', 'hq_admin', 'manager', 'staff', 'indie_manager')),
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL, -- NULL이면 B2C (개인 매니저)
  auth_provider TEXT DEFAULT 'email', -- email, google, kakao
  phone TEXT,
  color TEXT DEFAULT '#4f46e5',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 소속 아티스트 테이블 (Artists)
CREATE TABLE IF NOT EXISTS public.artists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 아이돌/걸그룹, 보이그룹, 배우, 솔로가수 등
  members INT DEFAULT 1,
  color TEXT NOT NULL DEFAULT '#ec4899',
  emoji TEXT DEFAULT '✨',
  status TEXT DEFAULT '활동중',
  care_info JSONB DEFAULT '{}'::jsonb, -- 💊 아티스트 케어 & 라이더 카드 정보
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 아티스트 ↔ 담당 매니저/스태프 배정 테이블 (Artist_Managers)
CREATE TABLE IF NOT EXISTS public.artist_managers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(artist_id, manager_id)
);

-- 4. 지원 차량 테이블 (Vehicles)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 밴, 세단, 대형밴 등
  capacity INT DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 통합 스케줄 테이블 (Schedules)
CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'broadcast', -- music_show, shooting, event, fansign, broadcast, recording, meeting
  artist_id TEXT NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT,
  shop_location TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  is_secret BOOLEAN NOT NULL DEFAULT false, -- 🔒 비공개 보안 일정 여부 (Secret Mode)
  secret_level TEXT DEFAULT 'public' CHECK (secret_level IN ('public', 'confidential')),
  timeline_items JSONB DEFAULT '[]'::jsonb, -- 세부 역산 타임라인 (픽업, 샵, 리허설 등)
  status_logs JSONB DEFAULT '[]'::jsonb, -- ⏱️ 실시간 현장 타임스탬프 히스토리 로그
  departure_info JSONB DEFAULT '{}'::jsonb, -- 출발/픽업 장소 및 시간 정보
  outfit TEXT, -- 의상 및 착장 정보
  supplies TEXT, -- 준비물 및 비품 정보
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. 본사 긴급 공지 & 매니저 알림 테이블 (Announcements)
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL DEFAULT '본사 공지사항',
  content TEXT NOT NULL,
  is_urgent BOOLEAN DEFAULT false,
  target_role TEXT DEFAULT 'all', -- all, manager, staff
  target_manager_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sender_name TEXT DEFAULT '본사 관제팀',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Realtime 활성화 (Supabase 실시간 동기화)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.schedules;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.artists;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Security hardening, 2026-10-16. SQL-only; no application data is deleted.
-- Run as the trusted Supabase migration owner, never from a browser session.
-- Repeatable: replaces functions/triggers and known policy names in one transaction.
-- Existing elevated accounts are NOT demoted. Audit/provision roles and companies
-- separately through trusted server/database administration, not user metadata.
BEGIN;
-- Auth signup definer functions must be owned by a role trusted by the guards.
DO $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin') THEN
    RAISE EXCEPTION 'Apply this migration as postgres or supabase_admin';
  END IF;
END; $$;

ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'indie_manager';
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Definer helpers avoid recursive profiles RLS; no dynamic SQL or writable search path.
CREATE OR REPLACE FUNCTION public.is_ceo_or_hq_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles p
  WHERE p.id = auth.uid() AND p.role IN ('ceo', 'hq_admin')); $$;
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT p.role FROM public.profiles p WHERE p.id = auth.uid(); $$;

-- NULL company is personal, NOT a tenant shared by all independent managers.
CREATE OR REPLACE FUNCTION public.security_same_tenant(p_profile_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT EXISTS (
  SELECT 1 FROM public.profiles me JOIN public.profiles other ON other.id = p_profile_id
  WHERE me.id = auth.uid() AND (other.id = me.id OR
    (me.company_id IS NOT NULL AND other.company_id = me.company_id))
); $$;

-- Schedules have no company_id. Stable creator is the authority; manager is a
-- fallback only for legacy rows without a creator. Unattributed rows fail closed.
CREATE OR REPLACE FUNCTION public.security_schedule_scope(p_creator uuid, p_manager uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT public.security_same_tenant(COALESCE(p_creator, p_manager)); $$;
-- Personal planners may fully edit/delete only their own self-assigned schedule.
-- A company-bound account cannot obtain this exception merely by its role label.
CREATE OR REPLACE FUNCTION public.security_personal_schedule(p_creator uuid, p_manager uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles p
 WHERE p.id = auth.uid() AND p.role = 'indie_manager' AND p.company_id IS NULL
 AND p_creator = p.id AND p_manager = p.id); $$;

CREATE OR REPLACE FUNCTION public.security_schedule_access(
  p_artist text, p_manager uuid, p_creator uuid, p_secret boolean, p_level text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT public.security_schedule_scope(p_creator, p_manager) AND (
  public.is_ceo_or_hq_admin() OR (
    public.get_current_user_role() IN ('manager', 'indie_manager', 'staff')
    AND (p_manager = auth.uid() OR p_creator = auth.uid() OR EXISTS (
      SELECT 1 FROM public.artist_managers am
      WHERE am.artist_id = p_artist AND am.manager_id = auth.uid()))
    AND ((NOT p_secret AND COALESCE(p_level, 'public') <> 'confidential') OR
      (p_manager = auth.uid() AND public.get_current_user_role() IN ('manager', 'indie_manager')))
  )
); $$;

-- SECURITY INVOKER is intentional: current_user is the actual database role,
-- not client-supplied metadata. The trigger itself does not switch owners.
-- Trusted auth signup invokes it under handle_new_user's trusted definer owner.
CREATE OR REPLACE FUNCTION public.security_guard_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF auth.uid() IS NULL OR NEW.id IS DISTINCT FROM auth.uid()
       OR NEW.role IS DISTINCT FROM 'indie_manager' OR NEW.company_id IS NOT NULL THEN
      RAISE EXCEPTION 'Profile privileges must be provisioned by a trusted server' USING ERRCODE = '42501';
    END IF;
  ELSIF NEW.id IS DISTINCT FROM OLD.id OR NEW.role IS DISTINCT FROM OLD.role
        OR NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'Profile id, role and company_id are server-managed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS security_guard_profile ON public.profiles;
CREATE TRIGGER security_guard_profile BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.security_guard_profile();

CREATE OR REPLACE FUNCTION public.security_guard_schedule()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog
AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'INSERT' THEN
    -- Current client omits created_by. Attribute new rows without trusting payload.
    IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
    IF NEW.created_by IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Cannot impersonate a schedule creator' USING ERRCODE = '42501';
    END IF;
    IF public.get_current_user_role() NOT IN ('ceo', 'hq_admin', 'manager', 'indie_manager')
       OR public.get_current_user_role() IS NULL THEN
      RAISE EXCEPTION 'Schedule creation is not permitted' USING ERRCODE = '42501';
    END IF;
    IF NOT public.is_ceo_or_hq_admin() AND NEW.manager_id IS DISTINCT FROM auth.uid() THEN
      -- Personal/ordinary managers may create only self-assigned schedules.
      IF NEW.manager_id IS NULL THEN NEW.manager_id := auth.uid();
      ELSE RAISE EXCEPTION 'Cannot assign another manager' USING ERRCODE = '42501'; END IF;
    END IF;
    NEW.created_at := statement_timestamp();
  ELSE
    -- Even HQ cannot move a row to another tenant or rewrite its identity/audit origin.
    IF NEW.id IS DISTINCT FROM OLD.id OR NEW.created_by IS DISTINCT FROM OLD.created_by
       OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
      RAISE EXCEPTION 'Schedule identity and creator are immutable' USING ERRCODE = '42501';
    END IF;
    IF NOT public.security_schedule_access(OLD.artist_id, OLD.manager_id,
      OLD.created_by, OLD.is_secret, OLD.secret_level) THEN
      RAISE EXCEPTION 'Schedule access denied' USING ERRCODE = '42501';
    END IF;
    IF public.security_personal_schedule(OLD.created_by, OLD.manager_id)
       AND NOT public.security_personal_schedule(NEW.created_by, NEW.manager_id) THEN
      RAISE EXCEPTION 'Personal schedule must remain self-assigned' USING ERRCODE = '42501';
    END IF;
    IF NOT public.is_ceo_or_hq_admin()
       AND NOT public.security_personal_schedule(OLD.created_by, OLD.manager_id) AND
      (to_jsonb(NEW) - ARRAY['status', 'timeline_items', 'status_logs', 'updated_at'])
      IS DISTINCT FROM
      (to_jsonb(OLD) - ARRAY['status', 'timeline_items', 'status_logs', 'updated_at']) THEN
      RAISE EXCEPTION 'Only status, timeline_items and status_logs may be changed' USING ERRCODE = '42501';
    END IF;
  END IF;
  IF NOT public.security_schedule_scope(NEW.created_by, NEW.manager_id)
     OR (NEW.manager_id IS NOT NULL AND NOT public.security_same_tenant(NEW.manager_id)) THEN
    RAISE EXCEPTION 'Cross-tenant schedule assignment denied' USING ERRCODE = '42501';
  END IF;
  NEW.updated_at := statement_timestamp();
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS security_guard_schedule ON public.schedules;
CREATE TRIGGER security_guard_schedule BEFORE INSERT OR UPDATE ON public.schedules
FOR EACH ROW EXECUTE FUNCTION public.security_guard_schedule();

-- Signup metadata is user-controlled. Never derive role/company from it.
-- ON CONFLICT preserves any existing, trusted provisioning instead of overwriting it.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, company_id, auth_provider, phone, color)
  VALUES (NEW.id, COALESCE(NEW.email, NEW.id::text || '@no-email.invalid'),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NULLIF(split_part(NEW.email, '@', 1), ''), 'User'),
    'indie_manager', NULL,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    NEW.raw_user_meta_data->>'phone', '#4f46e5')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Replace ALL policy names present in the original schema, including broad FOR ALL.
DROP POLICY IF EXISTS "모든 인증된 사용자는 프로필 목록 조회 가능" ON public.profiles;
DROP POLICY IF EXISTS "본인 프로필 수정 가능" ON public.profiles;
DROP POLICY IF EXISTS "본사 관리자는 모든 프로필 관리 가능" ON public.profiles;
DROP POLICY IF EXISTS "모든 사용자는 아티스트 조회 가능" ON public.artists;
DROP POLICY IF EXISTS "본사 관리자는 아티스트 등록/수정/삭제 가능" ON public.artists;
DROP POLICY IF EXISTS "모든 사용자는 배정 내역 조회 가능" ON public.artist_managers;
DROP POLICY IF EXISTS "본사 관리자는 배정 등록/수정/삭제 가능" ON public.artist_managers;
DROP POLICY IF EXISTS "모든 사용자는 차량 목록 조회 가능" ON public.vehicles;
DROP POLICY IF EXISTS "본사 관리자는 차량 등록/수정/삭제 가능" ON public.vehicles;
DROP POLICY IF EXISTS "본사 관리자 및 CEO는 모든 스케줄 관리 가능" ON public.schedules;
DROP POLICY IF EXISTS "매니저 및 스태프 스케줄 조회 권한" ON public.schedules;
DROP POLICY IF EXISTS "매니저는 스케줄 등록 가능" ON public.schedules;
DROP POLICY IF EXISTS "매니저는 담당 스케줄 상태 및 타임스탬프 수정 가능" ON public.schedules;

-- Unknown deployment policies are preserved. Restrictive operation boundaries
-- below intersect them, so old permissive policies cannot reopen scoped access.
-- Remove only this migration's policy prefix to allow safe repeated application.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT schemaname, tablename, policyname FROM pg_catalog.pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('companies','profiles','artists','artist_managers','vehicles','schedules','announcements')
      AND left(policyname, length('security_hardening_')) = 'security_hardening_'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END; $$;

CREATE POLICY security_hardening_profiles_read ON public.profiles
FOR SELECT TO authenticated USING (public.security_same_tenant(id));
CREATE POLICY security_hardening_profiles_update ON public.profiles
FOR UPDATE TO authenticated USING (id = auth.uid() OR (public.is_ceo_or_hq_admin() AND public.security_same_tenant(id)))
WITH CHECK (id = auth.uid() OR (public.is_ceo_or_hq_admin() AND public.security_same_tenant(id)));
CREATE POLICY security_hardening_profiles_read_boundary ON public.profiles AS RESTRICTIVE
FOR SELECT TO public USING (public.security_same_tenant(id));
CREATE POLICY security_hardening_profiles_update_boundary ON public.profiles AS RESTRICTIVE
FOR UPDATE TO public USING (id = auth.uid() OR (public.is_ceo_or_hq_admin() AND public.security_same_tenant(id)))
WITH CHECK (id = auth.uid() OR (public.is_ceo_or_hq_admin() AND public.security_same_tenant(id)));
CREATE POLICY security_hardening_profiles_insert_boundary ON public.profiles AS RESTRICTIVE
FOR INSERT TO public WITH CHECK (false);
CREATE POLICY security_hardening_profiles_delete_boundary ON public.profiles AS RESTRICTIVE
FOR DELETE TO public USING (false);

CREATE POLICY security_hardening_companies_read ON public.companies
FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = companies.id));
CREATE POLICY security_hardening_companies_boundary ON public.companies AS RESTRICTIVE
FOR ALL TO public USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.company_id = companies.id)) WITH CHECK (false);
CREATE POLICY security_hardening_companies_delete_boundary ON public.companies AS RESTRICTIVE
FOR DELETE TO public USING (false);

-- Artists/vehicles lack tenant ownership. Preserve shared catalog reads and HQ
-- catalog management; these are explicitly NOT tenant-private resources yet.
CREATE POLICY security_hardening_artists_read ON public.artists FOR SELECT TO authenticated USING (true);
CREATE POLICY security_hardening_artists_write ON public.artists FOR ALL TO authenticated
USING (public.is_ceo_or_hq_admin()) WITH CHECK (public.is_ceo_or_hq_admin());
CREATE POLICY security_hardening_vehicles_read ON public.vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY security_hardening_vehicles_write ON public.vehicles FOR ALL TO authenticated
USING (public.is_ceo_or_hq_admin()) WITH CHECK (public.is_ceo_or_hq_admin());

-- Defend catalog write privileges even if unknown permissive policies remain.
CREATE POLICY security_hardening_artists_boundary ON public.artists AS RESTRICTIVE FOR ALL TO public
USING (auth.uid() IS NOT NULL) WITH CHECK (public.is_ceo_or_hq_admin());
CREATE POLICY security_hardening_artists_delete_boundary ON public.artists AS RESTRICTIVE FOR DELETE TO public
USING (public.is_ceo_or_hq_admin());
CREATE POLICY security_hardening_vehicles_boundary ON public.vehicles AS RESTRICTIVE FOR ALL TO public
USING (auth.uid() IS NOT NULL) WITH CHECK (public.is_ceo_or_hq_admin());
CREATE POLICY security_hardening_vehicles_delete_boundary ON public.vehicles AS RESTRICTIVE FOR DELETE TO public
USING (public.is_ceo_or_hq_admin());

CREATE POLICY security_hardening_assignments_read ON public.artist_managers FOR SELECT TO authenticated
USING (manager_id = auth.uid() OR (public.is_ceo_or_hq_admin() AND public.security_same_tenant(manager_id)));
CREATE POLICY security_hardening_assignments_write ON public.artist_managers FOR ALL TO authenticated
USING (public.is_ceo_or_hq_admin() AND public.security_same_tenant(manager_id))
WITH CHECK (public.is_ceo_or_hq_admin() AND public.security_same_tenant(manager_id));
CREATE POLICY security_hardening_assignments_boundary ON public.artist_managers AS RESTRICTIVE FOR ALL TO public
USING (manager_id = auth.uid() OR (public.is_ceo_or_hq_admin() AND public.security_same_tenant(manager_id)))
WITH CHECK (public.is_ceo_or_hq_admin() AND public.security_same_tenant(manager_id));
CREATE POLICY security_hardening_assignments_delete_boundary ON public.artist_managers AS RESTRICTIVE FOR DELETE TO public
USING (public.is_ceo_or_hq_admin() AND public.security_same_tenant(manager_id));

CREATE POLICY security_hardening_schedules_read ON public.schedules FOR SELECT TO authenticated
USING (public.security_schedule_access(artist_id, manager_id, created_by, is_secret, secret_level));
CREATE POLICY security_hardening_schedules_insert ON public.schedules FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND public.get_current_user_role() IN ('ceo','hq_admin','manager','indie_manager')
  AND public.security_schedule_access(artist_id, manager_id, created_by, is_secret, secret_level));
CREATE POLICY security_hardening_schedules_update ON public.schedules FOR UPDATE TO authenticated
USING (public.security_schedule_access(artist_id, manager_id, created_by, is_secret, secret_level))
WITH CHECK (public.security_schedule_access(artist_id, manager_id, created_by, is_secret, secret_level));
CREATE POLICY security_hardening_schedules_delete ON public.schedules FOR DELETE TO authenticated
USING ((public.is_ceo_or_hq_admin() AND public.security_schedule_scope(created_by, manager_id))
 OR public.security_personal_schedule(created_by, manager_id));
CREATE POLICY security_hardening_schedules_read_boundary ON public.schedules AS RESTRICTIVE FOR SELECT TO public
USING (public.security_schedule_access(artist_id, manager_id, created_by, is_secret, secret_level));
CREATE POLICY security_hardening_schedules_insert_boundary ON public.schedules AS RESTRICTIVE FOR INSERT TO public
WITH CHECK (created_by = auth.uid() AND public.get_current_user_role() IN ('ceo','hq_admin','manager','indie_manager')
 AND public.security_schedule_access(artist_id, manager_id, created_by, is_secret, secret_level));
CREATE POLICY security_hardening_schedules_update_boundary ON public.schedules AS RESTRICTIVE FOR UPDATE TO public
USING (public.security_schedule_access(artist_id, manager_id, created_by, is_secret, secret_level))
WITH CHECK (public.security_schedule_access(artist_id, manager_id, created_by, is_secret, secret_level));
CREATE POLICY security_hardening_schedules_delete_boundary ON public.schedules AS RESTRICTIVE FOR DELETE TO public
USING ((public.is_ceo_or_hq_admin() AND public.security_schedule_scope(created_by, manager_id))
 OR public.security_personal_schedule(created_by, manager_id));

-- Untargeted announcements are legacy GLOBAL broadcasts. Client writes require
-- a same-tenant individual recipient, as no company_id exists on this table.
CREATE POLICY security_hardening_announcements_read ON public.announcements FOR SELECT TO authenticated
USING (target_manager_id = auth.uid() OR (public.is_ceo_or_hq_admin() AND public.security_same_tenant(target_manager_id))
 OR (target_manager_id IS NULL AND (target_role = 'all' OR target_role = public.get_current_user_role())));
CREATE POLICY security_hardening_announcements_write ON public.announcements FOR ALL TO authenticated
USING (public.is_ceo_or_hq_admin() AND public.security_same_tenant(target_manager_id))
WITH CHECK (public.is_ceo_or_hq_admin() AND public.security_same_tenant(target_manager_id));
CREATE POLICY security_hardening_announcements_boundary ON public.announcements AS RESTRICTIVE FOR ALL TO public
USING (target_manager_id = auth.uid() OR (public.is_ceo_or_hq_admin() AND public.security_same_tenant(target_manager_id))
 OR (auth.uid() IS NOT NULL AND target_manager_id IS NULL AND (target_role = 'all' OR target_role = public.get_current_user_role())))
WITH CHECK (public.is_ceo_or_hq_admin() AND public.security_same_tenant(target_manager_id));
CREATE POLICY security_hardening_announcements_delete_boundary ON public.announcements AS RESTRICTIVE FOR DELETE TO public
USING (public.is_ceo_or_hq_admin() AND public.security_same_tenant(target_manager_id));

-- Narrow execution permissions; trigger functions need no direct RPC access.
REVOKE ALL ON FUNCTION public.is_ceo_or_hq_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_current_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.security_same_tenant(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.security_schedule_scope(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.security_personal_schedule(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.security_schedule_access(text, uuid, uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_ceo_or_hq_admin(), public.get_current_user_role(),
 public.security_same_tenant(uuid), public.security_schedule_scope(uuid, uuid),
 public.security_personal_schedule(uuid, uuid),
 public.security_schedule_access(text, uuid, uuid, boolean, text) TO authenticated;
REVOKE ALL ON FUNCTION public.security_guard_profile() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.security_guard_schedule() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

COMMIT;

-- Validation plan (NOT executed by this patch): use staging with representative
-- auth roles. Run migration twice; compare row counts/PKs. A manager's self role,
-- company_id or id update must fail (42501); forged signup role/company must yield
-- indie_manager/NULL. Workflow-only assigned public-schedule update must succeed;
-- changing manager/artist/secret/title/date/notes/created_by must fail for company
-- managers. Personal indie_manager own+self-assigned schedule full edit/delete
-- must succeed; reassignment, identity/creator edits and another user row must fail. Cross-company
-- profile/assignment/schedule reads and writes must be denied, including HQ.
-- Staff cannot access secret/confidential schedules or insert/delete schedules.
-- Verify trusted service_role provisioning and HQ same-tenant editing still work.
-- Legacy schedules with both creator/manager NULL are hidden, NOT deleted.
-- Audit global catalogs/broadcasts and existing elevated profiles before deployment.

-- ==============================================================================
-- 🚀 초기 기본 데이터 세팅 (Initial Seed Data)
-- ==============================================================================

-- 1. 기본 아티스트 데이터
INSERT INTO public.artists (id, name, type, members, color, emoji, status) VALUES
  ('art_1', '루나스 (LUNAS)', '아이돌/걸그룹', 4, '#ec4899', '✨', '활동중'),
  ('art_2', '에이펙스 (APEX)', '아이돌/보이그룹', 5, '#3b82f6', '⚡', '컴백준비'),
  ('art_3', '강서준', '배우', 1, '#8b5cf6', '🎬', '드라마촬영'),
  ('art_4', '이하나', '솔로가수', 1, '#10b981', '🎤', '앨범활동'),
  ('art_5', '차은호', '배우/MC', 1, '#f59e0b', '🌟', '예능고정')
ON CONFLICT (id) DO NOTHING;

-- 2. 기본 차량 데이터
INSERT INTO public.vehicles (id, name, type, capacity) VALUES
  ('veh_1', '카니발 하이리무진 1호차 (12가 3456)', '밴', 7),
  ('veh_2', '카니발 하이리무진 2호차 (34나 7890)', '밴', 7),
  ('veh_3', '스타리아 라운지 (56다 1234)', '밴', 9),
  ('veh_4', '제네시스 G90 (78라 5678)', '세단', 4),
  ('veh_5', '스프린터 1호차 (90마 9999)', '대형밴', 11)
ON CONFLICT (id) DO NOTHING;

