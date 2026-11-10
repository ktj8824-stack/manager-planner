-- 이용 중 자리 추가(일할 계산) 결제 구분 (2026-11-10)
--   kind = 'month'   : 한 달 요금 (결제일이 한 달 뒤로 밀림)
--   kind = 'prorate' : 이용 중에 자리를 늘린 만큼만 다음 결제일까지 일할 결제 (결제일 그대로)
--   prev_slots       : 주문을 만들 때의 추가 자리 수 (그 사이 바뀌었으면 결제 승인 전에 멈춤)
alter table public.payments add column if not exists kind text not null default 'month';
alter table public.payments drop constraint if exists payments_kind_check;
alter table public.payments add constraint payments_kind_check check (kind in ('month', 'prorate'));
alter table public.payments add column if not exists prev_slots int not null default 0;

-- 이용 중 자리 줄이기 예약: 다음 결제일부터 이 추가 자리 수로 결제 (null = 예약 없음)
alter table public.companies add column if not exists next_extra_slots int check (next_extra_slots is null or next_extra_slots between 0 and 100);
