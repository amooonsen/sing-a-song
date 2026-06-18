"use client"

import * as React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SearchBar() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = React.useState(searchParams.get("q") ?? "")

  React.useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (value.trim()) params.set("q", value.trim())
      else params.delete("q")
      params.delete("page") // 검색 변경 시 페이지 초기화
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
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
        className="pl-8"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="검색어 지우기"
          className="absolute top-1/2 right-1 -translate-y-1/2"
          onClick={() => setValue("")}
        >
          <HiOutlineXMark className="size-4" />
        </Button>
      )}
    </div>
  )
}
