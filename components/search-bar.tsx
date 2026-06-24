"use client"

import * as React from "react"
import { CgSpinner } from "react-icons/cg"
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type SearchBarProps = {
  /** 현재 적용된 검색어 (URL 기준) */
  defaultValue: string
  /** 검색 결과 로딩 중 여부 */
  isPending: boolean
  /** 디바운스 후 검색어 적용 */
  onSearch: (value: string) => void
}

export function SearchBar({ defaultValue, isPending, onSearch }: SearchBarProps) {
  const [value, setValue] = React.useState(defaultValue)
  const onSearchRef = React.useRef(onSearch)
  React.useEffect(() => {
    onSearchRef.current = onSearch
  })

  // 외부(URL/뒤로가기) 값이 바뀌면 입력값 동기화 (렌더 중 보정 패턴)
  const [appliedValue, setAppliedValue] = React.useState(defaultValue)
  if (defaultValue !== appliedValue) {
    setAppliedValue(defaultValue)
    setValue(defaultValue)
  }

  // 입력 디바운스 → 현재 적용값과 다를 때만 검색
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (value.trim() !== defaultValue) onSearchRef.current(value.trim())
    }, 300)
    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative w-full">
      <HiOutlineMagnifyingGlass className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        aria-label="곡 검색"
        placeholder="제목 또는 가수로 검색"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="h-10 rounded-full px-8"
      />
      <div className="absolute top-1/2 right-1 -translate-y-1/2">
        {isPending ? (
          <span
            className="flex size-7 items-center justify-center"
            aria-label="검색 중"
            role="status"
          >
            <CgSpinner className="size-4 animate-spin text-muted-foreground" />
          </span>
        ) : value ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="검색어 지우기"
            onClick={() => setValue("")}
          >
            <HiOutlineXMark className="size-4" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}
