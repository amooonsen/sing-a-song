"use client"

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

type CountryFilterProps = {
  country: string
  otaku: string
  onCountryChange: (value: string) => void
  onOtakuChange: (value: string) => void
}

export function CountryFilter({
  country,
  otaku,
  onCountryChange,
  onOtakuChange,
}: CountryFilterProps) {
  return (
    <div className="flex gap-2">
      <Select value={country} onValueChange={onCountryChange}>
        <SelectTrigger className="w-full sm:w-32" aria-label="국적 필터">
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

      {country === JAPAN && (
        <Select value={otaku} onValueChange={onOtakuChange}>
          <SelectTrigger className="w-full sm:w-28" aria-label="씹덕/비씹덕 필터">
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
