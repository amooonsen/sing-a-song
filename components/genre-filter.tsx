"use client"

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
}

export function GenreFilter({ value, onChange }: GenreFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-36" aria-label="장르 필터">
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
