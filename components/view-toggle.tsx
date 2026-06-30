"use client"

import { cn } from "@/lib/utils"
import { HiOutlineListBullet, HiOutlineSquares2X2 } from "react-icons/hi2"

export type ViewMode = "grid" | "list"

type ViewToggleProps = {
  value: ViewMode
  onChange: (value: ViewMode) => void
}

const OPTIONS = [
  { mode: "grid", label: "썸네일 보기", Icon: HiOutlineSquares2X2 },
  { mode: "list", label: "리스트 보기", Icon: HiOutlineListBullet },
] as const

/** 썸네일(그리드) ↔ 리스트 뷰 세그먼트 토글. 필터 컨트롤과 같은 라운드 톤. */
export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="보기 방식"
      className="inline-flex h-10 shrink-0 items-center gap-0.5 rounded-full border border-input p-1"
    >
      {OPTIONS.map(({ mode, label, Icon }) => {
        const active = value === mode
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={cn(
              "inline-flex size-8 cursor-pointer items-center justify-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
              active
                ? "bg-brand/15 text-brand"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
          </button>
        )
      })}
    </div>
  )
}
