"use client"

import * as React from "react"
import { ReactLenis } from "lenis/react"

/**
 * Lenis 부드러운 스크롤. root 모드로 <html> 의 기본 스크롤을 가로채 관성 스크롤을 적용한다.
 * - Radix 다이얼로그/드롭다운이 스크롤을 잠그면 lenis-stopped 가 붙어 자동으로 비활성화된다.
 * - 마우스 휠/터치는 Lenis 가 처리하되, 접근성을 위해 OS "동작 줄이기" 설정 시 즉시 스크롤로 폴백한다.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const prefersReducedMotion = React.useMemo(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches
  }, [])

  return (
    <ReactLenis
      root
      options={{
        lerp: prefersReducedMotion ? 1 : 0.1,
        smoothWheel: !prefersReducedMotion,
        // 터치 기기는 네이티브 스크롤이 더 자연스러워 관성만 살짝 적용.
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  )
}
