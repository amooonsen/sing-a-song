"use client"

import * as React from "react"

/**
 * CoverPlaceholder 위에 얹는 실제 썸네일(앨범 아트). 로드 실패 시 스스로 사라져
 * 아래 제너러티브 그라데이션 커버가 그대로 노출되도록 한다.
 * 장식 요소이므로 aria-hidden.
 */
export function CoverImage({ src }: { src: string }) {
  const [failed, setFailed] = React.useState(false)
  if (failed) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      aria-hidden
      loading="lazy"
      onError={() => setFailed(true)}
      className="absolute inset-0 size-full object-cover"
    />
  )
}
