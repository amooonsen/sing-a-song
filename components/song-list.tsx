import Link from "next/link"

import type { SongWithAuthor } from "@/lib/data/songs"
import { Button } from "@/components/ui/button"
import { SongCard, type SongCardView } from "@/components/song-card"
import { EmptyState } from "@/components/empty-state"

type SongListProps = {
  songs: SongWithAuthor[]
  hasMore: boolean
  nextHref: string
  hasFilters: boolean
  /** 썸네일 그리드(기본) 또는 리스트 행 */
  view?: SongCardView
}

export function SongList({
  songs,
  hasMore,
  nextHref,
  hasFilters,
  view = "grid",
}: SongListProps) {
  if (songs.length === 0) {
    return <EmptyState hasFilters={hasFilters} />
  }

  return (
    <div className="space-y-10">
      {view === "list" ? (
        // 리스트 — 행 사이 구분선이 있는 카드
        <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-card">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} view="list" />
          ))}
        </div>
      ) : (
        // 포스터 그리드 — 앨범 아트 중심
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-3">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} view="grid" />
          ))}
        </div>
      )}

      {hasMore && (
        // 하단 여백 — "더 보기"가 안드로이드 OS 하단 바에 가리지 않게 클리어런스 확보
        // (safe-area inset + 4rem). 차주 무한 스크롤 전환 시 함께 정리 예정.
        <div className="flex justify-center pb-[calc(env(safe-area-inset-bottom,0px)+4rem)]">
          <Button asChild variant="outline" className="h-10 rounded-full px-6">
            <Link href={nextHref} scroll={false}>
              더 보기
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
