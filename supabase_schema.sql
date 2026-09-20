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
  role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('ceo', 'hq_admin', 'manager', 'staff', 'indie_manager')),
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

-- ==============================================================================
-- 🔐 Row Level Security (RLS) 보안 권한 정책 설정
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.artist_managers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;

-- 헬퍼 함수 1: 현재 사용자가 본사 최고관리자/CEO인지 확인
CREATE OR REPLACE FUNCTION public.is_ceo_or_hq_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('ceo', 'hq_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 헬퍼 함수 2: 현재 사용자의 직책(Role) 가져오기
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(v_role, 'manager');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1) Profiles 정책
DROP POLICY IF EXISTS "모든 인증된 사용자는 프로필 목록 조회 가능" ON public.profiles;
CREATE POLICY "모든 인증된 사용자는 프로필 목록 조회 가능" ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "본인 프로필 수정 가능" ON public.profiles;
CREATE POLICY "본인 프로필 수정 가능" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "본사 관리자는 모든 프로필 관리 가능" ON public.profiles;
CREATE POLICY "본사 관리자는 모든 프로필 관리 가능" ON public.profiles
  FOR ALL TO authenticated USING (public.is_ceo_or_hq_admin());

-- 2) Artists 정책
DROP POLICY IF EXISTS "모든 사용자는 아티스트 조회 가능" ON public.artists;
CREATE POLICY "모든 사용자는 아티스트 조회 가능" ON public.artists
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "본사 관리자는 아티스트 등록/수정/삭제 가능" ON public.artists;
CREATE POLICY "본사 관리자는 아티스트 등록/수정/삭제 가능" ON public.artists
  FOR ALL TO authenticated USING (public.is_ceo_or_hq_admin());

-- 3) Artist_Managers 정책
DROP POLICY IF EXISTS "모든 사용자는 배정 내역 조회 가능" ON public.artist_managers;
CREATE POLICY "모든 사용자는 배정 내역 조회 가능" ON public.artist_managers
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "본사 관리자는 배정 등록/수정/삭제 가능" ON public.artist_managers;
CREATE POLICY "본사 관리자는 배정 등록/수정/삭제 가능" ON public.artist_managers
  FOR ALL TO authenticated USING (public.is_ceo_or_hq_admin());

-- 4) Vehicles 정책
DROP POLICY IF EXISTS "모든 사용자는 차량 목록 조회 가능" ON public.vehicles;
CREATE POLICY "모든 사용자는 차량 목록 조회 가능" ON public.vehicles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "본사 관리자는 차량 등록/수정/삭제 가능" ON public.vehicles;
CREATE POLICY "본사 관리자는 차량 등록/수정/삭제 가능" ON public.vehicles
  FOR ALL TO authenticated USING (public.is_ceo_or_hq_admin());

-- 5) Schedules 정책 (🔒 비공개 스케줄 및 4대 역할 정밀 통제)
DROP POLICY IF EXISTS "본사 관리자 및 CEO는 모든 스케줄 관리 가능" ON public.schedules;
CREATE POLICY "본사 관리자 및 CEO는 모든 스케줄 관리 가능" ON public.schedules
  FOR ALL TO authenticated USING (public.is_ceo_or_hq_admin());

DROP POLICY IF EXISTS "매니저 및 스태프 스케줄 조회 권한" ON public.schedules;
CREATE POLICY "매니저 및 스태프 스케줄 조회 권한" ON public.schedules
  FOR SELECT TO authenticated USING (
    -- 본사 관리자/CEO는 통과
    public.is_ceo_or_hq_admin()
    OR (
      -- 일반 매니저/스태프: 담당 아티스트 스케줄에 한함
      (
        artist_id IN (
          SELECT artist_id FROM public.artist_managers WHERE manager_id = auth.uid()
        ) OR manager_id = auth.uid()
      )
      AND (
        -- 비공개(is_secret) 스케줄인 경우, 직접 배정된 매니저 본인만 열람 가능 (외부 스태프는 DB 레벨 차단)
        is_secret = false
        OR (is_secret = true AND manager_id = auth.uid() AND public.get_current_user_role() = 'manager')
      )
    )
  );

DROP POLICY IF EXISTS "매니저는 스케줄 등록 가능" ON public.schedules;
CREATE POLICY "매니저는 스케줄 등록 가능" ON public.schedules
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() IS NOT NULL
  );

DROP POLICY IF EXISTS "매니저는 담당 스케줄 상태 및 타임스탬프 수정 가능" ON public.schedules;
CREATE POLICY "매니저는 담당 스케줄 상태 및 타임스탬프 수정 가능" ON public.schedules
  FOR UPDATE TO authenticated USING (
    public.is_ceo_or_hq_admin()
    OR (
      artist_id IN (
        SELECT artist_id FROM public.artist_managers WHERE manager_id = auth.uid()
      ) OR manager_id = auth.uid()
    )
  );

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

-- ==============================================================================
-- 👤 신규 유저 가입 시 자동으로 profiles 레코드를 생성하는 트리거
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, company_id, auth_provider, phone, color)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'indie_manager'),
    (NEW.raw_user_meta_data->>'company_id')::UUID,
    COALESCE(NEW.raw_user_meta_data->>'auth_provider', 'email'),
    COALESCE(NEW.raw_user_meta_data->>'phone', '010-0000-0000'),
    '#4f46e5'
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      name = COALESCE(NEW.raw_user_meta_data->>'name', EXCLUDED.name),
      role = COALESCE(NEW.raw_user_meta_data->>'role', profiles.role),
      company_id = (NEW.raw_user_meta_data->>'company_id')::UUID,
      auth_provider = COALESCE(NEW.raw_user_meta_data->>'auth_provider', profiles.auth_provider);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 바인딩
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
