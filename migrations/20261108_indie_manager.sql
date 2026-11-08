-- 개인 매니저(indie_manager): 본사 없이 혼자 쓰는 앱
-- 1) 자기 아티스트를 직접 등록 (artists.owner_id, 회사 없음)
-- 2) 무료는 아티스트 1명까지, 유료(월 2만원, payments plan='pro')는 여러 명
-- 3) 회사가 없는 개인 매니저도 결제 기록을 남길 수 있게 payments.company_id 를 비워 둘 수 있게

alter table public.payments alter column company_id drop not null;

alter table public.artists add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
create index if not exists artists_owner_idx on public.artists(owner_id) where owner_id is not null;

-- 개인 매니저 유료 기간 끝 (없으면 null)
create or replace function public.indie_pro_until(p_user uuid)
returns timestamptz language sql stable security definer set search_path to 'pg_catalog' as $$
  select max(period_end) from public.payments
  where user_id = p_user and plan = 'pro' and status = 'DONE';
$$;
revoke all on function public.indie_pro_until(uuid) from public, anon;
grant execute on function public.indie_pro_until(uuid) to authenticated, service_role;

create or replace function public.is_indie_manager()
returns boolean language sql stable security definer set search_path to 'pg_catalog' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'indie_manager' and p.company_id is null);
$$;

-- 회사 경계: 회사 아티스트는 같은 회사만, 개인 아티스트는 주인만
drop policy if exists tenant_artists_boundary on public.artists;
create policy tenant_artists_boundary on public.artists as restrictive for all
  using (auth.uid() is not null and (
    (company_id is not null and company_id = public.tenant_my_company())
    or (company_id is null and owner_id = auth.uid())))
  with check (public.is_ceo_or_hq_admin()
    or (company_id is null and owner_id = auth.uid() and public.is_indie_manager()));

drop policy if exists indie_artists_own on public.artists;
create policy indie_artists_own on public.artists as permissive for all
  using (company_id is null and owner_id = auth.uid() and public.is_indie_manager())
  with check (company_id is null and owner_id = auth.uid() and public.is_indie_manager());

-- 주인 고정 + 무료 1명 제한
-- security invoker: 트리거 안에서 current_user 가 실제 요청자로 남아야 함 (definer면 항상 postgres)
create or replace function public.artists_owner_guard()
returns trigger language plpgsql security invoker set search_path to 'pg_catalog' as $$
declare n int; pro timestamptz;
begin
  if current_user in ('postgres', 'supabase_admin', 'service_role') then return new; end if;
  if tg_op = 'INSERT' then
    if public.is_indie_manager() then
      new.owner_id := auth.uid();
      new.company_id := null;
      -- upsert(수정)도 INSERT 트리거를 거치므로, 이미 있는 내 아티스트는 제외
      select count(*) into n from public.artists where owner_id = auth.uid() and id <> new.id;
      pro := public.indie_pro_until(auth.uid());
      if n >= 1 and (pro is null or pro <= now()) then
        raise exception 'FREE_ARTIST_LIMIT' using errcode = 'P0001', hint = '무료는 아티스트 1명까지예요.';
      end if;
    else
      new.owner_id := null;
    end if;
  elsif new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id is server-managed' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists artists_owner_guard on public.artists;
create trigger artists_owner_guard before insert or update on public.artists
  for each row execute function public.artists_owner_guard();
