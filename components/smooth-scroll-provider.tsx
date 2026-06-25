"use client"

import * as React from "react"
import { ReactLenis } from "lenis/react"

/**
 * Lenis 부드러운 스크롤. root 모드로 <html> 의 기본 스크롤을 가로채 관성 스크롤을 적용한다.
 * - Radix 다이얼로그/드롭다운이 스크롤을 잠그면 lenis-stopped 가 붙어 자동으로 비활성화된다.
 * - OS "동작 줄이기" 설정 시엔 lerp 만 끄는 게 아니라 Lenis 자체를 마운트하지 않는다.
 *   (lerp:1 이어도 rAF 루프·휠/포인터 리스너·VirtualScroll 은 그대로 설치되어 입력 지연을 남긴다.)
 * - matchMedia 변경을 구독해 OS 설정을 켜고 끄면 새로고침 없이 즉시 반영한다.
 */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

/** prefers-reduced-motion 을 외부 스토어로 구독. SSR 은 false, 마운트 후 실제값으로 재조정되고
 *  OS 설정 변경도 새로고침 없이 반영된다(effect 내 setState 없이 hydration-safe). */
function subscribeReducedMotion(callback: () => void) {
  const mq = window.matchMedia(REDUCED_MOTION_QUERY)
  mq.addEventListener("change", callback)
  return () => mq.removeEventListener("change", callback)
}

function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false
  )
}

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const reduce = usePrefersReducedMotion()

  // 동작 줄이기: Lenis 파이프라인을 완전히 제거하고 네이티브 스크롤을 쓴다.
  if (reduce) return <>{children}</>

  return (
    <ReactLenis
      root
      options={{
        // 0.1 → 0.12: 관성 꼬리를 살짝 줄여 스크롤 결합 리페인트(헤더 블러 등) 프레임 수를 낮춘다.
        lerp: 0.12,
        smoothWheel: true,
        // 터치 기기는 네이티브 스크롤이 더 자연스러워 관성만 살짝 적용.
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  )
}
