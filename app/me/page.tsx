import Link from "next/link"
import { redirect } from "next/navigation"
import { HiOutlineArrowLeft, HiOutlineBookmark } from "react-icons/hi2"

import { getMyScrappedSongs } from "@/lib/data/songs"
import { AppHeader } from "@/components/app-header"
import { Button } from "@/components/ui/button"
import { SongCard } from "@/components/song-card"

export const metadata = {
  title: "내 스크랩",
}

export default async function MyScrapsPage() {
  const songs = await getMyScrappedSongs()
  // 비로그인 → 로그인 페이지로
  if (songs === null) redirect("/login")

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
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

        <div className="mb-6 flex items-baseline gap-3">
          <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">
            내 스크랩
          </h1>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">
            {songs.length > 0 ? `${songs.length}곡` : ""}
          </span>
        </div>

        {songs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-card px-6 py-20 text-center">
            <span className="bg-grad flex size-12 items-center justify-center rounded-2xl text-white shadow-[0_10px_26px_-10px_color-mix(in_oklab,var(--g1)_75%,transparent)]">
              <HiOutlineBookmark className="size-6" />
            </span>
            <p className="text-base font-semibold">아직 스크랩한 곡이 없어요</p>
            <p className="text-sm text-muted-foreground">
              곡 카드나 상세 페이지의 북마크를 눌러 보관함에 담아보세요.
            </p>
            <Button asChild variant="brand" className="mt-2 h-10 rounded-full px-5">
              <Link href="/">선곡집 둘러보기</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-3">
            {songs.map((song) => (
              <SongCard key={song.id} song={song} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
