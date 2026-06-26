-- 추천인·평점 작성자 실명 비공개
-- 비관리자는 본인 프로필만 SELECT 가능 → 곡/평점에 임베드된 타인 display_name 은 NULL.
-- 관리자(public.is_admin())만 전체 프로필을 열람한다.
-- 화면 레이어(lib/data/songs.ts 의 anonymizeAuthor)와 함께 이중으로 적용된다.
-- 적용:  supabase db push

-- ============================================================
-- 관리자 판별 — JWT 이메일 기준.
-- lib/auth/admin.ts 의 ADMIN_EMAILS 와 반드시 동일하게 유지할 것.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce((auth.jwt() ->> 'email'), '') = 'aqazswsx@etribe.co.kr';
$$;

-- ============================================================
-- profiles SELECT 정책 교체: 전원 열람 → 본인 또는 관리자만
-- (auth 함수는 initplan 캐싱을 위해 subselect 로 감싼다)
-- ============================================================
drop policy if exists "profiles_select_auth" on public.profiles;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
  );
