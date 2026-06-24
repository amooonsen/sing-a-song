import type { CSSProperties } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { HiOutlineArrowLeft } from "react-icons/hi2"

import { getSong } from "@/lib/data/songs"
import { countryColorVar } from "@/lib/country-style"
import { AppHeader } from "@/components/app-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StarRating } from "@/components/star-rating"
import { CoverPlaceholder, hueFromTitle } from "@/components/cover-placeholder"
import { RatingDistribution } from "@/components/rating-distribution"
import { MyRating } from "@/components/my-rating"
import { CommentList } from "@/components/comment-list"

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
  // 한줄평 목록은 코멘트가 있는 평가만(점수만 매긴 평가는 평균/분포에만 반영)
  const written = comments.filter((c) => c.comment && c.comment.trim())

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-10">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-1.5 mb-5 text-muted-foreground"
        >
          <Link href="/">
            <HiOutlineArrowLeft className="size-4" /> 선곡집으로
          </Link>
        </Button>

        {/* === 히어로: 앨범아트 + 메타 + 큰 평균 === */}
        <header className="animate-rise-in relative overflow-hidden rounded-3xl border border-border bg-card shadow-[0_18px_50px_-18px_rgba(0,0,0,0.5)]">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(70% 130% at 14% 20%, hsl(${hue} 82% 56% / 0.42), transparent 58%), radial-gradient(60% 120% at 100% 100%, color-mix(in oklab, var(--g2) 32%, transparent), transparent 55%)`,
            }}
          />
          <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:gap-8 sm:p-8">
            <CoverPlaceholder
              title={song.title}
              imageUrl={song.thumbnail_url}
              className="w-40 shrink-0 rounded-2xl shadow-[0_26px_64px_-20px_color-mix(in_oklab,var(--g1)_65%,transparent)] [--ini:2.2rem] sm:w-48"
            />
            <div className="min-w-0 flex-1">
              <h1 className="text-[clamp(1.9rem,5vw,3rem)] leading-[1.04] font-extrabold tracking-[-0.03em]">
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
                <div className="mt-6 flex flex-wrap items-end gap-4">
                  <span className="text-grad text-5xl leading-none font-black tabular-nums">
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

              {song.url && (
                <Button
                  asChild
                  variant="outline"
                  className="mt-5 h-10 rounded-full px-5"
                >
                  <a href={song.url} target="_blank" rel="noopener noreferrer">
                    ▶ YouTube에서 듣기
                  </a>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* === 점수 분포 === */}
        {avg != null && (
          <section
            aria-label="평점 분포"
            className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
          >
            <h2 className="mb-4 text-[1.05rem] font-bold tracking-tight">
              평점 분포
            </h2>
            <RatingDistribution
              distribution={distribution}
              total={song.rating_count}
            />
          </section>
        )}

        {/* === 내 평가 === */}
        <section
          aria-label="내 평가"
          className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <h2 className="mb-4 text-[1.05rem] font-bold tracking-tight">
            내 평가
          </h2>
          <MyRating songId={song.id} mine={myRating} />
        </section>

        {/* === 한줄평 목록 === */}
        <section
          aria-label="한줄평"
          className="mt-5 rounded-2xl border border-border bg-card p-5 sm:p-6"
        >
          <h2 className="mb-4 flex items-baseline gap-2 text-[1.05rem] font-bold tracking-tight">
            한줄평
            <span className="font-mono text-sm font-normal text-muted-foreground tabular-nums">
              {written.length}
            </span>
          </h2>
          <CommentList comments={written} songId={song.id} />
        </section>
      </main>
    </div>
  )
}
