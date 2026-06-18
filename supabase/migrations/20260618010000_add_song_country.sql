-- songs 에 국적(country) + 일본 곡 씹덕/비씹덕(otaku_type) 추가
-- 추가형 마이그레이션: 초기 스키마가 이미 적용된 경우에도 안전하게 동작한다.
-- 적용:  supabase db push

alter table public.songs add column if not exists country text;
alter table public.songs add column if not exists otaku_type text;

-- 기존 행이 있다면 NOT NULL 적용 전에 기본값 채움(빈 테이블이면 영향 없음)
update public.songs set country = '기타' where country is null;

alter table public.songs alter column country set not null;

-- 일본 곡일 때만 otaku_type 사용('씹덕'|'비씹덕'), 그 외 국가는 반드시 NULL
alter table public.songs
  drop constraint if exists songs_country_check,
  drop constraint if exists songs_otaku_check;

alter table public.songs
  add constraint songs_country_check check (
    country in ('한국','일본','서양','기타')
  ),
  add constraint songs_otaku_check check (
    (country = '일본' and otaku_type in ('씹덕','비씹덕'))
    or (country <> '일본' and otaku_type is null)
  );

create index if not exists songs_country_idx on public.songs (country);
