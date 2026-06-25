"use client"

import * as React from "react"
import Link from "next/link"
import {
  HiOutlineEllipsisVertical,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2"

import { cn } from "@/lib/utils"
import type { SongWithAuthor } from "@/lib/data/songs"
import { countryColorVar } from "@/lib/country-style"
import { extractVideoId } from "@/lib/youtube-id"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CoverPlaceholder } from "@/components/cover-placeholder"
import { PlayStopButton } from "@/components/play-stop-button"
import { YouTubeFrame } from "@/components/youtube-frame"
import { ScrapButton } from "@/components/scrap-button"
import { SongFormDialog, type SongFormData } from "@/components/song-form-dialog"
import { DeleteSongDialog } from "@/components/delete-song-dialog"

/**
 * 포스터형 카드. 카드 전체가 /songs/[id] 로 이동(오버레이 링크).
 * 평균 평점은 커버 위 글래스 배지로, 메타는 본문 하단에 둔다.
 */
/**
 * 카드가 실제로 렌더하는 필드만 값으로 비교한다.
 * getSongs()/markScrapped()는 매 조회마다 새 객체를 반환하므로 기본 shallow 비교는 무용 →
 * 이 비교자로 "값이 안 바뀐 카드"는 리렌더를 건너뛴다(스크랩 1건에 그리드 전체가 리렌더되던 것 차단).
 */
function songPropsEqual(
  a: { song: SongWithAuthor },
  b: { song: SongWithAuthor }
) {
  const x = a.song
  const y = b.song
  return (
    x.id === y.id &&
    x.title === y.title &&
    x.artist === y.artist &&
    x.genre === y.genre &&
    x.country === y.country &&
    x.otaku_type === y.otaku_type &&
    x.url === y.url &&
    x.thumbnail_url === y.thumbnail_url &&
    x.youtube_video_id === y.youtube_video_id &&
    x.rating_avg === y.rating_avg &&
    x.rating_count === y.rating_count &&
    (x.scrapped_by_me ?? false) === (y.scrapped_by_me ?? false) &&
    (x.profiles?.display_name ?? null) === (y.profiles?.display_name ?? null)
  )
}

export const SongCard = React.memo(function SongCard({
  song,
}: {
  song: SongWithAuthor
}) {
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [playing, setPlaying] = React.useState(false)
  // 인라인 재생용 영상 id — 저장된 id 우선, 없으면 URL 에서 추출
  const embedId =
    song.youtube_video_id ?? (song.url ? extractVideoId(song.url) : null)
  const author = song.profiles?.display_name ?? "탈퇴한 사용자"
  const swatch = countryColorVar(song.country)
  const isOtaku = song.otaku_type === "씹덕"
  // numeric 컬럼이 문자열로 올 수 있어 숫자로 정규화(.toFixed 방지)
  const avg = song.rating_avg == null ? null : Number(song.rating_avg)

  const formData: SongFormData = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    genre: song.genre,
    country: song.country,
    otakuType: song.otaku_type,
    url: song.url,
    thumbnailUrl: song.thumbnail_url,
    youtubeVideoId: song.youtube_video_id,
  }

  return (
    <article className="group relative">
      {/* 카드 전체 링크 — 오버레이(본문/포스터는 pointer-events-none 로 통과, 드롭다운만 위 레이어) */}
      <Link
        href={`/songs/${song.id}`}
        className="absolute inset-0 z-0 rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
        aria-label={`${song.title} 상세 보기`}
      >
        <span className="sr-only">{song.title} 상세 보기</span>
      </Link>

      <div className="pointer-events-none relative z-0 rounded-2xl p-2">
        {/* 포스터 + 평점 배지 — data-thumb-url: 전역 유리 커서가 elementFromPoint로 감지해 굴절 */}
        <div className="relative" data-thumb-url={song.thumbnail_url ?? undefined}>
          <CoverPlaceholder
            title={song.title}
            imageUrl={song.thumbnail_url}
            className="w-full transition-shadow duration-200 group-hover:shadow-[0_20px_44px_-16px_color-mix(in_oklab,var(--brand)_45%,transparent)]"
          />
          {/* 인라인 재생 — 커버 위에 임베드(카드 링크 위 레이어, 클릭은 영상으로) */}
          {playing && embedId && (
            <div className="pointer-events-auto absolute inset-0 overflow-hidden rounded-xl bg-black">
              <YouTubeFrame videoId={embedId} title={song.title} />
            </div>
          )}
          {/* 재생 중엔 유튜브 자체 컨트롤과 겹치지 않게 배지·스크랩은 숨긴다 */}
          {/* 평점 배지는 좌하단 — 우상단은 재생/정지 버튼 자리(통일) */}
          {!playing && avg != null && (
            <span className="absolute bottom-2 left-2 z-10 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 px-2 py-1 text-xs font-bold text-white">
              <span className="text-gold">★</span>
              <span className="tabular-nums">{avg.toFixed(1)}</span>
            </span>
          )}
          {/* 스크랩(찜) — 좌상단, 카드 링크 위 레이어 */}
          {!playing && (
            <ScrapButton
              key={String(song.scrapped_by_me ?? false)}
              songId={song.id}
              scrapped={song.scrapped_by_me ?? false}
              variant="overlay"
            />
          )}
          {/* 바로 듣기/정지 — 재생 전/중 모두 우상단(유튜브 컨트롤과 분리, 위치 통일). 유휴 시 호버로 노출 */}
          {embedId && (
            <PlayStopButton
              playing={playing}
              onToggle={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setPlaying((p) => !p)
              }}
              size="badge"
              tone={playing ? "glass" : "brand"}
              title={song.title}
              className={cn(
                "pointer-events-auto absolute top-2 right-2 z-20",
                !playing &&
                  "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100"
              )}
            />
          )}
        </div>

        {/* 본문 */}
        <div className="px-1.5 pt-3">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h3 className="truncate text-[0.95rem] font-bold tracking-[-0.01em] transition-colors group-hover:text-brand">
                {song.title}
              </h3>
              <p className="mt-0.5 truncate text-[0.8rem] text-muted-foreground">
                {song.artist}
              </p>
            </div>
            {/* 드롭다운 — 링크 위 레이어(클릭 복구) */}
            <div className="pointer-events-auto relative z-10 -mr-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="곡 메뉴"
                    className="opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <HiOutlineEllipsisVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                    <HiOutlinePencilSquare className="size-4" /> 수정
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => setDeleteOpen(true)}
                  >
                    <HiOutlineTrash className="size-4" /> 삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* 메타 — 국적 스와치 + 미들닷, 또는 평가 없음 */}
          {avg != null ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] font-medium text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="size-1.5 shrink-0 rounded-[2px]"
                  style={{ background: swatch }}
                />
                {song.country}
              </span>
              <span aria-hidden className="text-foreground/25">
                ·
              </span>
              <span>{song.genre}</span>
              {song.otaku_type && (
                <>
                  <span aria-hidden className="text-foreground/25">
                    ·
                  </span>
                  <span className={cn(isOtaku && "text-otaku")}>
                    {song.otaku_type}
                  </span>
                </>
              )}
            </div>
          ) : (
            <p className="mt-2.5 text-[0.7rem] text-muted-foreground">
              평가 없음 · {author} 추천
            </p>
          )}
        </div>
      </div>

      <SongFormDialog
        song={formData}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteSongDialog
        songId={song.id}
        songTitle={song.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </article>
  )
}, songPropsEqual)
