-- 경비 승인·반려 (본사). 매니저가 고치면 다시 '승인 대기'로.
alter table public.expenses add column if not exists status text not null default 'pending';
alter table public.expenses add column if not exists review_note text;
alter table public.expenses add column if not exists reviewed_by uuid;
alter table public.expenses add column if not exists reviewed_at timestamptz;
do $$ begin
  alter table public.expenses add constraint expenses_status_check check (status in ('pending','approved','rejected'));
exception when duplicate_object then null; end $$;
do $$ begin
  alter table public.expenses add constraint expenses_review_note_check check (char_length(review_note) <= 200);
exception when duplicate_object then null; end $$;

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
  -- 승인 상태는 본사 승인 함수만 바꿈. 매니저가 새로 쓰거나 고치면 '승인 대기'
  new.status := 'pending'; new.review_note := null; new.reviewed_by := null; new.reviewed_at := null;
  if new.receipt_path is not null and split_part(new.receipt_path, '/', 1) <> new.user_id::text then
    raise exception 'receipt path must be in own folder' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;

create or replace function public.expense_review(p_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path to 'pg_catalog' as $$
declare c uuid;
begin
  if p_status not in ('pending', 'approved', 'rejected') then raise exception 'bad status' using errcode = '22023'; end if;
  if not public.is_ceo_or_hq_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  select company_id into c from public.expenses where id = p_id;
  if c is null or c is distinct from public.tenant_my_company() then raise exception 'not allowed' using errcode = '42501'; end if;
  update public.expenses set status = p_status, review_note = nullif(left(coalesce(p_note, ''), 200), ''),
    reviewed_by = case when p_status = 'pending' then null else auth.uid() end,
    reviewed_at = case when p_status = 'pending' then null else now() end
  where id = p_id;
end $$;
revoke all on function public.expense_review(uuid, text, text) from public, anon;
grant execute on function public.expense_review(uuid, text, text) to authenticated;
