-- 승인된 경비 고치기 (대표 결정 11-11: 2번)
--  · 매니저는 승인된 경비도 고칠 수 있음. 승인 상태는 그대로 두고 '승인 후 수정됨' 표시
--  · 승인 때 값(날짜·분류·금액·메모)을 approved_snapshot 에 남겨 본사가 무엇이 바뀌었는지 봄
--  · 본사가 다시 승인(또는 반려)하면 표시가 지워짐
--  · 승인된 경비는 여전히 지울 수 없음 (expenses_delete 정책 그대로)
alter table public.expenses add column if not exists edited_after_approval_at timestamptz;
alter table public.expenses add column if not exists approved_snapshot jsonb;

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

  if tg_op = 'UPDATE' and old.status = 'approved' then
    -- 승인 상태·검토 기록은 그대로 (매니저가 바꿀 수 없음)
    new.status := old.status; new.review_note := old.review_note; new.reviewed_by := old.reviewed_by; new.reviewed_at := old.reviewed_at;
    if (new.date, new.category, new.amount, coalesce(new.memo, ''), coalesce(new.receipt_path, ''), new.schedule_id, coalesce(new.artist_id, ''))
       is not distinct from
       (old.date, old.category, old.amount, coalesce(old.memo, ''), coalesce(old.receipt_path, ''), old.schedule_id, coalesce(old.artist_id, '')) then
      -- 아무것도 안 바뀜: 표시도 그대로
      new.edited_after_approval_at := old.edited_after_approval_at; new.approved_snapshot := old.approved_snapshot;
      new.updated_at := old.updated_at;
      return new;
    end if;
    new.approved_snapshot := coalesce(old.approved_snapshot,
      jsonb_build_object('date', old.date, 'category', old.category, 'amount', old.amount, 'memo', old.memo));
    new.edited_after_approval_at := now();
  else
    -- 새로 쓰거나 승인 전 경비를 고치면 '승인 대기'
    new.status := 'pending'; new.review_note := null; new.reviewed_by := null; new.reviewed_at := null;
    new.edited_after_approval_at := null; new.approved_snapshot := null;
  end if;
  new.updated_at := now();
  return new;
end $$;

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
    reviewed_at = case when p_status = 'pending' then null else now() end,
    edited_after_approval_at = null, approved_snapshot = null   -- 본사가 다시 봤으니 '수정됨' 표시 지움
  where id = p_id;
end $$;
revoke all on function public.expense_review(uuid, text, text) from public, anon;
grant execute on function public.expense_review(uuid, text, text) to authenticated;
