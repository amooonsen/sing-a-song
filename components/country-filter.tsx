"use client"

import { cn } from "@/lib/utils"
import {
  ALL_COUNTRIES,
  ALL_OTAKU,
  COUNTRIES,
  JAPAN,
  OTAKU_TYPES,
} from "@/lib/constants/countries"
import { countryColorVar } from "@/lib/country-style"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type CountryFilterProps = {
  country: string
  otaku: string
  onCountryChange: (value: string) => void
  onOtakuChange: (value: string) => void
  /** 필터가 활성(전체 아님)이면 브랜드 보더로 표시 */
  active?: boolean
}

export function CountryFilter({
  country,
  otaku,
  onCountryChange,
  onOtakuChange,
  active,
}: CountryFilterProps) {
  return (
    <div className="flex gap-2">
      <Select value={country} onValueChange={onCountryChange}>
        <SelectTrigger
          className={cn(
            "w-full rounded-full px-4 data-[size=default]:h-10 sm:w-32",
            active && "border-brand/60 text-brand"
          )}
          aria-label="국적 필터"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_COUNTRIES}>전체 국적</SelectItem>
          {COUNTRIES.map((c) => (
            <SelectItem key={c} value={c}>
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ background: countryColorVar(c) }}
                />
                {c}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {country === JAPAN && (
        <Select value={otaku} onValueChange={onOtakuChange}>
          <SelectTrigger
            className="w-full rounded-full px-4 data-[size=default]:h-10 sm:w-28"
            aria-label="씹덕/비씹덕 필터"
          >
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
