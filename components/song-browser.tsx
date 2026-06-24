"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import type { SongWithAuthor } from "@/lib/data/songs"
import { ALL_GENRES } from "@/lib/constants/genres"
import { ALL_COUNTRIES, ALL_OTAKU, JAPAN } from "@/lib/constants/countries"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/search-bar"
import { GenreFilter } from "@/components/genre-filter"
import { CountryFilter } from "@/components/country-filter"
import { SortFilter, DEFAULT_SORT } from "@/components/sort-filter"
import { SongFormDialog } from "@/components/song-form-dialog"
import { CoverPlaceholder } from "@/components/cover-placeholder"
import { StarRating } from "@/components/star-rating"

function formatDate(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}.${m}.${day}`
}

/** 히어로 — "이주의 선곡". 글로우 깔린 피처드 곡. */
function Hero({ song }: { song: SongWithAuthor }) {
  const avg = song.rating_avg == null ? null : Number(song.rating_avg)
  return (
    <section className="animate-rise-in relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)]">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(70% 130% at 12% 25%, color-mix(in oklab, var(--g1) 38%, transparent), transparent 60%), radial-gradient(60% 120% at 100% 100%, color-mix(in oklab, var(--g2) 30%, transparent), transparent 55%)",
        }}
      />
      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-8 sm:p-8">
        <Link
          href={`/songs/${song.id}`}
          aria-label={`${song.title} 상세 보기`}
          className="group shrink-0"
        >
          <CoverPlaceholder
            title={song.title}
            imageUrl={song.thumbnail_url}
            className="w-36 rounded-2xl shadow-[0_24px_60px_-18px_color-mix(in_oklab,var(--g1)_60%,transparent)] transition-transform duration-300 [--ini:2.4rem] group-hover:-translate-y-1 sm:w-52"
          />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 font-mono text-[0.7rem] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full rounded-full bg-brand opacity-50 motion-safe:animate-onair" />
              <span className="relative inline-flex size-2 rounded-full bg-brand" />
            </span>
            ON AIR · 이주의 선곡
          </p>
          <h1 className="mt-3 text-[clamp(2rem,4.5vw,3.4rem)] leading-[1.04] font-extrabold tracking-[-0.035em]">
            <Link
              href={`/songs/${song.id}`}
              className="transition-colors hover:text-brand"
            >
              {song.title}
            </Link>
          </h1>
          <p className="mt-2 text-base font-medium text-muted-foreground sm:text-lg">
            {song.artist}
          </p>
          {avg != null ? (
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <span className="text-grad text-4xl leading-none font-black tabular-nums sm:text-5xl">
                {avg.toFixed(1)}
              </span>
              <span className="flex items-center gap-2">
                <StarRating value={avg} readOnly size="md" />
                <span className="font-mono text-xs text-muted-foreground tabular-nums">
                  {song.rating_count}명 참여
                </span>
              </span>
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">
              아직 평가가 없어요 — 첫 평가를 남겨보세요
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button asChild variant="brand" className="h-11 rounded-xl px-5">
              <Link href={`/songs/${song.id}`}>자세히 보기</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 rounded-xl px-5">
              <Link href={`/songs/${song.id}`}>평가 남기기</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}

type SongBrowserProps = {
  children: React.ReactNode
  /** 콜로폰용 실데이터 */
  total: number
  lastAddedAt: string | null
  /** 히어로 "이주의 선곡" (필터 없는 첫 페이지에서만) */
  featured: SongWithAuthor | null
}

/**
 * 히어로 + 검색/필터 툴바 + 결과 목록(children)을 감싸는 클라이언트 셸.
 * 검색/필터는 단일 useTransition 으로 처리해 로딩을 검색창 스피너 + 결과 디밍으로 표현.
 */
export function SongBrowser({
  children,
  total,
  lastAddedAt,
  featured,
}: SongBrowserProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = React.useTransition()

  const q = searchParams.get("q") ?? ""
  const genre = searchParams.get("genre") ?? ALL_GENRES
  const country = searchParams.get("country") ?? ALL_COUNTRIES
  const otaku = searchParams.get("otaku") ?? ALL_OTAKU
  const sort = searchParams.get("sort") ?? DEFAULT_SORT

  const navigate = React.useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      mutate(params)
      params.delete("page") // 조건 변경 시 페이지 초기화
      const qs = params.toString()
      startTransition(() => {
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
      })
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="space-y-8">
      {featured && <Hero song={featured} />}

      {/* 섹션 헤더 */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            선곡집
          </h2>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {total > 0 ? `${total}곡` : "첫 곡을 기다리는 중"}
            {lastAddedAt && total > 0 && (
              <> · {formatDate(lastAddedAt)} 업데이트</>
            )}
          </span>
        </div>

        {/* 곡 추가 CTA 배너 — 히어로와 같은 톤의 옅은 글로우 */}
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(80% 140% at 0% 0%, color-mix(in oklab, var(--g1) 22%, transparent), transparent 60%), radial-gradient(70% 130% at 100% 100%, color-mix(in oklab, var(--g2) 20%, transparent), transparent 60%)",
            }}
          />
          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-base font-extrabold tracking-tight sm:text-lg">
                인생곡이 있나요?
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                선곡집에 한 곡 더해주세요 — 별점·한줄평까지
              </p>
            </div>
            <SongFormDialog showTrigger />
          </div>
        </div>

        {/* 검색 + 필터 툴바 */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="min-w-0 sm:flex-1">
            <SearchBar
              defaultValue={q}
              isPending={isPending}
              onSearch={(value) =>
                navigate((p) => {
                  if (value) p.set("q", value)
                  else p.delete("q")
                })
              }
            />
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:shrink-0">
            <GenreFilter
              value={genre}
              active={genre !== ALL_GENRES}
              onChange={(value) =>
                navigate((p) => {
                  if (value === ALL_GENRES) p.delete("genre")
                  else p.set("genre", value)
                })
              }
            />
            <CountryFilter
              country={country}
              otaku={otaku}
              active={country !== ALL_COUNTRIES}
              onCountryChange={(value) =>
                navigate((p) => {
                  if (value === ALL_COUNTRIES) p.delete("country")
                  else p.set("country", value)
                  if (value !== JAPAN) p.delete("otaku")
                })
              }
              onOtakuChange={(value) =>
                navigate((p) => {
                  if (value === ALL_OTAKU) p.delete("otaku")
                  else p.set("otaku", value)
                })
              }
            />
            <SortFilter
              value={sort}
              active={sort !== DEFAULT_SORT}
              onChange={(value) =>
                navigate((p) => {
                  if (value === DEFAULT_SORT) p.delete("sort")
                  else p.set("sort", value)
                })
              }
            />
          </div>
        </div>
      </div>

      <div
        aria-busy={isPending}
        className={cn(
          "transition-opacity duration-200",
          isPending && "pointer-events-none opacity-50"
        )}
      >
        {children}
      </div>
    </div>
  )
}
