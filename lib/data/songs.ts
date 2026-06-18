import { createClient } from "@/lib/supabase/server"
import type { Tables } from "@/types/database"

export const PAGE_SIZE = 24

export type SongWithAuthor = Tables<"songs"> & {
  profiles: { display_name: string | null } | null
}

export type SongQuery = {
  q?: string
  genre?: string
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
