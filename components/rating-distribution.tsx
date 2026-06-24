import { cn } from "@/lib/utils"

/** 0.5 단위 평점 버킷 (왓챠 분포 그래프) */
const BUCKETS = [
  "0.5",
  "1.0",
  "1.5",
  "2.0",
  "2.5",
  "3.0",
  "3.5",
  "4.0",
  "4.5",
  "5.0",
] as const

type RatingDistributionProps = {
  /** "0.5".."5.0" → 인원수 */
  distribution: Record<string, number>
  total: number
  className?: string
}

/**
 * 점수 분포 이퀄라이저 — 0.5점 단위 10개 막대.
 * 가장 많은 버킷 기준 상대 높이. 채워진 막대는 시그니처 그라데이션 + 글로우.
 * 정수 점수에만 라벨을 달아 정돈.
 */
export function RatingDistribution({
  distribution,
  total,
  className,
}: RatingDistributionProps) {
  const max = Math.max(1, ...BUCKETS.map((b) => distribution[b] ?? 0))

  return (
    <div
      className={cn("flex items-end gap-1.5", className)}
      role="img"
      aria-label="평점 분포 그래프"
    >
      {BUCKETS.map((b) => {
        const count = distribution[b] ?? 0
        const pct = total ? Math.round((count / total) * 100) : 0
        const heightPct = (count / max) * 100
        const label = b.endsWith(".0") ? b.slice(0, -2) : ""
        const filled = count > 0
        return (
          <div key={b} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex h-[108px] w-full items-end"
              title={`${b}점 · ${count}명 (${pct}%)`}
            >
              <div
                className={cn(
                  "w-full rounded-md transition-[height] duration-300",
                  filled ? "bg-grad" : "bg-secondary/60"
                )}
                style={{
                  height: `${Math.max(filled ? 6 : 2, heightPct)}%`,
                  boxShadow: filled
                    ? "0 0 16px -2px color-mix(in oklab, var(--g1) 55%, transparent)"
                    : undefined,
                }}
              />
            </div>
            <span className="h-3 font-mono text-[0.65rem] text-muted-foreground tabular-nums">
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
