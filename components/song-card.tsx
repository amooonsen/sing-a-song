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
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CoverPlaceholder } from "@/components/cover-placeholder"
import { SongFormDialog, type SongFormData } from "@/components/song-form-dialog"
import { DeleteSongDialog } from "@/components/delete-song-dialog"

/**
 * 포스터형 카드. 카드 전체가 /songs/[id] 로 이동(오버레이 링크).
 * 평균 평점은 커버 위 글래스 배지로, 메타는 본문 하단에 둔다.
 */
export function SongCard({ song }: { song: SongWithAuthor }) {
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
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

      <div className="pointer-events-none relative z-0 rounded-2xl p-2 transition duration-200 group-hover:-translate-y-1 group-hover:bg-card group-hover:shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)]">
        {/* 포스터 + 평점 배지 */}
        <div className="relative">
          <CoverPlaceholder
            title={song.title}
            imageUrl={song.thumbnail_url}
            className="w-full transition-shadow duration-200 group-hover:shadow-[0_20px_44px_-16px_color-mix(in_oklab,var(--brand)_45%,transparent)]"
          />
          {avg != null && (
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/55 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
              <span className="text-gold">★</span>
              <span className="tabular-nums">{avg.toFixed(1)}</span>
            </span>
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
}
