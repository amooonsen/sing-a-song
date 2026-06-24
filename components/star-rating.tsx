"use client"

import * as React from "react"
import { HiStar } from "react-icons/hi2"

import { cn } from "@/lib/utils"

type StarRatingProps = {
  /** 0~max, 0.5 단위 (readOnly 는 임의 소수 허용 — 평균 표시) */
  value: number
  max?: number
  readOnly?: boolean
  onChange?: (value: number) => void
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const STAR_SIZE = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
  xl: "size-10",
} as const

/**
 * 별 하나의 부분 채움(소수 별점의 핵심).
 * 바닥 muted 별 위에 filled 별을 width 비율로 클립 → 0.5/0.8 등 임의 소수 렌더.
 * 별마다 독립 계산이라 별 사이 간격(gap)이 색칠되는 오차가 없다.
 */
function Star({ fill, sizeClass }: { fill: number; sizeClass: string }) {
  const pct = Math.max(0, Math.min(1, fill)) * 100
  return (
    <span className={cn("relative inline-flex", sizeClass)}>
      <HiStar className={cn(sizeClass, "text-star-muted")} aria-hidden />
      <span
        className="absolute inset-0 flex items-center overflow-hidden"
        style={{ width: `${pct}%` }}
        aria-hidden
      >
        <HiStar className={cn(sizeClass, "shrink-0 text-star")} />
      </span>
    </span>
  )
}

export function StarRating({
  value,
  max = 5,
  readOnly = false,
  onChange,
  size = "md",
  className,
}: StarRatingProps) {
  const sizeClass = STAR_SIZE[size]
  const [hover, setHover] = React.useState<number | null>(null)
  // numeric 컬럼이 문자열로 올 수 있어(.toFixed 방지) 숫자로 정규화
  const val = Number(value) || 0

  if (readOnly) {
    return (
      <div
        className={cn("inline-flex items-center gap-0.5", className)}
        role="img"
        aria-label={`${max}점 만점에 ${val.toFixed(1)}점`}
      >
        {Array.from({ length: max }).map((_, i) => (
          <Star key={i} fill={val - i} sizeClass={sizeClass} />
        ))}
      </div>
    )
  }

  const display = hover ?? val

  // 포인터가 별의 왼쪽 절반이면 0.5, 오른쪽 절반이면 정수
  function valueFromPointer(
    e: React.PointerEvent<HTMLButtonElement>,
    star: number
  ) {
    const { left, width } = e.currentTarget.getBoundingClientRect()
    return e.clientX - left < width / 2 ? star - 0.5 : star
  }

  return (
    <div
      role="slider"
      aria-label="평점"
      aria-valuemin={0.5}
      aria-valuemax={max}
      aria-valuenow={val || undefined}
      aria-valuetext={val ? `${val.toFixed(1)}점` : "별점 없음"}
      tabIndex={0}
      className={cn(
        "inline-flex w-fit items-center gap-0.5 rounded-sm focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
      onMouseLeave={() => setHover(null)}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
          e.preventDefault()
          onChange?.(Math.max(0.5, val - 0.5))
        } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
          e.preventDefault()
          onChange?.(Math.min(max, val + 0.5))
        } else if (e.key === "Home") {
          e.preventDefault()
          onChange?.(0.5)
        } else if (e.key === "End") {
          e.preventDefault()
          onChange?.(max)
        } else if (/^[1-5]$/.test(e.key)) {
          e.preventDefault()
          onChange?.(Number(e.key))
        } else if (e.key === "0" || e.key === "Backspace" || e.key === "Delete") {
          e.preventDefault()
          onChange?.(0)
        }
      }}
    >
      {Array.from({ length: max }).map((_, i) => {
        const star = i + 1
        return (
          <button
            key={star}
            type="button"
            tabIndex={-1}
            aria-hidden
            className="cursor-pointer"
            onPointerMove={(e) => setHover(valueFromPointer(e, star))}
            onPointerDown={(e) => onChange?.(valueFromPointer(e, star))}
          >
            <Star fill={display - i} sizeClass={sizeClass} />
          </button>
        )
      })}
    </div>
  )
}
