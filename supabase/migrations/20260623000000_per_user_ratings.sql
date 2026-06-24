-- 평점 시스템 개편: 사용자별 평점(반별점 0.5~5.0) + 한줄평 + 좋아요
-- 기존 "곡 1개 = 추천인 1명의 단일 평점" → "곡 = 작품, 모두가 각자 평가 → 평균"
-- 추가형/멱등 지향 마이그레이션. 적용: supabase db push
--
-- 주의: 레거시 컬럼(songs.rating / songs.description)은 이 마이그레이션에서
--       drop 하지 않는다(백업/롤백 창). NOT NULL/CHECK 만 제거해 신규 곡이
--       해당 컬럼을 비워도 insert 가능하게 한다. 실제 drop 은 검증 후
--       20260624000000_drop_legacy_song_columns.sql 에서 수행한다.

-- ============================================================
-- 1) song_ratings : 사용자별 평점 + 한줄평
--    songs 의 협업형(누구나 수정/삭제)과 달리 "본인 행만" 쓰기 가능.
-- ============================================================
create table if not exists public.song_ratings (
  id          uuid primary key default gen_random_uuid(),
  song_id     uuid not null references public.songs (id)    on delete cascade,
  -- profiles(id) 를 참조해 PostgREST 임베드(작성자 표시)를 가능케 함(songs 와 동일 패턴).
  user_id     uuid not null references public.profiles (id) on delete cascade,
  rating      numeric(2,1) not null,
  comment     text,
  is_spoiler  boolean not null default false,
  -- comment_likes 트리거가 유지하는 비정규화 좋아요 수
  like_count  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  constraint song_ratings_unique_user unique (song_id, user_id),
  -- 반별점: 0.5 단위, 0.5~5.0
  constraint song_ratings_rating_check
    check (rating >= 0.5 and rating <= 5.0 and (rating * 2) = floor(rating * 2)),
  constraint song_ratings_comment_len
    check (comment is null or char_length(comment) <= 1000)
);

-- 한줄평 최신순 / 인기순 / FK join 가속
create index if not exists song_ratings_song_created_idx
  on public.song_ratings (song_id, created_at desc);
create index if not exists song_ratings_song_likes_idx
  on public.song_ratings (song_id, like_count desc, created_at desc);
create index if not exists song_ratings_user_idx
  on public.song_ratings (user_id);

alter table public.song_ratings enable row level security;

drop policy if exists "song_ratings_select_auth" on public.song_ratings;
create policy "song_ratings_select_auth"
  on public.song_ratings for select
  to authenticated
  using (true);

drop policy if exists "song_ratings_insert_own" on public.song_ratings;
create policy "song_ratings_insert_own"
  on public.song_ratings for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "song_ratings_update_own" on public.song_ratings;
create policy "song_ratings_update_own"
  on public.song_ratings for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "song_ratings_delete_own" on public.song_ratings;
create policy "song_ratings_delete_own"
  on public.song_ratings for delete
  to authenticated
  using (user_id = (select auth.uid()));

drop trigger if exists trg_song_ratings_updated_at on public.song_ratings;
create trigger trg_song_ratings_updated_at
  before update on public.song_ratings
  for each row execute function public.set_updated_at();

-- ============================================================
-- 2) comment_likes : 한줄평(song_rating) 좋아요. (user, rating) 당 1개.
-- ============================================================
create table if not exists public.comment_likes (
  song_rating_id uuid not null references public.song_ratings (id) on delete cascade,
  user_id        uuid not null references public.profiles (id)     on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (song_rating_id, user_id)
);

create index if not exists comment_likes_user_idx on public.comment_likes (user_id);

alter table public.comment_likes enable row level security;

-- 노출 최소화: 본인 좋아요 행만 조회(집계는 song_ratings.like_count 로). 자기 좋아요 허용.
drop policy if exists "comment_likes_select_own" on public.comment_likes;
create policy "comment_likes_select_own"
  on public.comment_likes for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "comment_likes_insert_own" on public.comment_likes;
create policy "comment_likes_insert_own"
  on public.comment_likes for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "comment_likes_delete_own" on public.comment_likes;
create policy "comment_likes_delete_own"
  on public.comment_likes for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- ============================================================
-- 3) songs 비정규화 집계 컬럼 + 정렬 인덱스
-- ============================================================
alter table public.songs
  add column if not exists rating_avg   numeric(3,2),
  add column if not exists rating_count integer not null default 0;

-- 평점순: 평점 있는 곡 먼저(nulls last), 높은 순, 동점은 최신순
create index if not exists songs_rating_avg_idx
  on public.songs (rating_avg desc nulls last, created_at desc);
-- 인기순: 평가 많은 순
create index if not exists songs_rating_count_idx
  on public.songs (rating_count desc, created_at desc);

-- ============================================================
-- 4) 집계 유지 트리거
--    재계산(증분 델타 X) 방식 — 동시성/트리거 누락에 자가치유.
--    SECURITY DEFINER 필수: comment_likes 트리거는 "타인 소유" song_ratings 행을
--    갱신하므로 invoker 컨텍스트에선 RLS(update_own)에 막혀 0행이 된다.
-- ============================================================

-- 4a) song_ratings 변동 → songs.rating_avg / rating_count 재계산(해당 곡만)
create or replace function public.refresh_song_rating_aggregate()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  target_song_id uuid := coalesce(new.song_id, old.song_id);
begin
  update public.songs s
  set rating_avg   = agg.avg_rating,   -- 빈 집합이면 NULL
      rating_count = agg.cnt
  from (
    select round(avg(rating), 2) as avg_rating,
           count(*)              as cnt
    from public.song_ratings
    where song_id = target_song_id
  ) agg
  where s.id = target_song_id;

  -- UPDATE 가 song_id 를 옮기는 경우(현실적으론 없음) 옛 곡도 재계산
  if tg_op = 'UPDATE' and new.song_id is distinct from old.song_id then
    update public.songs s
    set rating_avg = agg.avg_rating, rating_count = agg.cnt
    from (
      select round(avg(rating), 2) as avg_rating, count(*) as cnt
      from public.song_ratings where song_id = old.song_id
    ) agg
    where s.id = old.song_id;
  end if;

  return null; -- AFTER 트리거
end;
$$;

-- like_count 변동은 평균과 무관하므로 update of rating, song_id 로 스코프(불필요 재계산 방지)
drop trigger if exists trg_song_ratings_aggregate on public.song_ratings;
create trigger trg_song_ratings_aggregate
  after insert or delete or update of rating, song_id on public.song_ratings
  for each row execute function public.refresh_song_rating_aggregate();

-- 4b) comment_likes 변동 → song_ratings.like_count 재계산(해당 한줄평만)
create or replace function public.refresh_comment_like_count()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  target_rating_id uuid := coalesce(new.song_rating_id, old.song_rating_id);
begin
  update public.song_ratings r
  set like_count = (
    select count(*) from public.comment_likes
    where song_rating_id = target_rating_id
  )
  where r.id = target_rating_id;
  return null;
end;
$$;

drop trigger if exists trg_comment_likes_count on public.comment_likes;
create trigger trg_comment_likes_count
  after insert or delete on public.comment_likes
  for each row execute function public.refresh_comment_like_count();

-- ============================================================
-- 5) RPC: 곡 + 작성자의 첫 평점을 한 트랜잭션에 원자적으로 생성.
--    SECURITY INVOKER(기본): 호출자 RLS(created_by=auth.uid, user_id=auth.uid)가
--    그대로 강제됨. created_by/user_id 를 서버에서 auth.uid() 로 세팅(위조 방지).
--    프로필 self-heal 은 서버 액션이 호출 직전 수행(email 보유).
-- ============================================================
create or replace function public.create_song_with_rating(
  p_title      text,
  p_artist     text,
  p_genre      text,
  p_country    text,
  p_otaku_type text,
  p_rating     numeric,
  p_comment    text,
  p_is_spoiler boolean
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_song_id uuid;
begin
  if v_uid is null then
    raise exception 'auth required' using errcode = '28000';
  end if;

  insert into public.songs (title, artist, genre, country, otaku_type, created_by)
  values (p_title, p_artist, p_genre, p_country, p_otaku_type, v_uid)
  returning id into v_song_id;

  insert into public.song_ratings (song_id, user_id, rating, comment, is_spoiler)
  values (v_song_id, v_uid, p_rating, nullif(btrim(p_comment), ''), coalesce(p_is_spoiler, false));

  return v_song_id;
end;
$$;

grant execute on function public.create_song_with_rating(
  text, text, text, text, text, numeric, text, boolean
) to authenticated;

-- ============================================================
-- 6) 백필: 기존 곡마다 작성자의 첫 평점 행 생성
--    rating  = 기존 songs.rating (smallint 1~5 → 반별점 호환: 정수는 0.5 스텝 통과)
--    comment = 기존 songs.description (작성자의 추천 사유)
--    created_by 가 null 인 곡(탈퇴 작성자)은 건너뜀 → rating_count 0 / avg NULL 유지
--    on conflict 로 재실행 안전.
-- ============================================================
-- 멱등: 레거시 컬럼(rating)이 아직 있을 때만 백필. 이미 이전·드롭된 환경에서는 skip.
-- (plpgsql 은 분기 실행 시점에 SQL 을 계획하므로, 컬럼이 없으면 INSERT 가 파싱조차 안 돼 안전.)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'songs' and column_name = 'rating'
  ) then
    insert into public.song_ratings (song_id, user_id, rating, comment, created_at, updated_at)
    select s.id,
           s.created_by,
           s.rating::numeric(2,1),
           nullif(btrim(s.description), ''),
           s.created_at,
           s.updated_at
    from public.songs s
    where s.created_by is not null
    on conflict (song_id, user_id) do nothing;
  end if;
end $$;

-- ============================================================
-- 7) 권위적 집계 재계산(전체) — 트리거 결과와 무관하게 결정론적 baseline 확정
-- ============================================================
update public.songs s
set rating_count = coalesce(agg.cnt, 0),
    rating_avg   = agg.avg_rating
from (
  select song_id,
         round(avg(rating), 2) as avg_rating,
         count(*)              as cnt
  from public.song_ratings
  group by song_id
) agg
where s.id = agg.song_id;

-- ============================================================
-- 8) 레거시 컬럼은 보존하되 신규 곡 insert 를 막지 않도록 NOT NULL/CHECK 제거.
--    (실제 DROP COLUMN 은 검증 후 후속 마이그레이션에서)
-- ============================================================
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'songs' and column_name = 'rating'
  ) then
    alter table public.songs drop constraint if exists songs_rating_check;
    alter table public.songs alter column rating drop not null;
  end if;
end $$;
