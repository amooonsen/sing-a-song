"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import {
  ALL_COUNTRIES,
  ALL_OTAKU,
  COUNTRIES,
  JAPAN,
  OTAKU_TYPES,
} from "@/lib/constants/countries"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CountryFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentCountry = searchParams.get("country") ?? ALL_COUNTRIES
  const currentOtaku = searchParams.get("otaku") ?? ALL_OTAKU

  function pushParams(params: URLSearchParams) {
    params.delete("page") // 필터 변경 시 페이지 초기화
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  function onCountryChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === ALL_COUNTRIES) params.delete("country")
    else params.set("country", value)
    // 일본이 아니면 씹덕/비씹덕 필터 제거
    if (value !== JAPAN) params.delete("otaku")
    pushParams(params)
  }

  function onOtakuChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === ALL_OTAKU) params.delete("otaku")
    else params.set("otaku", value)
    pushParams(params)
  }

  return (
    <div className="flex gap-2">
      <Select value={currentCountry} onValueChange={onCountryChange}>
        <SelectTrigger className="w-full sm:w-36" aria-label="국적 필터">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_COUNTRIES}>전체 국적</SelectItem>
          {COUNTRIES.map((c) => (
            <SelectItem key={c} value={c}>
              {c}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentCountry === JAPAN && (
        <Select value={currentOtaku} onValueChange={onOtakuChange}>
          <SelectTrigger className="w-full sm:w-32" aria-label="씹덕/비씹덕 필터">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_OTAKU}>전체</SelectItem>
            {OTAKU_TYPES.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  )
}
