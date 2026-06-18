import { AppHeader } from "@/components/app-header"
import { SongBrowser } from "@/components/song-browser"
import { SongList } from "@/components/song-list"
import { ALL_GENRES } from "@/lib/constants/genres"
import { ALL_COUNTRIES, ALL_OTAKU, JAPAN } from "@/lib/constants/countries"
import { getSongs } from "@/lib/data/songs"

type SearchParams = {
  q?: string
  genre?: string
  country?: string
  otaku?: string
  page?: string
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const q = sp.q?.trim() || undefined
  const genre = sp.genre && sp.genre !== ALL_GENRES ? sp.genre : undefined
  const country =
    sp.country && sp.country !== ALL_COUNTRIES ? sp.country : undefined
  // 씹덕/비씹덕 필터는 일본 곡에만 유효
  const otaku =
    country === JAPAN && sp.otaku && sp.otaku !== ALL_OTAKU
      ? sp.otaku
      : undefined
  const page = Math.max(1, Number(sp.page) || 1)

  const { songs, hasMore } = await getSongs({ q, genre, country, otaku, page })
  const hasFilters = Boolean(q || genre || country)

  const nextParams = new URLSearchParams()
  if (q) nextParams.set("q", q)
  if (genre) nextParams.set("genre", genre)
  if (country) nextParams.set("country", country)
  if (otaku) nextParams.set("otaku", otaku)
  nextParams.set("page", String(page + 1))
  const nextHref = `/?${nextParams.toString()}`

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <SongBrowser>
          <SongList
            songs={songs}
            hasMore={hasMore}
            nextHref={nextHref}
            hasFilters={hasFilters}
          />
        </SongBrowser>
      </main>
    </div>
  )
}
