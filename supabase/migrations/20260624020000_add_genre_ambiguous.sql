-- 장르 '애매함' 추가 — songs_genre_check 제약을 재정의한다.
-- 캐노니컬 목록은 lib/constants/genres.ts 와 일치해야 한다.
alter table public.songs drop constraint songs_genre_check;
alter table public.songs add constraint songs_genre_check check (
  genre in ('발라드','댄스','힙합','R&B','록','인디','재즈','클래식','트로트','OST','K-팝','팝','애매함')
);
