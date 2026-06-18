"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { ALL_GENRES, GENRES } from "@/lib/constants/genres"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function GenreFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const current = searchParams.get("genre") ?? ALL_GENRES

  function onChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === ALL_GENRES) params.delete("genre")
    else params.set("genre", value)
    params.delete("page")
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="w-full sm:w-40" aria-label="장르 필터">
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
