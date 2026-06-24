import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* 헤더 자리 */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-xl" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-8 px-4 py-8 sm:py-10">
        {/* 히어로(이주의 선곡) 자리 */}
        <Skeleton className="h-56 w-full rounded-3xl sm:h-64" />

        <div className="space-y-4">
          {/* 섹션 헤더 + 곡 추가 */}
          <div className="flex items-end justify-between gap-4">
            <div className="flex items-baseline gap-3">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>

          {/* 검색 + 필터 툴바 */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Skeleton className="h-10 w-full rounded-full sm:flex-1" />
            <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:shrink-0">
              <Skeleton className="h-10 w-full rounded-full sm:w-36" />
              <Skeleton className="h-10 w-full rounded-full sm:w-32" />
              <Skeleton className="h-10 w-full rounded-full sm:w-28" />
            </div>
          </div>
        </div>

        {/* 포스터 그리드 자리 */}
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2 p-2">
              <Skeleton className="aspect-square w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
