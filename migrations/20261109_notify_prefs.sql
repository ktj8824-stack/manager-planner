-- 본인 알림 설정 (본사: 지연 푸시 · 밤 9시 요약 푸시). 행이 없으면 둘 다 켜짐.
create table if not exists public.notify_prefs (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  hq_late boolean not null default true,
  hq_evening boolean not null default true,
  updated_at timestamptz not null default now()
);
alter table public.notify_prefs enable row level security;
drop policy if exists notify_prefs_own on public.notify_prefs;
create policy notify_prefs_own on public.notify_prefs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update on public.notify_prefs to authenticated;
