-- profiles 자가 보강
-- songs.created_by 가 profiles(id) 를 FK 로 참조하므로, 프로필이 없으면 곡 저장이
-- "songs_created_by_fkey" 위반으로 실패한다. 다음으로 방지한다:
--   1) 본인 프로필 INSERT 정책 → 앱에서 방어적 upsert 가능
--   2) 트리거 누락/이전 가입으로 프로필이 없는 기존 사용자 백필
-- 적용: supabase db push

-- 1) 본인 프로필 생성 허용
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

-- 2) 프로필이 없는 기존 사용자 백필 (display_name = 이메일 local-part)
insert into public.profiles (id, display_name)
select u.id, split_part(u.email, '@', 1)
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);
