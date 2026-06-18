# TODO 체크리스트 — 루프 엔지니어링

각 단계는 **실행 가능 상태 + 검증 게이트 통과 + 커밋**으로 끝낸다.
검증 게이트(매 단계 공통): `pnpm typecheck` · `pnpm lint` · `pnpm build` 무오류.

## P0 — 스캐폴드 ✅ (코드 완료)
- [x] `create-next-app` (TS, Tailwind v4, App Router, pnpm)
- [x] shadcn init (Radix 베이스 `radix-nova`) + 컴포넌트 추가(button/input/card/dialog/alert-dialog/form/select/dropdown-menu/badge/avatar/tabs/separator/skeleton/sonner/textarea)
- [x] `react-hook-form` + `@hookform/resolvers` + `zod@3` + `next-themes` + `@supabase/{ssr,supabase-js}` 설치
- [x] `globals.css` 에 `--star` 토큰 추가, 루트 layout 에 ThemeProvider + Toaster, `lang="ko"`
- [x] 문서 초안: `SPEC.md` / `DESIGN_SYSTEM.md` / `TODO.md`

## P1 — DB / 환경
- [x] `supabase init`, 마이그레이션 작성(`supabase/migrations/20260618000000_init_song_schema.sql`)
- [x] 손작성 타입 `types/database.ts` + `gen:types` 스크립트
- [x] `.env.local.example` + 런타임 env 가드(`lib/env.ts`)
- [x] 국적/씹덕 추가 마이그레이션(`20260618010000_add_song_country.sql`, 추가형 — 이미 적용된 스키마에도 안전)
- [ ] **(사용자 작업)** Supabase 프로젝트 생성 → `supabase link --project-ref <ref>` → `supabase db push`
- [ ] **(사용자 작업)** ⚠️ 이미 초기 스키마를 push 했다면 **`supabase db push` 재실행**으로 국적 마이그레이션 적용(없으면 곡 저장 실패)
- [ ] **(사용자 작업)** 대시보드 Auth 설정에서 **"Confirm email" 비활성화**
- [ ] **(사용자 작업)** `.env.local` 작성 후 `pnpm gen:types` 로 타입 재생성
- [ ] 게이트: 로그인 후 곡 등록 → 목록 조회 동작

## P2 — 인증 ✅ (코드 완료)
- [x] `lib/supabase/{client,server,middleware}.ts`, 루트 `proxy.ts`
- [x] `lib/actions/auth.ts`(login/signup/signout), `lib/validations/auth.ts`
- [x] `app/login/page.tsx` + `components/auth-form.tsx`(탭: 로그인/회원가입)
- [ ] 게이트: 미인증→`/login` 리다이렉트, 가입/로그인/로그아웃 (env 설정 후 검증)

## P3 — 읽기 ✅ (코드 완료)
- [x] `app/page.tsx`(server) + `lib/data/songs.ts`(정렬/페이지네이션)
- [x] `song-list` / `song-card` / `star-rating`(읽기전용) / `empty-state`
- [x] `app/loading.tsx` / `error.tsx` / `not-found.tsx`, `app-header` + `theme-toggle`
- [ ] 게이트: 시드 곡이 카드 그리드로 렌더 (env 설정 후 검증)

## P4 — 생성 ✅ (코드 완료)
- [x] `lib/constants/genres.ts`, `lib/validations/song.ts`(zod)
- [x] `song-form-dialog`(생성) + `lib/actions/songs.ts::createSong`
- [ ] 게이트: 등록 후 목록 최상단 반영

## P5 — 검색 / 필터 ✅ (코드 완료)
- [x] `search-bar`(디바운스 + searchParams) + `genre-filter`
- [x] 데이터 헬퍼 q/genre 결합
- [ ] 게이트: 검색·필터·정렬 동시 동작 + URL 공유

## P6 — 수정 / 삭제 ✅ (코드 완료)
- [x] 수정(다이얼로그 재사용) + `updateSong`
- [x] 삭제(`delete-song-dialog` AlertDialog) + `deleteSong`, 카드 메뉴 연결
- [ ] 게이트: 수정/삭제 즉시 반영

## P7 — 마감 / 배포
- [x] 다크모드 토글, 토스트 문구, 접근성(focus ring/aria/키보드 별점)
- [ ] **(사용자 작업)** Vercel 프로젝트 연결 + env(Production/Preview/Development) 설정
- [ ] **(사용자 작업)** Supabase Auth "Site URL" + redirect 허용목록에 Vercel 도메인 추가
- [ ] 게이트: 프로덕션 도메인에서 가입→등록→검색→수정/삭제 동작

## 수동 스모크 체크리스트 (env 설정 후)
- [ ] 로그아웃 상태에서 `/` 접근 → `/login` 리다이렉트
- [ ] 회원가입 → 즉시 로그인 상태, `profiles` 행 생성됨
- [ ] 곡 등록(제목/가수/장르/별점/사유) → 목록 최상단
- [ ] 제목/가수 검색, 장르 필터, "더 보기" 동작
- [ ] 다른 계정으로도 동일 곡 수정/삭제 가능(협업형)
- [ ] 다크모드 토글 유지
- [ ] (RLS) 로그아웃 상태에서 REST 직접 호출 차단 확인
