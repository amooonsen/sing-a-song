# 디자인 시스템 — sing-a-song

shadcn/ui (Radix 베이스, `radix-nova`) + Tailwind v4(CSS 변수 테밍, neutral 베이스) + 다크모드.
색상은 항상 **토큰**으로만 사용한다(`bg-background`, `text-muted-foreground` 등) → 라이트/다크 자동 전환.

## 1. 컬러 토큰
shadcn 기본 토큰(oklch, `:root` & `.dark` 2벌, `app/globals.css`)을 그대로 사용하고, 별점 전용 토큰만 추가했다.

| 역할 | 토큰(CSS 변수) | 용도 |
|---|---|---|
| 배경/전경 | `--background` / `--foreground` | 페이지 바탕, 기본 텍스트 |
| 카드 | `--card` / `--card-foreground` | SongCard, Dialog 내부 |
| 주요 | `--primary` / `--primary-foreground` | CTA(곡 추가/저장/로그인) |
| 보조 | `--secondary` / `--secondary-foreground` | 장르 Badge, 비활성 탭 |
| 뮤트 | `--muted` / `--muted-foreground` | 메타 텍스트, 스켈레톤, placeholder |
| 액센트 | `--accent` / `--accent-foreground` | hover, 선택 상태 |
| 경계/입력/포커스 | `--border` / `--input` / `--ring` | 구분선, 입력 테두리, focus ring |
| 위험 | `--destructive` | 삭제 버튼, 폼 에러 |
| 라운드 | `--radius` (0.625rem) | 카드/버튼/입력 모서리 |
| **별점(채움)** | `--star` (amber) | StarRating 채운 별 — `fill-star text-star` |
| **별점(빈)** | `--star-muted` | StarRating 빈 별 — `fill-star-muted text-star-muted` |

> `--color-star` / `--color-star-muted` 를 `@theme inline` 에 등록해 `text-star`·`fill-star` 유틸리티 사용 가능.

## 2. 타이포그래피
| 용도 | 클래스 |
|---|---|
| 페이지 제목 | `text-2xl sm:text-3xl font-bold tracking-tight` |
| 섹션 제목 | `text-lg sm:text-xl font-semibold tracking-tight` |
| 카드 제목(곡) | `text-base font-semibold truncate` |
| 아티스트 | `text-sm text-foreground/80 truncate` |
| 본문/설명 | `text-sm` (카드 설명은 `line-clamp-3 text-muted-foreground`) |
| 메타/캡션 | `text-xs text-muted-foreground` |

폰트: `Geist`(라틴, `--font-sans`). 한글은 시스템 폰트로 폴백.

## 3. 컴포넌트 ↔ shadcn 매핑
| 앱 컴포넌트 | shadcn 프리미티브 | 비고 |
|---|---|---|
| `AppHeader` | DropdownMenu, Avatar, Button(ghost), Separator + ThemeToggle | sticky 상단바, 로그아웃은 `<form action={signout}>` |
| `AuthForm` | Tabs, Card, Form, Input, Button | 로그인/회원가입 탭, RHF + zod |
| `SongCard` | Card, Badge, DropdownMenu + StarRating(읽기전용) | 메뉴: 수정/삭제, 메타 "등록: {작성자} · 날짜" |
| `SongList` | grid + Skeleton + EmptyState | `grid-cols-1 sm:2 lg:3 xl:4`, 더 보기 링크 |
| `SongFormDialog` | Dialog, Form, Input, Textarea, Select, Button + StarRating(입력) | 생성·수정 공용(controlled/uncontrolled) |
| `SearchBar` | Input(+검색 아이콘) | 300ms 디바운스 → `router.replace(?q=)` |
| `GenreFilter` | Select | 첫 항목 "전체 장르"=`all` → `?genre=` |
| `StarRating` | 커스텀(lucide `Star`) | 입력=`role=radiogroup`, 읽기전용=`role=img`+sr-only |
| `DeleteSongDialog` | AlertDialog | 파괴적 동작 → Dialog 아님, 포커스 취소부터 |
| `Toaster` | Sonner | 루트 1회, `richColors`, `top-center` |

## 4. 레이아웃 / 반응형
- 컨테이너 `mx-auto max-w-6xl px-4`.
- SongList 그리드: `grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`.
- 툴바(검색+필터): 모바일 세로 스택(`flex-col`), `sm:` 이상 가로(`sm:flex-row`).

## 5. 접근성
- 모든 인터랙티브 요소는 shadcn 기본 `focus-visible:ring-*` 유지(절대 제거하지 않음).
- 아이콘 전용 버튼(테마 토글, 검색 지우기, 카드 메뉴)에 `aria-label`.
- StarRating: 입력은 `radiogroup` + 별마다 `aria-label="{n}점"`, ←/→·1~5 키 지원. 읽기전용은 `role="img" aria-label="5점 만점에 N점"`.
- Dialog/AlertDialog: Radix 포커스 트랩 + Esc 닫기 + Title 필수.
- 다크/라이트 대비 WCAG AA 목표. 별 amber 가 흰 카드에서 대비 부족 시 명도 하향.

## 6. 다크모드
- `next-themes`(`attribute="class"`, `defaultTheme="system"`, `enableSystem`).
- 토큰을 `:root`(라이트)와 `.dark`에 모두 선언. Toaster 는 테마에 맞춰 표시.
