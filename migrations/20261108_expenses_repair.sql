-- 경비 항목에 '정비·세차'(repair) 추가 — 개인 매니저 차량 관리용. 기존 기록은 그대로.
alter table public.expenses drop constraint if exists expenses_category_check;
alter table public.expenses add constraint expenses_category_check
  check (category = any (array['fuel','parking','toll','meal','transport','supplies','etc','repair']));
