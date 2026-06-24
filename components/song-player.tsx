"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { extractVideoId } from "@/lib/youtube-id"
import { CoverPlaceholder } from "@/components/cover-placeholder"
import { PlayStopButton } from "@/components/play-stop-button"
import { PathMorph } from "@/blocks/svg-path-morphing"
import { YouTubeFrame } from "@/components/youtube-frame"

type SongPlayerProps = {
  title: string
  /** 앨범 썸네일 (없으면 제너러티브 커버) */
  imageUrl?: string | null
  /** 있으면 클릭 시 그 자리에서 인라인 재생 */
  videoId?: string | null
  /** videoId 가 없을 때 URL 에서 영상 id 를 뽑아 인라인 재생, 실패 시 새 탭 폴백 */
  url?: string | null
  /** 래퍼 폭 지정용 (예: w-40 sm:w-52) */
  className?: string
}

const SLEEVE = "relative block aspect-square w-full overflow-hidden rounded-2xl shadow-[0_26px_64px_-20px_color-mix(in_oklab,var(--g1)_65%,transparent)]"

/**
 * 재생 가능한 LP 슬리브. 앨범 커버가 곧 플레이어다 —
 * 영상 id 가 있으면(또는 URL 에서 추출되면) 그 자리에서 인라인 재생,
 * 재생/정지는 모핑 버튼으로 토글, 둘 다 없으면 정적 커버.
 */
export function SongPlayer({
  title,
  imageUrl,
  videoId,
  url,
  className,
}: SongPlayerProps) {
  const [playing, setPlaying] = React.useState(false)
  const embedId = videoId ?? (url ? extractVideoId(url) : null)

  const cover = (
    <CoverPlaceholder
      title={title}
      imageUrl={imageUrl}
      className="size-full rounded-2xl [--ini:2.2rem]"
    />
  )

  // 인라인 재생 가능 — 커버↔임베드 위에 영속 모핑 버튼(재생↔정지로 부드럽게 변형)
  if (embedId) {
    return (
      <div className={cn(SLEEVE, "group", playing && "bg-black", className)}>
        {playing ? <YouTubeFrame videoId={embedId} title={title} /> : cover}
        {!playing && (
          <span
            aria-hidden
            className="absolute inset-0 bg-black/15 transition-colors duration-200 group-hover:bg-black/35"
          />
        )}
        <PlayStopButton
          playing={playing}
          onToggle={() => setPlaying((p) => !p)}
          size={playing ? "badge" : "hero"}
          tone={playing ? "glass" : "brand"}
          title={title}
          className={cn("absolute z-10", playing ? "top-2 right-2" : "inset-0 m-auto")}
        />
      </div>
    )
  }

  // 임베드 불가 + 외부 링크만 — 새 탭 폴백(커버가 곧 링크)
  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${title} YouTube에서 듣기`}
        className={cn(
          SLEEVE,
          "group cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
          className
        )}
      >
        {cover}
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center bg-black/15 transition-colors duration-200 group-hover:bg-black/35 group-focus-visible:bg-black/35"
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-[image:var(--grad)] text-white shadow-[0_10px_28px_-8px_color-mix(in_oklab,var(--g1)_75%,transparent)] transition-transform duration-200 group-hover:scale-110 group-focus-visible:scale-110">
            <PathMorph
              playing={false}
              size={26}
              strokeWidth={1.6}
              className="translate-x-px"
            />
          </span>
        </span>
      </a>
    )
  }

  return <div className={cn(SLEEVE, className)}>{cover}</div>
}
