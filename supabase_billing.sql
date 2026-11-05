-- 결제 (2026-11-05 적용됨): 금액·승인·요금제 반영은 payments 함수(서버)만 함
alter table public.companies add column if not exists plan text not null default 'free',
  add column if not exists paid_until timestamptz,
  add column if not exists plan_updated_at timestamptz;
create table if not exists public.payments (
  order_id text primary key, company_id uuid not null references public.companies(id), user_id uuid not null,
  plan text not null check (plan in ('standard','pro')), add_slots int not null default 0 check (add_slots between 0 and 100),
  amount int not null check (amount > 0), order_name text not null, status text not null default 'READY',
  mode text not null default 'test', payment_key text, method text, approved_at timestamptz, period_end timestamptz,
  fail_reason text, created_at timestamptz not null default now());
alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;
grant select on public.payments to authenticated;
create policy payments_read on public.payments for select to authenticated using (
  user_id = auth.uid() or exists (select 1 from public.profiles p where p.id = auth.uid() and p.company_id = payments.company_id and p.role in ('ceo','hq_admin')));
-- 실제 결제 시작: 토스 가맹 후 Supabase Secrets 에 TOSS_SECRET_KEY(live_sk_...) 저장 + payment.html 의 TOSS_CLIENT_KEY 를 live 클라이언트 키로 교체
