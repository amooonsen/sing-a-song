-- 레거시 컬럼 제거 (검증 후 적용)
-- songs.rating / songs.description 는 20260623000000 에서 song_ratings 로 이전 완료.
-- UI/데이터/액션이 더 이상 두 컬럼을 읽지 않음을 E2E 로 검증한 뒤 적용할 것.
-- 적용: supabase db push
--
-- ⚠️ 이 마이그레이션 적용 후에는 반드시 `pnpm gen:types` 로 types/database.ts 를
--    재생성한다. 잔존하는 song.rating / song.description 참조는 그 시점부터
--    `pnpm typecheck` 에서 하드 타입에러로 드러나 누락 검출 안전망이 된다.
--
-- ⚠️ 데이터 손실 주의: created_by 가 NULL 인 곡(탈퇴 작성자)은 백필에서 제외되어
--    레거시 rating/description 이 song_ratings 로 이전되지 않았다. 이 컬럼을 drop 하면
--    그 값은 영구 소실된다(새 모델은 user_id NOT NULL 이라 탈퇴 사용자의 평점을 담을 곳이 없음).
--    드롭 전 확인 쿼리:
--      select count(*) from public.songs
--      where created_by is null and (rating is not null or description is not null);
--    보존이 필요하면 먼저 백업/이관한 뒤 적용할 것.

alter table public.songs drop constraint if exists songs_desc_len;

alter table public.songs
  drop column if exists rating,
  drop column if exists description;
