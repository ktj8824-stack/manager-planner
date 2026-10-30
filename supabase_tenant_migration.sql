-- 회사별 아티스트·차량 분리 (다른 회사 데이터가 보이거나 수정되지 않게 함)
-- 여러 번 실행해도 안전합니다. Supabase SQL Editor에 통째로 붙여넣고 Run 하세요.
BEGIN;

-- 내 회사 번호 (이미 있으면 그대로 덮어씀)
CREATE OR REPLACE FUNCTION public.tenant_my_company()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT p.company_id FROM public.profiles p WHERE p.id = auth.uid(); $$;
REVOKE ALL ON FUNCTION public.tenant_my_company() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tenant_my_company() TO authenticated;

ALTER TABLE public.artists  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS artists_company_idx  ON public.artists(company_id);
CREATE INDEX IF NOT EXISTS vehicles_company_idx ON public.vehicles(company_id);

-- 기존 자료(주인 표시가 없는 것)에 회사를 붙인다. 근거 순서:
--  1) 아티스트: 담당 배정된 매니저의 회사  2) 그 아티스트 스케줄을 만든 사람의 회사
--  3) 그래도 모르면(차량 등) 소속 계정이 가장 많은 회사
-- 실행 후 맨 아래 확인 표를 꼭 보세요. 잘못 붙은 것이 있으면 알려주세요.
DO $$
DECLARE c uuid;
BEGIN
  UPDATE public.artists a SET company_id = x.cid FROM (
    SELECT am.artist_id, (array_agg(p.company_id ORDER BY p.company_id))[1] AS cid
      FROM public.artist_managers am JOIN public.profiles p ON p.id = am.manager_id
     WHERE p.company_id IS NOT NULL GROUP BY am.artist_id
  ) x WHERE a.id = x.artist_id AND a.company_id IS NULL;

  UPDATE public.artists a SET company_id = x.cid FROM (
    SELECT s.artist_id, (array_agg(p.company_id ORDER BY p.company_id))[1] AS cid
      FROM public.schedules s JOIN public.profiles p ON p.id = s.created_by
     WHERE p.company_id IS NOT NULL GROUP BY s.artist_id
  ) x WHERE a.id = x.artist_id AND a.company_id IS NULL;

  SELECT company_id INTO c FROM public.profiles WHERE company_id IS NOT NULL
   GROUP BY company_id ORDER BY count(*) DESC, company_id LIMIT 1;
  IF c IS NOT NULL THEN
    UPDATE public.artists  SET company_id = c WHERE company_id IS NULL;
    UPDATE public.vehicles SET company_id = c WHERE company_id IS NULL;
  END IF;
END $$;

-- 등록하는 사람의 회사 번호를 서버가 직접 채우고, 나중에 바꾸지 못하게 한다
CREATE OR REPLACE FUNCTION public.tenant_stamp_company()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.company_id := public.tenant_my_company();
  ELSIF OLD.company_id IS NOT NULL AND NEW.company_id IS DISTINCT FROM OLD.company_id THEN
    RAISE EXCEPTION 'company_id is server-managed' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.tenant_stamp_company() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS artists_stamp_company ON public.artists;
CREATE TRIGGER artists_stamp_company BEFORE INSERT OR UPDATE ON public.artists
  FOR EACH ROW EXECUTE FUNCTION public.tenant_stamp_company();
DROP TRIGGER IF EXISTS vehicles_stamp_company ON public.vehicles;
CREATE TRIGGER vehicles_stamp_company BEFORE INSERT OR UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.tenant_stamp_company();

-- 기존 정책 교체: 같은 회사만 조회, 같은 회사 본사 관리자만 등록/수정/삭제
DROP POLICY IF EXISTS security_hardening_artists_read ON public.artists;
DROP POLICY IF EXISTS security_hardening_artists_write ON public.artists;
DROP POLICY IF EXISTS security_hardening_artists_boundary ON public.artists;
DROP POLICY IF EXISTS security_hardening_artists_delete_boundary ON public.artists;
DROP POLICY IF EXISTS security_hardening_vehicles_read ON public.vehicles;
DROP POLICY IF EXISTS security_hardening_vehicles_write ON public.vehicles;
DROP POLICY IF EXISTS security_hardening_vehicles_boundary ON public.vehicles;
DROP POLICY IF EXISTS security_hardening_vehicles_delete_boundary ON public.vehicles;
DROP POLICY IF EXISTS tenant_artists_read ON public.artists;
DROP POLICY IF EXISTS tenant_artists_write ON public.artists;
DROP POLICY IF EXISTS tenant_artists_boundary ON public.artists;
DROP POLICY IF EXISTS tenant_vehicles_read ON public.vehicles;
DROP POLICY IF EXISTS tenant_vehicles_write ON public.vehicles;
DROP POLICY IF EXISTS tenant_vehicles_boundary ON public.vehicles;

CREATE POLICY tenant_artists_read ON public.artists FOR SELECT TO authenticated
  USING (company_id IS NOT NULL AND company_id = public.tenant_my_company());
CREATE POLICY tenant_artists_write ON public.artists FOR ALL TO authenticated
  USING (public.is_ceo_or_hq_admin() AND company_id = public.tenant_my_company())
  WITH CHECK (public.is_ceo_or_hq_admin());
CREATE POLICY tenant_artists_boundary ON public.artists AS RESTRICTIVE FOR ALL TO public
  USING (auth.uid() IS NOT NULL AND company_id IS NOT DISTINCT FROM public.tenant_my_company())
  WITH CHECK (public.is_ceo_or_hq_admin());

CREATE POLICY tenant_vehicles_read ON public.vehicles FOR SELECT TO authenticated
  USING (company_id IS NOT NULL AND company_id = public.tenant_my_company());
CREATE POLICY tenant_vehicles_write ON public.vehicles FOR ALL TO authenticated
  USING (public.is_ceo_or_hq_admin() AND company_id = public.tenant_my_company())
  WITH CHECK (public.is_ceo_or_hq_admin());
CREATE POLICY tenant_vehicles_boundary ON public.vehicles AS RESTRICTIVE FOR ALL TO public
  USING (auth.uid() IS NOT NULL AND company_id IS NOT DISTINCT FROM public.tenant_my_company())
  WITH CHECK (public.is_ceo_or_hq_admin());

-- 담당 배정(artist_managers): 같은 회사 아티스트와 같은 회사 매니저끼리만
DROP POLICY IF EXISTS security_hardening_assignments_write ON public.artist_managers;
DROP POLICY IF EXISTS security_hardening_assignments_boundary ON public.artist_managers;
DROP POLICY IF EXISTS tenant_assignments_write ON public.artist_managers;
DROP POLICY IF EXISTS tenant_assignments_boundary ON public.artist_managers;
CREATE OR REPLACE FUNCTION public.tenant_artist_is_mine(p_artist text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT EXISTS (SELECT 1 FROM public.artists a
  WHERE a.id = p_artist AND a.company_id = public.tenant_my_company()); $$;
REVOKE ALL ON FUNCTION public.tenant_artist_is_mine(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.tenant_artist_is_mine(text) TO authenticated;

CREATE POLICY tenant_assignments_write ON public.artist_managers FOR ALL TO authenticated
  USING (public.is_ceo_or_hq_admin() AND public.security_same_tenant(manager_id))
  WITH CHECK (public.is_ceo_or_hq_admin() AND public.security_same_tenant(manager_id)
              AND public.tenant_artist_is_mine(artist_id));
CREATE POLICY tenant_assignments_boundary ON public.artist_managers AS RESTRICTIVE FOR ALL TO public
  USING (manager_id = auth.uid() OR (public.is_ceo_or_hq_admin() AND public.security_same_tenant(manager_id)))
  WITH CHECK (public.is_ceo_or_hq_admin() AND public.security_same_tenant(manager_id)
              AND public.tenant_artist_is_mine(artist_id));

COMMIT;

-- 확인용 (실행 후 결과가 회사별로 맞는지 보세요; company 가 비어 있는 줄이 있으면 알려주세요)
SELECT 'artists' AS 표, c.name AS 회사, count(*) AS 개수 FROM public.artists a LEFT JOIN public.companies c ON c.id = a.company_id GROUP BY c.name
UNION ALL
SELECT 'vehicles', c.name, count(*) FROM public.vehicles v LEFT JOIN public.companies c ON c.id = v.company_id GROUP BY c.name;
