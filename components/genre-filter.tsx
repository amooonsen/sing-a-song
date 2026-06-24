"use client"

import { cn } from "@/lib/utils"
import { ALL_GENRES, GENRES } from "@/lib/constants/genres"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type GenreFilterProps = {
  value: string
  onChange: (value: string) => void
  /** 필터가 활성(전체 아님)이면 브랜드 보더로 표시 */
  active?: boolean
}

export function GenreFilter({ value, onChange, active }: GenreFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn(
          "w-full rounded-full px-4 data-[size=default]:h-10 sm:w-36",
          active && "border-brand/60 text-brand"
        )}
        aria-label="장르 필터"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_GENRES}>전체 장르</SelectItem>
        {GENRES.map((g) => (
          <SelectItem key={g} value={g}>
            {g}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
