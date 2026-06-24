-- ============================================================
-- songs 에 YouTube 메타데이터 추가 (url / thumbnail_url / youtube_video_id)
--   - 모두 nullable: YouTube 연동은 선택. 수동 입력 곡은 NULL 유지.
--   - create_song_with_rating 을 3개 파라미터 추가본으로 재정의.
--     PostgREST 오버로드 모호성(PGRST203) 방지를 위해 기존 8-인자 함수를
--     먼저 DROP 한 뒤 새 11-인자 버전을 CREATE 한다.
-- 적용: supabase db push  →  이후 types/database.ts 갱신(손수 또는 pnpm gen:types)
-- ============================================================

alter table public.songs
  add column if not exists url              text,
  add column if not exists thumbnail_url    text,
  add column if not exists youtube_video_id text;

-- 오버로드 모호성 방지: 기존 8-인자 함수 명시적 제거 후 11-인자 버전 생성
drop function if exists public.create_song_with_rating(
  text, text, text, text, text, numeric, text, boolean
);

create or replace function public.create_song_with_rating(
  p_title            text,
  p_artist           text,
  p_genre            text,
  p_country          text,
  p_otaku_type       text,
  p_rating           numeric,
  p_comment          text,
  p_is_spoiler       boolean,
  p_url              text default null,
  p_thumbnail_url    text default null,
  p_youtube_video_id text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_song_id uuid;
begin
  if v_uid is null then
    raise exception 'auth required' using errcode = '28000';
  end if;

  insert into public.songs
    (title, artist, genre, country, otaku_type, created_by,
     url, thumbnail_url, youtube_video_id)
  values
    (p_title, p_artist, p_genre, p_country, p_otaku_type, v_uid,
     nullif(btrim(p_url), ''),
     nullif(btrim(p_thumbnail_url), ''),
     nullif(btrim(p_youtube_video_id), ''))
  returning id into v_song_id;

  insert into public.song_ratings (song_id, user_id, rating, comment, is_spoiler)
  values (v_song_id, v_uid, p_rating, nullif(btrim(p_comment), ''), coalesce(p_is_spoiler, false));

  return v_song_id;
end;
$$;

grant execute on function public.create_song_with_rating(
  text, text, text, text, text, numeric, text, boolean, text, text, text
) to authenticated;
