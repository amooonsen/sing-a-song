-- sing-a-song 초기 스키마
-- 공용 노래 추천 리스트: 로그인 사용자 전원이 CRUD 가능(협업형)
-- 적용:  supabase link --project-ref <ref>  &&  supabase db push

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- ============================================================
-- profiles : 가입 시 자동 생성, display_name = 이메일 local-part
-- ============================================================
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_auth"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- ============================================================
-- songs : 공용 협업 리스트
-- ============================================================
create table public.songs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  artist      text not null,
  genre       text not null,
  description text,
  rating      smallint not null,
  -- created_by 는 default auth.uid() 로 서버에서 자동 세팅(클라이언트 위조 방지),
  -- profiles(id) 를 참조해 PostgREST 임베드(작성자 표시)를 가능케 함.
  -- 사용자 삭제 시 NULL 로 두어 곡은 보존(카드에서는 '탈퇴한 사용자'로 표시)
  created_by  uuid default auth.uid() references public.profiles (id) on delete set null,
  updated_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint songs_rating_check check (rating between 1 and 5),
  constraint songs_genre_check check (
    genre in ('발라드','댄스','힙합','R&B','록','인디','재즈','클래식','트로트','OST','K-팝','팝','애매함')
  ),
  constraint songs_title_len  check (char_length(title)  between 1 and 200),
  constraint songs_artist_len check (char_length(artist) between 1 and 100),
  constraint songs_desc_len   check (description is null or char_length(description) <= 1000)
);

-- 기본 정렬(등록일 내림차순)
create index songs_created_at_desc_idx on public.songs (created_at desc);
-- 검색: 제목/가수 대소문자 무시 ILIKE 가속 (컬럼별 trigram GIN → PostgREST .or 와 호환)
create index songs_title_trgm_idx  on public.songs using gin (title  gin_trgm_ops);
create index songs_artist_trgm_idx on public.songs using gin (artist gin_trgm_ops);

alter table public.songs enable row level security;

create policy "songs_select_auth"
  on public.songs for select
  to authenticated
  using (true);

-- INSERT: created_by 가 본인이어야만 허용(위조 방지)
create policy "songs_insert_auth"
  on public.songs for insert
  to authenticated
  with check (created_by = (select auth.uid()));

-- UPDATE / DELETE: 로그인 사용자라면 누구나(협업형)
create policy "songs_update_auth"
  on public.songs for update
  to authenticated
  using (true)
  with check (true);

create policy "songs_delete_auth"
  on public.songs for delete
  to authenticated
  using (true);

-- ============================================================
-- Triggers
-- ============================================================

-- updated_at 자동 갱신 (updated_by 는 서버 액션이 getUser().id 로 세팅)
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_songs_updated_at
  before update on public.songs
  for each row execute function public.set_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;

grant usage on schema public to supabase_auth_admin;
grant insert on public.profiles to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- (선택) 개발용 시드: 로그인 후 앱에서 등록하는 것을 권장.
-- created_by 가 auth.uid() 기반이라 SQL 직접 insert 시에는 명시적 uuid 필요.
-- ============================================================
