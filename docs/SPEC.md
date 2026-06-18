# 명세서 — 노래 추천 사이트 (sing-a-song)

## 1. 개요
로그인 기반의 **공용 노래 추천 사이트**. 모든 로그인 사용자가 하나의 공유 리스트에 곡을
등록/조회/수정/삭제(CRUD)하고, 제목/가수/장르/별점/추천사유를 입력한다. 등록일 내림차순
정렬 + 제목·가수 검색 + 장르 필터를 제공한다.

- 프론트/백엔드: **Next.js 16 (App Router, RSC, TypeScript)**
- DB/Auth: **Supabase (Postgres + RLS, 이메일/비밀번호 인증)**
- UI: **shadcn/ui (Radix 베이스, Tailwind v4) + 다크모드**
- 배포: **Vercel** · 패키지매니저: **pnpm**

## 2. 사용자 & 권한
- **인증 방식**: 이메일 + 비밀번호. 가입 시 **이름** 입력(메타데이터 → 트리거가 `profiles.display_name` 에 반영). 이메일 확인은 MVP에서 **비활성화**(가입 즉시 세션).
- **이름 표시/변경**: 헤더와 카드의 작성자는 아이디/이메일이 아닌 **이름(display_name)** 으로 노출. 헤더 메뉴 "이름 변경"에서 수정(가능 시 self-heal upsert).
- **접근**: 앱 전체가 로그인 뒤. 미인증 사용자는 모든 경로에서 `/login` 으로 리다이렉트.
- **권한 모델(협업형)**: 로그인 사용자라면 **누구나** 모든 곡을 수정/삭제 가능. 조회도 전원 공유.
  - 위조 방지: `songs.created_by` 는 DB default `auth.uid()` + INSERT RLS `with check (created_by = auth.uid())`. 클라이언트가 보낸 작성자 값은 신뢰하지 않음.

## 3. 데이터 모델
### profiles
| 컬럼 | 타입 | 비고 |
|---|---|---|
| id | uuid PK | `auth.users(id)` 참조, 가입 시 트리거로 자동 생성 |
| display_name | text | 이메일 local-part 에서 자동 추출 |
| created_at / updated_at | timestamptz | |

### songs
| 컬럼 | 타입 | 제약 |
|---|---|---|
| id | uuid PK | `gen_random_uuid()` |
| title | text | 1–200자, not null |
| artist | text | 1–100자, not null |
| genre | text | 고정 목록 CHECK (아래) |
| country | text | 노래 국적, 고정 목록 CHECK: 한국/일본/서양/기타 |
| otaku_type | text \| null | **일본 곡만** 씹덕/비씹덕 (그 외 국가는 반드시 NULL, CHECK 로 강제) |
| description | text \| null | ≤1000자, 선택 |
| rating | smallint | 1–5, 등록자 부여 |
| created_by | uuid \| null | `profiles(id)` 참조(작성자 임베드용), default `auth.uid()` |
| updated_by | uuid \| null | `auth.users(id)` 참조, 수정 시 서버가 세팅 |
| created_at / updated_at | timestamptz | `updated_at` 트리거 자동 갱신 |

- **장르 캐노니컬 목록(단일 출처 `lib/constants/genres.ts`)**:
  `발라드, 댄스, 힙합, R&B, 록, 인디, 재즈, 클래식, 트로트, OST, K-팝, 팝`
  → Select 옵션 · zod enum · SQL CHECK 가 모두 일치해야 함.
- **국적 목록(단일 출처 `lib/constants/countries.ts`)**: `한국, 일본, 서양, 기타`.
  - **씹덕/비씹덕(`OTAKU_TYPES`)**: 국적이 **일본일 때만** 적용되는 하위 분류. 등록 시 일본을 고르면 씹덕/비씹덕 선택이 필수가 되고, 다른 국가로 바꾸면 값이 비워진다. DB·zod·UI 3계층 모두에서 일관 강제.

## 4. 기능 명세
- **조회/정렬**: `created_at DESC`. 기본 페이지 단위 `PAGE_SIZE = 24`, "더 보기"로 누적 로드(`?page=`).
- **검색**: 제목 또는 가수 부분일치(대소문자 무시, trigram 인덱스). 300ms 디바운스 → `?q=`. 검색/필터 적용 중에는 `SongBrowser` 의 단일 `useTransition` 으로 검색창 스피너 + 결과 디밍 표시.
- **필터**: 장르 단일 선택 → `?genre=`, 국적 단일 선택 → `?country=`. 국적이 **일본**이면 씹덕/비씹덕 하위 필터(`?otaku=`)가 추가로 노출(다른 국가 선택 시 자동 제거). 검색/필터/정렬/페이지는 모두 URL `searchParams` 로 표현(공유 가능).
- **등록/수정**: 다이얼로그(생성·수정 공용) + react-hook-form + zod. 서버 액션이 동일 스키마로 재검증.
- **삭제**: AlertDialog 확인 후 삭제.
- **별점**: 입력(클릭/키보드) + 읽기전용(카드). 5점 만점 정수.
- **알림**: 성공/실패 토스트(sonner).

## 5. 아키텍처 규칙
- **데이터 변경은 Server Actions + `revalidatePath('/')` 단일 경로.** `/api/*` 라우트 핸들러 없음.
- Supabase 클라이언트: `lib/supabase/{client,server,middleware}.ts`. 미들웨어(`proxy.ts`)가 세션 갱신 + 라우트 보호.
- 인증 신뢰: 미들웨어 `getUser()`, 서버 컴포넌트/액션 `getUser()`. `getSession()` 신뢰 금지.
- 서버 액션 반환형 통일: `{ ok: true } | { ok: false; message }`.
- 검증 단일 출처: `lib/validations/song.ts`(곡), `lib/validations/auth.ts`(인증).

## 6. 수용된 트레이드오프 (의도된 한계)
- 누구나 수정/삭제 가능 → 이력/되돌리기 UI 없음. 귀속 추적은 `created_by`/`updated_by` 컬럼만.
- **실시간 동기화 없음** → 다른 사용자의 변경은 재검증(`revalidatePath`/`router.refresh`) 시점에 반영.
- 페이지네이션은 누적 `range` 기반(무한 스크롤/keyset 아님). 업그레이드 경로: created_at keyset.
- 이메일 확인 비활성화(MVP). 운영 전 활성화 시 `app/auth/confirm` 콜백 라우트 추가 필요.

## 7. 비범위 (향후 과제)
- 닉네임 편집, 사용자별 "내가 등록한 곡" 필터
- 곡당 다중 사용자 평점/평균, 좋아요/댓글
- 소셜 로그인(Google/Kakao), 실시간(Supabase Realtime)
- 이미지/앨범아트 업로드
