-- 경비 규칙 보강 (일일 점검 11-09)
--  1) 본사 관리자는 자기 경비를 직접 승인·반려할 수 없음 (대표는 예외)
--  2) 승인된 경비는 매니저가 지울 수 없음 (정산 합계가 말없이 바뀌지 않게)
create or replace function public.expense_review(p_id uuid, p_status text, p_note text default null)
returns void language plpgsql security definer set search_path = pg_catalog as $$
declare c uuid; u uuid;
begin
  if p_status not in ('pending', 'approved', 'rejected') then raise exception 'bad status' using errcode = '22023'; end if;
  if not public.is_ceo_or_hq_admin() then raise exception 'not allowed' using errcode = '42501'; end if;
  select company_id, user_id into c, u from public.expenses where id = p_id;
  if c is null or c is distinct from public.tenant_my_company() then raise exception 'not allowed' using errcode = '42501'; end if;
  if u = auth.uid() and not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'ceo') then
    raise exception 'SELF_REVIEW' using errcode = '42501', hint = '내 경비는 대표가 승인해요.';
  end if;
  update public.expenses set status = p_status, review_note = nullif(left(coalesce(p_note, ''), 200), ''),
    reviewed_by = case when p_status = 'pending' then null else auth.uid() end,
    reviewed_at = case when p_status = 'pending' then null else now() end
  where id = p_id;
end $$;

alter policy expenses_delete on public.expenses using (user_id = auth.uid() and status <> 'approved');
