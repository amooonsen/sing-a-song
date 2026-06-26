"use client"

import * as React from "react"
import {
  HiOutlineArrowPath,
  HiOutlineArrowsUpDown,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
} from "react-icons/hi2"

import { cn } from "@/lib/utils"
import { ALL_GENRES } from "@/lib/constants/genres"
import { ALL_COUNTRIES, ALL_OTAKU, JAPAN } from "@/lib/constants/countries"
import { countryColorVar } from "@/lib/country-style"
import { DEFAULT_SORT, SORT_LABEL, type Sort } from "@/components/sort-filter"

/** 제거 가능한 필터 종류 */
export type FilterKind = "q" | "genre" | "country" | "otaku" | "sort"

type Chip = {
  kind: FilterKind
  /** 칩에 보이는 값 */
  label: string
  /** 스크린리더용 — 클릭 시 동작 설명 */
  remove: string
  /** 국적 의미색 점 */
  dot?: string
  /** 값 앞 보조 아이콘(검색·정렬) */
  icon?: React.ReactNode
}

type ActiveFiltersProps = {
  q: string
  genre: string
  country: string
  otaku: string
  sort: string
  /** 개별 필터 제거 */
  onRemove: (kind: FilterKind) => void
  /** 전체 초기화 */
  onReset: () => void
}

/**
 * 적용된 검색/필터를 한 곳에 모아 보여주고, 칩 클릭으로 개별 제거 + 전체 초기화를 제공한다.
 * - 칩 전체가 제거 버튼(넓은 히트 영역) — 드롭다운을 다시 열 필요 없음.
 * - 사라지는 검색창 특성상 보이지 않던 적용 검색어를 다시 노출한다.
 * 활성 조건이 없으면 아무것도 렌더하지 않는다(부모도 가드하지만 방어적으로).
 */
export function ActiveFilters({
  q,
  genre,
  country,
  otaku,
  sort,
  onRemove,
  onReset,
}: ActiveFiltersProps) {
  const chips: Chip[] = []

  if (q) {
    chips.push({
      kind: "q",
      label: `“${q}”`,
      remove: `검색어 ${q} 지우기`,
      icon: <HiOutlineMagnifyingGlass className="size-3.5 text-muted-foreground" />,
    })
  }
  if (genre !== ALL_GENRES) {
    chips.push({ kind: "genre", label: genre, remove: `장르 ${genre} 필터 제거` })
  }
  if (country !== ALL_COUNTRIES) {
    chips.push({
      kind: "country",
      label: country,
      remove: `국적 ${country} 필터 제거`,
      dot: countryColorVar(country),
    })
  }
  if (country === JAPAN && otaku !== ALL_OTAKU) {
    chips.push({ kind: "otaku", label: otaku, remove: `${otaku} 필터 제거` })
  }
  if (sort !== DEFAULT_SORT) {
    chips.push({
      kind: "sort",
      label: SORT_LABEL[sort as Sort] ?? sort,
      remove: `정렬 ${SORT_LABEL[sort as Sort] ?? sort} 해제`,
      icon: <HiOutlineArrowsUpDown className="size-3.5 text-muted-foreground" />,
    })
  }

  if (chips.length === 0) return null

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-border/60 bg-card/40 px-3 py-2.5",
        "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-200"
      )}
    >
      {/* 시그니처 — 핑크→바이올렛 액센트 스파인 */}
      <span
        aria-hidden
        className="mt-1 h-5 w-[3px] shrink-0 rounded-full bg-grad"
      />

      <div className="flex flex-1 flex-wrap items-center gap-2">
        {chips.map((chip) => (
          <button
            key={chip.kind}
            type="button"
            onClick={() => onRemove(chip.kind)}
            aria-label={chip.remove}
            className="group/chip inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary py-1 pr-1.5 pl-2.5 text-[0.8rem] font-medium text-foreground transition-colors hover:border-brand/40 hover:bg-brand/10 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {chip.dot && (
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ background: chip.dot }}
              />
            )}
            {chip.icon}
            <span className="max-w-[12rem] truncate">{chip.label}</span>
            <span
              aria-hidden
              className="flex size-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover/chip:bg-brand group-hover/chip:text-brand-foreground"
            >
              <HiOutlineXMark className="size-3" />
            </span>
          </button>
        ))}

        <button
          type="button"
          onClick={onReset}
          className="group/reset ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1 text-[0.8rem] font-medium text-muted-foreground transition-colors hover:border-brand/40 hover:bg-brand/[0.06] hover:text-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <HiOutlineArrowPath className="size-3.5 transition-transform duration-300 group-hover/reset:-rotate-180" />
          초기화
        </button>
      </div>
    </div>
  )
}
