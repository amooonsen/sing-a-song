import { HiOutlineMusicalNote } from "react-icons/hi2"

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
          ? "다른 검색어나 장르로 다시 찾아보세요."
          : "상단의 ‘곡 추가’ 버튼으로 첫 곡을 추천해 보세요."}
      </p>
    </div>
  )
}
