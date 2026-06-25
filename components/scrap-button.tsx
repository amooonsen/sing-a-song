"use client"

import * as React from "react"
import { HiBookmark, HiOutlineBookmark } from "react-icons/hi2"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { toggleScrap } from "@/lib/actions/scraps"

type ScrapButtonProps = {
  songId: string
  scrapped: boolean
  /** overlay: 카드 커버 위 아이콘 원형 / pill: 상세 페이지 라벨 버튼 */
  variant?: "overlay" | "pill"
  className?: string
}

/**
 * 곡 스크랩(찜) 토글. 낙관적 업데이트 → 실패 시 롤백.
 * 카드에서는 카드 전체 링크(상세 이동) 위 레이어이므로 클릭 전파를 차단한다.
 */
export function ScrapButton({
  songId,
  scrapped,
  variant = "pill",
  className,
}: ScrapButtonProps) {
  // 서버 재검증으로 scrapped 가 바뀌면 호출부의 key 로 리마운트되어
  // 낙관적 로컬 상태가 최신 prop 으로 초기화된다(CommentList 와 동일 패턴).
  const [on, setOn] = React.useState(scrapped)
  const [pending, startTransition] = React.useTransition()

  function onToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const prev = on
    setOn(!prev)
    startTransition(async () => {
      const res = await toggleScrap(songId)
      if (!res.ok) {
        setOn(prev)
        toast.error(res.message)
      } else {
        toast.success(prev ? "스크랩을 해제했어요" : "스크랩에 담았어요")
      }
    })
  }

  const Icon = on ? HiBookmark : HiOutlineBookmark
  const label = on ? "스크랩 해제" : "스크랩"

  if (variant === "overlay") {
    return (
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        aria-pressed={on}
        aria-label={label}
        className={cn(
          "pointer-events-auto absolute top-2 left-2 z-10 inline-flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/15 bg-black/55 text-white transition-all duration-200 hover:scale-105 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          on
            ? "opacity-100"
            : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
          className
        )}
      >
        <Icon className={cn("size-4", on && "text-brand")} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      aria-pressed={on}
      className={cn(
        "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
        on
          ? "border-brand/40 bg-brand/10 text-brand"
          : "border-brand/25 bg-brand/[0.04] text-foreground hover:border-brand/40 hover:bg-brand/10 dark:bg-brand/[0.07]",
        className
      )}
    >
      <Icon className="size-4" />
      {on ? "스크랩됨" : "스크랩"}
    </button>
  )
}
