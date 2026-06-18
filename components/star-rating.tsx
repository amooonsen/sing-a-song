"use client"

import * as React from "react"
import { HiStar } from "react-icons/hi2"

import { cn } from "@/lib/utils"

type StarRatingProps = {
  value: number
  max?: number
  readOnly?: boolean
  onChange?: (value: number) => void
  size?: "sm" | "md"
  className?: string
}

export function StarRating({
  value,
  max = 5,
  readOnly = false,
  onChange,
  size = "md",
  className,
}: StarRatingProps) {
  const [hover, setHover] = React.useState<number | null>(null)
  const display = hover ?? value
  const starClass = size === "sm" ? "size-4" : "size-6"

  if (readOnly) {
    return (
      <div
        className={cn("flex items-center gap-0.5", className)}
        role="img"
        aria-label={`5점 만점에 ${value}점`}
      >
        {Array.from({ length: max }).map((_, i) => (
          <HiStar
            key={i}
            aria-hidden
            className={cn(starClass, i < value ? "text-star" : "text-star-muted")}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      role="radiogroup"
      aria-label="평점"
      className={cn("flex items-center gap-0.5", className)}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }).map((_, i) => {
        const star = i + 1
        const filled = star <= display
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={star === value}
            aria-label={`${star}점`}
            className="cursor-pointer rounded-sm p-0.5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
            onMouseEnter={() => setHover(star)}
            onClick={() => onChange?.(star)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                e.preventDefault()
                onChange?.(Math.max(1, value - 1))
              } else if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                e.preventDefault()
                onChange?.(Math.min(max, value + 1))
              } else if (/^[1-5]$/.test(e.key)) {
                e.preventDefault()
                onChange?.(Number(e.key))
              }
            }}
          >
            <HiStar
              className={cn(
                starClass,
                filled ? "text-star" : "text-star-muted"
              )}
            />
          </button>
        )
      })}
    </div>
  )
}
