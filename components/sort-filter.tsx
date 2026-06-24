"use client"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export const SORTS = ["recent", "rating", "popular"] as const
export type Sort = (typeof SORTS)[number]
export const DEFAULT_SORT: Sort = "recent"
export const SORT_LABEL: Record<Sort, string> = {
  recent: "최신순",
  rating: "평점순",
  popular: "인기순",
}

type SortFilterProps = {
  value: string
  onChange: (value: string) => void
  /** 기본값(최신순)이 아니면 브랜드 보더로 표시 */
  active?: boolean
}

export function SortFilter({ value, onChange, active }: SortFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "w-full rounded-full px-4 data-[size=default]:h-10 sm:w-28",
          active && "border-brand/60 text-brand"
        )}
        aria-label="정렬"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORTS.map((s) => (
          <SelectItem key={s} value={s}>
            {SORT_LABEL[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
