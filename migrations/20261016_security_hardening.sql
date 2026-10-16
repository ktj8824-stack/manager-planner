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
