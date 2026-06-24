"use client"

import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input"

const PLACEHOLDERS = [
  "제목 또는 가수로 검색",
  "오늘 부를 노래를 찾아보세요",
  "예) 아이유, 검정치마, YOASOBI",
  "장르·국가 필터와 함께 써보세요",
]

type SearchBarProps = {
  /** 현재 적용된 검색어 (URL 기준) */
  defaultValue: string
  /** 검색 결과 로딩 중 여부 */
  isPending: boolean
  /** 검색어 적용 (제출 시) */
  onSearch: (value: string) => void
}

export function SearchBar({ defaultValue, isPending, onSearch }: SearchBarProps) {
  return (
    <PlaceholdersAndVanishInput
      placeholders={PLACEHOLDERS}
      initialValue={defaultValue}
      isPending={isPending}
      hasActiveSearch={Boolean(defaultValue)}
      onSubmit={(value) => onSearch(value)}
      onClear={() => onSearch("")}
    />
  )
}
