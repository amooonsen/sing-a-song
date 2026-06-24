import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 sm:py-10">
      {/* 마스트헤드 자리 */}
      <div className="space-y-4">
        <Skeleton className="h-3 w-52" />
        <Skeleton className="h-14 w-72 max-w-full" />
        <div className="border-t border-border pt-3">
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      {/* 검색/필터 툴바 자리 */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-full sm:w-36" />
        <Skeleton className="h-8 w-full sm:w-32" />
      </div>
      {/* 헤어라인 인덱스 자리 */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="space-y-3 border-b border-border px-5 py-5 lg:[&:nth-child(even)]:border-l"
          >
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
