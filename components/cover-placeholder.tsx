import type { CSSProperties } from "react"

import { cn } from "@/lib/utils"
import { CoverImage } from "@/components/cover-image"

type CoverPlaceholderProps = {
  title: string
  /** 있으면 실제 앨범 썸네일을 위에 얹는다(로드 실패 시 자동으로 제너러티브 커버로 폴백). */
  imageUrl?: string | null
  className?: string
}

/** 제목 코드포인트 합 → 0~359 색상(hue). 곡마다 결정론적이라 새로고침해도 같은 커버. */
export function hueFromTitle(title: string): number {
  let h = 0
  for (const ch of title) h = (h * 31 + ch.charCodeAt(0)) % 360
  return h
}

/**
 * 앨범 이미지가 없으면 제목 해시로 곡마다 고유한 그라데이션 앨범 아트를 생성한다.
 * imageUrl 이 있으면 그 위에 실제 썸네일(<CoverImage>)을 얹고, 로드 실패 시 폴백.
 * 레이어: 라디얼 하이라이트 + 대각 그라데이션 + 그레인 + 비닐 링 + 하단 비네트 + 이니셜.
 * 장식 요소이므로 aria-hidden — 접근 가능한 제목은 별도 텍스트가 담당.
 */
export function CoverPlaceholder({
  title,
  imageUrl,
  className,
}: CoverPlaceholderProps) {
  const h1 = hueFromTitle(title)
  const h2 = (h1 + 38) % 360
  const initial = (title.trim()[0] ?? "♪").toUpperCase()

  return (
    <div
      aria-hidden
      className={cn(
        "relative aspect-square overflow-hidden rounded-xl",
        className
      )}
      style={
        {
          background: `radial-gradient(125% 110% at 26% 18%, hsl(${h2} 96% 74% / 0.85), transparent 55%), linear-gradient(150deg, hsl(${h1} 80% 56%), hsl(${h2} 72% 38%))`,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.1)",
        } as CSSProperties
      }
    >
      {/* 그레인 — 썸네일이 없을 때만. 이미지가 있으면 불투명 커버가 완전히 덮어
          mix-blend 합성이 카드마다 낭비되므로(그리드 전체에서 누적) 생략한다. */}
      {!imageUrl && (
        <span className="album-grain pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay" />
      )}
      {/* 비닐 링 */}
      <span
        className="pointer-events-none absolute -right-[22%] -bottom-[30%] aspect-square w-[78%] rounded-full border border-white/15"
        style={{ boxShadow: "0 0 0 14px rgba(255,255,255,0.05)" }}
      />
      {/* 하단 비네트 — 이니셜 가독성 */}
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.34))",
        }}
      />
      {/* 이니셜 — 크기는 호출부에서 [--ini:...] 로 조정 */}
      <span
        className="absolute bottom-2.5 left-3 font-extrabold tracking-tight text-white/95 select-none"
        style={{
          fontSize: "var(--ini, 1.5rem)",
          textShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}
      >
        {initial}
      </span>
      {/* 실제 썸네일(있으면) — 위 레이어들을 덮고, 실패 시 사라져 폴백 */}
      {imageUrl ? <CoverImage src={imageUrl} /> : null}
    </div>
  )
}
