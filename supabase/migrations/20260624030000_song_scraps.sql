-- 곡 스크랩(찜): 사용자별 개인 보관함. (user, song) 당 1개.
-- 공개 카운트 없음 — 본인 행만 조회/생성/삭제(comment_likes 와 동일 패턴).
-- 적용: supabase db push

create table if not exists public.song_scraps (
  song_id    uuid not null references public.songs (id)    on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (song_id, user_id)
);

-- 프로필 "내 스크랩" 목록: 사용자별 최신순 스캔 가속
create index if not exists song_scraps_user_created_idx
  on public.song_scraps (user_id, created_at desc);

alter table public.song_scraps enable row level security;

-- 개인 보관함: 본인 행만 조회(타인 스크랩 비노출)
drop policy if exists "song_scraps_select_own" on public.song_scraps;
create policy "song_scraps_select_own"
  on public.song_scraps for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "song_scraps_insert_own" on public.song_scraps;
create policy "song_scraps_insert_own"
  on public.song_scraps for insert
  to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "song_scraps_delete_own" on public.song_scraps;
create policy "song_scraps_delete_own"
  on public.song_scraps for delete
  to authenticated
  using (user_id = (select auth.uid()));
