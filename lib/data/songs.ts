import { createClient } from "@/lib/supabase/server"
import { JAPAN } from "@/lib/constants/countries"
import type { Tables } from "@/types/database"

export const PAGE_SIZE = 24

export type SongWithAuthor = Tables<"songs"> & {
  profiles: { display_name: string | null } | null
}

export type SongQuery = {
  q?: string
  genre?: string
  country?: string
  /** 일본 곡 한정 씹덕/비씹덕 필터 */
  otaku?: string
  /** 누적 페이지 수 (1 = 첫 PAGE_SIZE개) */
  page?: number
}

/** PostgREST .or 필터에서 의미를 갖는 문자 제거(쉼표/괄호/퍼센트/별표) */
function sanitizeTerm(input: string): string {
  return input.replace(/[,()%*]/g, " ").trim()
}

export async function getSongs({
  q,
  genre,
  country,
  otaku,
  page = 1,
}: SongQuery): Promise<{ songs: SongWithAuthor[]; hasMore: boolean }> {
  const supabase = await createClient()
  const limit = Math.max(1, page) * PAGE_SIZE

  let query = supabase
    .from("songs")
    .select("*, profiles(display_name)")
    .order("created_at", { ascending: false })
    .range(0, limit - 1)

  if (genre && genre !== "all") {
    query = query.eq("genre", genre)
  }

  if (country && country !== "all") {
    query = query.eq("country", country)
    // 씹덕/비씹덕 필터는 일본 곡에만 적용
    if (country === JAPAN && otaku && otaku !== "all") {
      query = query.eq("otaku_type", otaku)
    }
  }

  const term = q ? sanitizeTerm(q) : ""
  if (term) {
    query = query.or(`title.ilike.%${term}%,artist.ilike.%${term}%`)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }

  const songs = (data ?? []) as unknown as SongWithAuthor[]
  return { songs, hasMore: songs.length === limit }
}
