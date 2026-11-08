-- 경비 기록 (매니저 → 본사 정산)
--  - 매니저(회사·개인)가 주유·주차·통행료·식비 등을 영수증 사진과 함께 기록
--  - 본인 기록은 본인만 수정·삭제, 본사(대표·관리자)는 같은 회사 매니저 기록을 볼 수 있음
--  - 개인 매니저는 유료 기능 (무료 사용자는 서버에서 저장 막음)
--  - 영수증 사진: 비공개 저장소 expense-receipts, 경로 = {user_id}/{uuid}.jpg

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  schedule_id uuid references public.schedules(id) on delete set null,
  artist_id text references public.artists(id) on delete set null,
  date date not null,
  category text not null check (category in ('fuel', 'parking', 'toll', 'meal', 'transport', 'supplies', 'etc')),
  amount integer not null check (amount > 0 and amount <= 10000000),
  memo text check (char_length(memo) <= 300),
  receipt_path text check (char_length(receipt_path) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists expenses_user_date_idx on public.expenses(user_id, date desc);
create index if not exists expenses_company_date_idx on public.expenses(company_id, date desc) where company_id is not null;

alter table public.expenses enable row level security;

-- 주인·회사 고정 + 개인 매니저 무료 막기
create or replace function public.expenses_guard()
returns trigger language plpgsql security invoker set search_path to 'pg_catalog' as $$
declare pro timestamptz;
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then return new; end if;
  if tg_op = 'INSERT' then
    new.user_id := auth.uid();
    new.company_id := public.tenant_my_company();
    new.created_at := now();
    if public.is_indie_manager() then
      pro := public.indie_pro_until(auth.uid());
      if pro is null or pro <= now() then
        raise exception 'PAID_FEATURE' using errcode = 'P0001', hint = '개인 매니저 경비 기록은 유료 기능이에요.';
      end if;
    end if;
  else
    if new.user_id is distinct from old.user_id or new.company_id is distinct from old.company_id or new.created_at is distinct from old.created_at then
      raise exception 'expense owner is server-managed' using errcode = '42501';
    end if;
  end if;
  if new.receipt_path is not null and split_part(new.receipt_path, '/', 1) <> new.user_id::text then
    raise exception 'receipt path must be in own folder' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists expenses_guard on public.expenses;
create trigger expenses_guard before insert or update on public.expenses
  for each row execute function public.expenses_guard();

drop policy if exists expenses_read on public.expenses;
create policy expenses_read on public.expenses for select to authenticated
  using (user_id = auth.uid()
    or (company_id is not null and company_id = public.tenant_my_company() and public.is_ceo_or_hq_admin()));
drop policy if exists expenses_insert on public.expenses;
create policy expenses_insert on public.expenses for insert to authenticated
  with check (user_id = auth.uid());
drop policy if exists expenses_update on public.expenses;
create policy expenses_update on public.expenses for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists expenses_delete on public.expenses;
create policy expenses_delete on public.expenses for delete to authenticated
  using (user_id = auth.uid());

-- 영수증 사진 저장소 (비공개, 5MB, 사진만)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('expense-receipts', 'expense-receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists expense_receipts_insert on storage.objects;
create policy expense_receipts_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'expense-receipts' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists expense_receipts_delete on storage.objects;
create policy expense_receipts_delete on storage.objects for delete to authenticated
  using (bucket_id = 'expense-receipts' and (storage.foldername(name))[1] = auth.uid()::text);
-- 보기: 본인 폴더, 또는 같은 회사 본사가 볼 수 있는 경비에 붙은 영수증
drop policy if exists expense_receipts_read on storage.objects;
create policy expense_receipts_read on storage.objects for select to authenticated
  using (bucket_id = 'expense-receipts' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.expenses e where e.receipt_path = objects.name)));
