"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { PathMorph } from "@/blocks/svg-path-morphing"

type PlayStopButtonProps = {
  /** 재생 중이면 정지(일시정지 막대) 모양, 아니면 재생 삼각형 */
  playing: boolean
  onToggle: (e: React.MouseEvent) => void
  /** hero: 커버 위 큰 원형 / badge: 코너 작은 원형 */
  size?: "hero" | "badge"
  /** brand: 그라데이션 CTA / glass: 영상 위 어두운 반투명 */
  tone?: "brand" | "glass"
  /** aria-label 구성용 곡 제목 */
  title: string
  className?: string
}

const SIZE = {
  hero: { btn: "size-14 hover:scale-110 focus-visible:scale-110", icon: 26 },
  badge: { btn: "size-9", icon: 18 },
} as const

const TONE = {
  brand:
    "bg-[image:var(--grad)] text-white shadow-[0_10px_28px_-8px_color-mix(in_oklab,var(--g1)_75%,transparent)]",
  glass: "border border-white/15 bg-black/55 text-white backdrop-blur-sm",
} as const

/**
 * 재생/정지 모핑 버튼(제어형). 클릭 시 onToggle 으로 상위의 재생 상태를 토글한다.
 * 아이콘 모핑은 aceternity svg-path-morphing(PathMorph)을 재사용.
 */
export function PlayStopButton({
  playing,
  onToggle,
  size = "badge",
  tone = "brand",
  title,
  className,
}: PlayStopButtonProps) {
  const s = SIZE[size]
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={playing}
      aria-label={playing ? `${title} 재생 멈추기` : `${title} 재생`}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-full transition-all duration-200 hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        s.btn,
        TONE[tone],
        className
      )}
    >
      <PathMorph
        playing={playing}
        size={s.icon}
        strokeWidth={1.6}
        className="translate-x-px"
      />
    </button>
  )
}
