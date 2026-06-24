"use client"

import { memo } from "react"
import dynamic from "next/dynamic"
import { useReducedMotion } from "motion/react"

// WebGL 배경 — 클라이언트 전용, lazy 로드(번들·SSR 빈 캔버스 회피)
const FloatingLines = dynamic(() => import("@/components/FloatingLines"), {
  ssr: false,
})

/**
 * 사이트 전역 배경 — 시그니처 핑크→바이올렛으로 흐르는 라인 필드.
 * 뷰포트에 고정(fixed)되어 모든 페이지 콘텐츠 뒤(-z-10)에 은은히 깔린다.
 * mix-blend screen 으로 다크 캔버스 위에서 발광. reduced-motion 이면 렌더하지 않음.
 */
// props 없음 → memo 로 마운트 후 절대 리렌더되지 않음. 인라인 배열 props 도 1회만 생성되어
// FloatingLines 의 WebGL useEffect 가 재실행(=배경 리로드)되지 않는다. 라우트 리프레시 격리.
export const SiteBackdrop = memo(function SiteBackdrop() {
  const reduce = useReducedMotion()
  if (reduce) return null
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 opacity-60 [mask-image:radial-gradient(125%_125%_at_85%_0%,black,transparent_75%)]"
    >
      <FloatingLines
        linesGradient={["#ff4d7d", "#c44d9e", "#9b5de5"]}
        enabledWaves={["top", "middle", "bottom"]}
        lineCount={[5, 7, 4]}
        animationSpeed={0.4}
        interactive={false}
        parallax={false}
        mixBlendMode="screen"
      />
    </div>
  )
})
