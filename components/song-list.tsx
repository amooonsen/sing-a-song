import Link from "next/link"

import type { SongWithAuthor } from "@/lib/data/songs"
import { Button } from "@/components/ui/button"
import { SongCard } from "@/components/song-card"
import { EmptyState } from "@/components/empty-state"

type SongListProps = {
  songs: SongWithAuthor[]
  hasMore: boolean
  nextHref: string
  hasFilters: boolean
}

export function SongList({
  songs,
  hasMore,
  nextHref,
  hasFilters,
}: SongListProps) {
  if (songs.length === 0) {
    return <EmptyState hasFilters={hasFilters} />
  }

  return (
    <div className="space-y-10">
      {/* 포스터 그리드 — 앨범 아트 중심 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-3">
        {songs.map((song) => (
          <SongCard key={song.id} song={song} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
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
