-- =====================================================================
-- 출시 전 시험용 자료 정리 (2026-11-15 기준)
--
-- 쓰는 곳: Supabase 대시보드 → SQL Editor → 붙여넣고 [Run]
-- 주의: 지운 자료는 되돌릴 수 없어요. 1번(확인)부터 하나씩 해 주세요.
--
-- 지금 서버에 있는 자료 (2026-11-15):
--   일정 22건 (그중 [테스트] 2건) · 대화 2건 · 경비 0건
--   아티스트 7명 · 차량 5대 · 위치 기록 1건 · 결제 0건
--   거점(샵/숙소/사옥) 6건 — 전부 [시험] 자료
-- =====================================================================


-- ── 1. 먼저 확인 (지우지 않음) ───────────────────────────────────────
-- 계정 목록. 이메일에 '.test@'가 들어간 5개가 시험용 계정이에요.
select email, name, role, created_at::date from public.profiles order by created_at;

-- [테스트] 일정 2건
select id, date, title, status from public.schedules where title like '%[테스트]%';

-- [시험] 거점 6건
select type, name, address from public.places where name like '[시험]%' order by type, name;


-- ── 2. [테스트] 일정 2건만 지우기 (가장 안전) ────────────────────────
delete from public.schedules where title like '%[테스트]%';


-- ── 2-1. [시험] 거점 지우기 ──────────────────────────────────────────
-- ※ 진짜 샵·숙소를 등록하신 뒤에 실행하세요. 이름 앞에 [시험] 이 붙은 것만 지웁니다.
delete from public.places where name like '[시험]%';


-- ── 3. 시험용 매니저 계정 5개 지우기 ────────────────────────────────
-- 지워지는 계정: 박진우 팀장, 최현석 매니저, 이지은 실장, 정다원 매니저, 김개인 매니저
-- 남는 계정: 공진문(대표), 김태현 본부장, khai1000@naver.com, ktj8824@gmail.com
--
-- ※ 계정을 지우면 슬롯이 비어서 실제 매니저를 넣을 수 있어요.
-- ※ 아래는 '로그인 계정'까지 지웁니다. 그 계정이 만든 일정은 남아요(만든 사람만 빈칸이 됨).
--    일정도 같이 지우려면 4번을 먼저 하세요.

delete from auth.users
where email in (
  'jw.park.test@kjm-ent.com',
  'hs.choi.test@kjm-ent.com',
  'je.lee.test@kjm-ent.com',
  'dw.jung.test@kjm-ent.com',
  'indie.test@kjm-ent.com'
);


-- ── 4. (고르기) 시험용 계정이 담당한 일정까지 지우기 ─────────────────
-- 3번보다 먼저 실행해야 해요. 지우기 전에 몇 건인지 꼭 확인하세요.
select count(*) from public.schedules
where manager_id in (select id from public.profiles where email like '%.test@%');

-- 위 숫자를 확인한 뒤에 실행
delete from public.schedules
where manager_id in (select id from public.profiles where email like '%.test@%');


-- ── 5. (고르기) 연습용 자료 전체 비우기 — 처음부터 시작할 때만 ───────
-- ※ 되돌릴 수 없어요. 회사 자료를 실제로 쓰고 계시면 실행하지 마세요.
-- ※ 계정(profiles, companies)은 남고, 안에 든 자료만 비웁니다.

-- delete from public.chat_messages;
-- delete from public.chat_reads;
-- delete from public.chat_rooms;
-- delete from public.schedules;
-- delete from public.expenses;
-- delete from public.location_logs;
-- delete from public.announcements;
-- delete from public.venue_notes;
-- delete from public.schedule_shares;
-- delete from public.artist_managers;
-- delete from public.artists;
-- delete from public.vehicles;


-- ── 6. 정리 뒤 확인 ─────────────────────────────────────────────────
select
  (select count(*) from public.profiles)      as 계정,
  (select count(*) from public.schedules)     as 일정,
  (select count(*) from public.artists)       as 아티스트,
  (select count(*) from public.vehicles)      as 차량,
  (select count(*) from public.chat_messages) as 대화;
