"use client"

import FuzzyText from "@/components/FuzzyText"

// globals.css 의 --g1/--g2 (핑크→바이올렛) 시그니처 그라데이션 (다크 전용)
const GRADIENT = ["#ff4d7d", "#9b5de5"]

export function Fuzzy404() {
  return (
    <FuzzyText
      fontSize="clamp(4rem, 16vw, 9rem)"
      fontWeight={900}
      gradient={GRADIENT}
      baseIntensity={0.16}
      hoverIntensity={0.5}
    >
      404
    </FuzzyText>
  )
}
