import type { CSSProperties, ReactNode } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { HiArrowTopRightOnSquare, HiOutlineArrowLeft } from "react-icons/hi2"

import { getSong } from "@/lib/data/songs"
import { countryColorVar } from "@/lib/country-style"
import { AppHeader } from "@/components/app-header"
import { DetailCloseButton } from "@/components/detail-close-button"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/star-rating"
import { hueFromTitle } from "@/components/cover-placeholder"
import { SongPlayer } from "@/components/song-player"
import { ScrapButton } from "@/components/scrap-button"
import { RatingDistribution } from "@/components/rating-distribution"
import { MyRating } from "@/components/my-rating"
import { CommentList } from "@/components/comment-list"

function formatDate(iso: string) {
  const d = new Date(iso)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}.${m}.${day}`
}

/**
 * 섹션 헤더 — 모노 영문 태그 + 한글 제목 (홈의 "ON AIR · 이주의 선곡" 어법).
 * 태그는 섹션의 성격을 표기할 뿐 순서를 뜻하지 않는다(번호 매기지 않음).
 */
function SectionHeading({
  tag,
  title,
  count,
}: {
  tag: string
  title: string
  count?: number
}) {
  return (
    <div className="mb-5 flex items-baseline gap-2.5">
      <span className="font-mono text-[0.7rem] font-semibold tracking-[0.22em] text-brand uppercase">
        {tag}
      </span>
      <h2 className="text-[1.05rem] font-bold tracking-tight">{title}</h2>
      {count != null && (
        <span className="font-mono text-sm font-normal text-muted-foreground tabular-nums">
          {count}
        </span>
      )}
    </div>
  )
}

function Section({
  label,
  children,
  ...heading
}: {
  label: string
  tag: string
  title: string
  count?: number
  children: ReactNode
}) {
  return (
    <section
      aria-label={label}
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <SectionHeading {...heading} />
      {children}
    </section>
  )
}

export default async function SongDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const detail = await getSong(id)
  if (!detail) notFound()

  const { song, myRating, comments, distribution } = detail
  // numeric 컬럼이 문자열로 올 수 있어 숫자로 정규화(.toFixed 방지)
  const avg = song.rating_avg == null ? null : Number(song.rating_avg)
  const tone = countryColorVar(song.country)
  const hue = hueFromTitle(song.title)
  const curator = song.profiles?.display_name?.trim()
  const note = song.description?.trim()
  // 한줄평 목록은 코멘트가 있는 평가만(점수만 매긴 평가는 평균/분포에만 반영)
  const written = comments.filter((c) => c.comment && c.comment.trim())

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-10">
        {/* 상단 바 — 좌측 '선곡집으로'(강조), 우측 X 닫기 */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <Button asChild variant="outline" size="sm" className="rounded-full">
            <Link href="/">
              <HiOutlineArrowLeft className="size-4" /> 선곡집으로
            </Link>
          </Button>
          <DetailCloseButton />
        </div>

        {/* === 히어로: 재생 슬리브 + 메타 + 큰 평균 === */}
        <header className="animate-rise-in relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)]">
          {/* 곡 고유 색의 라디얼 글로우 (이미지 없을 때의 베이스) */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(70% 130% at 14% 20%, hsl(${hue} 82% 56% / 0.42), transparent 58%), radial-gradient(60% 120% at 100% 100%, color-mix(in oklab, var(--g2) 32%, transparent), transparent 55%)`,
            }}
          />
          {/* 곡 자신의 커버를 흐리게 깐 'now playing' 배경 (있을 때) */}
          {song.thumbnail_url && (
            <span aria-hidden className="pointer-events-none absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={song.thumbnail_url}
                alt=""
                aria-hidden
                className="size-full scale-125 object-cover opacity-30 blur-2xl"
              />
              <span
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, color-mix(in oklab, var(--card) 30%, transparent), var(--card) 94%)",
                }}
              />
            </span>
          )}

          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:gap-8 sm:p-8">
            <SongPlayer
              title={song.title}
              imageUrl={song.thumbnail_url}
              videoId={song.youtube_video_id}
              url={song.url}
              className="w-40 shrink-0 sm:w-52"
            />

            <div className="min-w-0 flex-1">
              <h1 className="text-grad text-[clamp(1.9rem,5vw,3rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
                {song.title}
              </h1>
              <p className="mt-2 text-base font-medium text-muted-foreground sm:text-lg">
                {song.artist}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge variant="tone" style={{ "--tone": tone } as CSSProperties}>
                  {song.country}
                </Badge>
                <Badge variant="outline">{song.genre}</Badge>
                {song.otaku_type && (
                  <Badge
                    variant="tone"
                    style={{ "--tone": "var(--otaku)" } as CSSProperties}
                  >
                    {song.otaku_type}
                  </Badge>
                )}
              </div>

              {avg != null ? (
                <div className="mt-6 flex flex-wrap items-end gap-3.5">
                  <span className="text-gold text-[2.75rem] leading-none font-black tabular-nums">
                    {avg.toFixed(1)}
                  </span>
                  <div className="flex flex-col gap-1 pb-1">
                    <StarRating value={avg} readOnly size="md" />
                    <span className="font-mono text-xs text-muted-foreground tabular-nums">
                      {song.rating_count}명 참여
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-base text-muted-foreground">
                  아직 평가가 없어요 — 첫 평가를 남겨보세요
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                {song.url && (
                  <Button
                    asChild
                    variant="outline"
                    className="h-10 rounded-full px-5"
                  >
                    <a href={song.url} target="_blank" rel="noopener noreferrer">
                      YouTube
                      <HiArrowTopRightOnSquare className="size-4" />
                    </a>
                  </Button>
                )}
                <ScrapButton
                  key={String(song.scrapped_by_me ?? false)}
                  songId={song.id}
                  scrapped={song.scrapped_by_me ?? false}
                  variant="pill"
                />
              </div>

              {/* 프레싱 슬레이트 — 누가 언제 골랐나 */}
              <div className="mt-6 flex items-center gap-2 border-t border-border/60 pt-4 font-mono text-[0.72rem] tracking-wide text-muted-foreground">
                <span className="tabular-nums">{formatDate(song.created_at)}</span>
                {curator && (
                  <>
                    <span aria-hidden>·</span>
                    <span className="truncate">{curator} 님의 선곡</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="mt-8 space-y-8">
          {/* === 라이너 노트 (소개) === */}
          {note && (
            <section aria-label="소개">
              <SectionHeading tag="Liner notes" title="소개" />
              <p className="border-l-2 border-brand/50 pl-4 text-[1.02rem] leading-relaxed whitespace-pre-line text-foreground/85">
                {note}
              </p>
            </section>
          )}

          {/* === 점수 분포 === */}
          {avg != null && (
            <Section label="평점 분포" tag="Ratings" title="평점 분포">
              <RatingDistribution
                distribution={distribution}
                total={song.rating_count}
              />
            </Section>
          )}

          {/* === 내 평가 === */}
          <Section label="내 평가" tag="Your take" title="내 평가">
            <MyRating songId={song.id} mine={myRating} />
          </Section>

          {/* === 한줄평 목록 === */}
          <Section
            label="한줄평"
            tag="One-liners"
            title="한줄평"
            count={written.length}
          >
            <CommentList comments={written} songId={song.id} />
          </Section>
        </div>
      </main>
    </div>
  )
}
