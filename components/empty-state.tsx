import { Music4 } from "lucide-react"

export function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <div className="rounded-full bg-muted p-4">
        <Music4 className="size-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold">
        {hasFilters ? "검색 결과가 없어요" : "아직 등록된 곡이 없어요"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {hasFilters
          ? "다른 검색어나 장르로 찾아보세요."
          : "상단의 ‘곡 추가’ 버튼으로 첫 곡을 추천해 보세요."}
      </p>
    </div>
  )
}
