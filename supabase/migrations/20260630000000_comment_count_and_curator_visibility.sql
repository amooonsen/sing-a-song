-- #1 곡별 한줄평 수 비정규화 + #6 곡 등록자 실명 공개
-- 적용: supabase db push  &&  pnpm gen:types

-- ============================================================
-- A) #1 곡별 한줄평(코멘트) 수 비정규화 — rating_count 패턴과 동일하게 트리거로 유지.
--    리스트/카드에서 런타임 집계 쿼리 없이 표시하기 위함.
-- ============================================================
alter table public.songs
  add column if not exists comment_count integer not null default 0;

-- 트리거 함수 교체: rating_avg / rating_count + comment_count 동시 재계산(해당 곡만).
-- (기존 20260623000000 의 함수를 확장 — 코멘트가 있는 평가만 카운트)
create or replace function public.refresh_song_rating_aggregate()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  target_song_id uuid := coalesce(new.song_id, old.song_id);
begin
  update public.songs s
  set rating_avg    = agg.avg_rating,   -- 빈 집합이면 NULL
      rating_count  = agg.cnt,
      comment_count = agg.comment_cnt
  from (
    select round(avg(rating), 2)                                                  as avg_rating,
           count(*)                                                               as cnt,
           count(*) filter (where comment is not null and btrim(comment) <> '')   as comment_cnt
    from public.song_ratings
    where song_id = target_song_id
  ) agg
  where s.id = target_song_id;

  -- UPDATE 가 song_id 를 옮기는 경우(현실적으론 없음) 옛 곡도 재계산
  if tg_op = 'UPDATE' and new.song_id is distinct from old.song_id then
    update public.songs s
    set rating_avg    = agg.avg_rating,
        rating_count  = agg.cnt,
        comment_count = agg.comment_cnt
    from (
      select round(avg(rating), 2)                                                as avg_rating,
             count(*)                                                             as cnt,
             count(*) filter (where comment is not null and btrim(comment) <> '') as comment_cnt
      from public.song_ratings
      where song_id = old.song_id
    ) agg
    where s.id = old.song_id;
  end if;

  return null; -- AFTER 트리거
end;
$$;

-- 코멘트만 수정해도 comment_count 가 갱신되도록 트리거 스코프에 comment 추가
-- (기존: update of rating, song_id → comment 추가)
drop trigger if exists trg_song_ratings_aggregate on public.song_ratings;
create trigger trg_song_ratings_aggregate
  after insert or delete or update of rating, comment, song_id on public.song_ratings
  for each row execute function public.refresh_song_rating_aggregate();

-- 백필: 기존 곡의 코멘트 수 확정(평가 없는 곡은 default 0 유지)
update public.songs s
set comment_count = coalesce(agg.cnt, 0)
from (
  select song_id,
         count(*) filter (where comment is not null and btrim(comment) <> '') as cnt
  from public.song_ratings
  group by song_id
) agg
where s.id = agg.song_id;

-- ============================================================
-- B) #6 곡 등록자(추천인) 실명 공개 — profiles SELECT 에 "곡 등록자면 열람" 정책 추가.
--    기존 profiles_select_own_or_admin(본인/관리자) 정책과 OR 결합된다.
--    등록자(songs.created_by)만 노출되고, 등록자가 아닌 한줄평 작성자 프로필은 계속 차단.
--    (한줄평 맥락의 익명화는 화면 레이어 lib/data/songs.ts 의 anonymizeAuthor 로 유지)
-- ============================================================
create index if not exists songs_created_by_idx on public.songs (created_by);

-- profiles RLS 안에서 songs 를 안전하게 조회하기 위한 security definer 헬퍼.
create or replace function public.is_song_curator(p_profile_id uuid)
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.songs where created_by = p_profile_id);
$$;

grant execute on function public.is_song_curator(uuid) to authenticated;

drop policy if exists "profiles_select_song_curator" on public.profiles;
create policy "profiles_select_song_curator"
  on public.profiles for select
  to authenticated
  using (public.is_song_curator(id));
