import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* 헤더 자리 */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-xl" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="size-8 rounded-full" />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-10">
        {/* 뒤로가기 */}
        <Skeleton className="mb-5 h-8 w-28 rounded-md" />

        {/* 히어로: 슬리브 + 메타 + 평균 */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-8">
            <Skeleton className="aspect-square w-40 shrink-0 rounded-2xl sm:w-52" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-9 w-2/3 sm:h-11" />
              <Skeleton className="mt-3 h-5 w-1/3" />
              {/* 배지 */}
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              {/* 큰 평균 + 별 */}
              <div className="mt-6 flex items-end gap-4">
                <Skeleton className="h-14 w-24" />
                <div className="space-y-2 pb-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              {/* 액션 */}
              <div className="mt-5 flex gap-2.5">
                <Skeleton className="h-10 w-28 rounded-full" />
                <Skeleton className="h-10 w-24 rounded-full" />
              </div>
              {/* 슬레이트 */}
              <Skeleton className="mt-6 h-4 w-40" />
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-8">
          {/* 평점 분포 */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <Skeleton className="mb-5 h-5 w-40" />
            <div className="flex items-end gap-1.5">
              {[40, 65, 30, 85, 55, 100, 70, 45, 80, 35].map((h, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-[108px] w-full items-end">
                    <Skeleton
                      className="w-full rounded-md"
                      style={{ height: `${h}%` }}
                    />
                  </div>
                  <Skeleton className="h-3 w-2" />
                </div>
              ))}
            </div>
          </div>

          {/* 내 평가 */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <Skeleton className="mb-5 h-5 w-32" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="mt-3 h-16 w-full rounded-lg" />
            <Skeleton className="mt-3 h-9 w-28 rounded-lg" />
          </div>

          {/* 한줄평 */}
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <Skeleton className="mb-5 h-5 w-28" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-secondary/40 p-4"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-7 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="mt-3 h-4 w-full" />
                  <Skeleton className="mt-2 h-4 w-4/5" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
