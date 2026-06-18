"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { cn } from "@/lib/utils"
import { ALL_GENRES } from "@/lib/constants/genres"
import { ALL_COUNTRIES, ALL_OTAKU, JAPAN } from "@/lib/constants/countries"
import { SearchBar } from "@/components/search-bar"
import { GenreFilter } from "@/components/genre-filter"
import { CountryFilter } from "@/components/country-filter"
import { SongFormDialog } from "@/components/song-form-dialog"

/**
 * 검색/필터 툴바 + 결과 목록(children)을 감싸는 클라이언트 셸.
 * 모든 네비게이션을 단일 useTransition 으로 처리해 검색/필터 로딩 상태를
 * 검색창 스피너 + 결과 영역 디밍으로 일관되게 표현한다.
 */
export function SongBrowser({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = React.useTransition()

  const q = searchParams.get("q") ?? ""
  const genre = searchParams.get("genre") ?? ALL_GENRES
  const country = searchParams.get("country") ?? ALL_COUNTRIES
  const otaku = searchParams.get("otaku") ?? ALL_OTAKU

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
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            추천 곡
          </h1>
          <SongFormDialog showTrigger />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
          <div className="flex gap-2">
            <GenreFilter
              value={genre}
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
