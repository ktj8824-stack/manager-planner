-- =====================================================================
-- 승인이 필요한 서버 작업 모음 (2026-11-16) — 아직 실행 안 함
-- 대표님이 맥북 앞에 계실 때 Claude가 실행(승인 창 2번) 또는 SQL Editor에 붙여넣고 Run
-- =====================================================================


-- ── 1. 거점(샵·숙소·사옥): 회사 거점은 '등록한 사람'과 떼어 놓기 ──────────
-- 지금은 회사 거점에도 등록한 관리자(owner_id)가 묶여 있어서,
-- 그 관리자가 탈퇴하면 회사 거점까지 같이 지워짐 (places.owner_id 가 ON DELETE CASCADE).
-- 고친 뒤: 회사 거점 owner_id = 비움, 개인 매니저 거점만 owner_id = 본인 (탈퇴하면 개인 것만 지워짐)

create or replace function public.places_stamp()
returns trigger
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $$
begin
  if tg_op = 'INSERT' then
    new.company_id := public.tenant_my_company();
    new.owner_id   := case when new.company_id is null then auth.uid() else null end;
  else
    new.company_id := old.company_id;
    new.owner_id   := old.owner_id;
    new.updated_at := now();
  end if;
  return new;
end $$;

alter table public.places disable trigger places_stamp_trg;
update public.places set owner_id = null where company_id is not null and owner_id is not null;
alter table public.places enable trigger places_stamp_trg;


-- ── 2. 로드비서 답변 신고 (구글 플레이 생성형 AI 정책) ─────────────────
-- 앱의 로드비서 답변마다 '신고' 버튼 → 이 표에 저장, 운영자만 열람 (Table Editor > rp_ai_reports)
create table if not exists public.rp_ai_reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  reason      text not null default '' check (char_length(reason) <= 300),
  question    text not null default '' check (char_length(question) <= 1500),
  answer      text not null default '' check (char_length(answer) <= 4000),
  created_at  timestamptz not null default now()
);
alter table public.rp_ai_reports enable row level security;
drop policy if exists rp_ai_reports_insert on public.rp_ai_reports;
create policy rp_ai_reports_insert on public.rp_ai_reports for insert to authenticated
  with check (user_id = (select auth.uid()));
revoke all on public.rp_ai_reports from anon;
grant insert on public.rp_ai_reports to authenticated;
comment on table public.rp_ai_reports is '로드비서 AI 답변 신고 (운영자 검토용, 앱에서는 쓰기만 가능)';
