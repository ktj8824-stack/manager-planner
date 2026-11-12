-- 승인 후 수정 표시 보강 (일일 점검 11-12)
--  · 승인 때 값에 영수증·연결 일정·아티스트도 남김 → 본사가 무엇이 바뀌었는지 항목별로 봄
--  · 승인 때 값으로 모두 되돌리면 '승인 후 수정됨' 표시를 지움
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
      jsonb_build_object('date', old.date, 'category', old.category, 'amount', old.amount, 'memo', old.memo,
                         'receipt_path', old.receipt_path, 'schedule_id', old.schedule_id, 'artist_id', old.artist_id));
    new.edited_after_approval_at := now();
    -- 승인 때 값으로 모두 되돌렸으면 '수정됨' 표시를 지움 (영수증·일정까지 기록된 경우만 비교)
    if new.approved_snapshot ? 'receipt_path'
       and (new.date::text, new.category, new.amount, coalesce(new.memo, ''), coalesce(new.receipt_path, ''), coalesce(new.schedule_id::text, ''), coalesce(new.artist_id, ''))
           is not distinct from
           (new.approved_snapshot->>'date', new.approved_snapshot->>'category', (new.approved_snapshot->>'amount')::int, coalesce(new.approved_snapshot->>'memo', ''),
            coalesce(new.approved_snapshot->>'receipt_path', ''), coalesce(new.approved_snapshot->>'schedule_id', ''), coalesce(new.approved_snapshot->>'artist_id', '')) then
      new.edited_after_approval_at := null; new.approved_snapshot := null;
    end if;
  else
    -- 새로 쓰거나 승인 전 경비를 고치면 '승인 대기'
    new.status := 'pending'; new.review_note := null; new.reviewed_by := null; new.reviewed_at := null;
    new.edited_after_approval_at := null; new.approved_snapshot := null;
  end if;
  new.updated_at := now();
  return new;
end $$;
