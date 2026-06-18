# 🎵 sing-a-song

로그인 기반 공용 **노래 추천 사이트**. 모든 로그인 사용자가 하나의 공유 리스트에 곡을
등록/조회/수정/삭제하고, 제목·가수·장르·별점·추천사유를 입력한다. 등록일 정렬 + 검색 + 장르 필터.

- **Next.js 16** (App Router) · **Supabase** (Auth + Postgres/RLS) · **shadcn/ui** (Tailwind v4) · **Vercel** · **pnpm**
- 문서: [`docs/SPEC.md`](docs/SPEC.md) · [`docs/TODO.md`](docs/TODO.md) · [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)

## 빠른 시작

### 1) Supabase 준비
```bash
# Supabase 대시보드에서 프로젝트 생성 후
supabase login
supabase link --project-ref <YOUR-PROJECT-REF>
supabase db push            # supabase/migrations/ 의 스키마 적용
pnpm gen:types              # types/database.ts 재생성(연결된 프로젝트 기준)
```
- 대시보드 **Authentication → Providers/Settings** 에서 **"Confirm email" 비활성화**(MVP: 가입 즉시 로그인).

### 2) 환경변수
`.env.local.example` 를 복사해 `.env.local` 작성:
```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable 또는 anon key>
```
> secret/service 키는 불필요하며 절대 `NEXT_PUBLIC_` 로 노출 금지.

### 3) 개발 서버
```bash
pnpm install
pnpm dev      # http://localhost:3000
```

## 스크립트
| 명령 | 설명 |
|---|---|
| `pnpm dev` | 개발 서버 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm gen:types` | Supabase 타입 생성(`--linked`) |

## 배포 (Vercel)
1. Vercel 프로젝트 연결 후 **Production/Preview/Development** 모두에 위 env 2개 설정.
2. Supabase **Auth → URL Configuration** 의 Site URL + redirect 허용목록에 Vercel 도메인 추가.
3. `NEXT_PUBLIC_*` 는 빌드시 인라인되므로 값 변경 시 **재배포** 필요.

## 검증
```bash
pnpm typecheck && pnpm lint && pnpm build
```
수동 스모크 체크리스트는 [`docs/TODO.md`](docs/TODO.md) 하단 참고.
