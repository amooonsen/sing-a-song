import Link from "next/link"
import { HiOutlineArrowPath, HiOutlineMusicalNote } from "react-icons/hi2"

import { Button } from "@/components/ui/button"

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <span className="bg-grad flex size-14 items-center justify-center rounded-2xl text-white shadow-[0_12px_30px_-12px_color-mix(in_oklab,var(--g1)_70%,transparent)]">
        <HiOutlineMusicalNote className="size-7" />
      </span>
      <h2 className="text-2xl font-extrabold tracking-tight">
        {hasFilters ? "검색 결과가 없어요" : "아직 텅 빈 선곡집"}
      </h2>
      <p className="max-w-xs text-sm text-muted-foreground">
        {hasFilters
          ? "조건을 바꾸거나, 필터를 초기화하고 전체 선곡을 둘러보세요."
          : "상단의 ‘곡 추가’ 버튼으로 첫 곡을 추천해 보세요."}
      </p>
      {hasFilters && (
        <Button
          asChild
          variant="outline"
          className="group/reset mt-1 h-10 rounded-full px-5"
        >
          <Link href="/" scroll={false}>
            <HiOutlineArrowPath className="size-4 transition-transform duration-300 group-hover/reset:-rotate-180" />
            필터 초기화
          </Link>
        </Button>
      )}
    </div>
  )
}
