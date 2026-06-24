import { createClient } from "@/lib/supabase/server"
import { JAPAN } from "@/lib/constants/countries"
import type { Tables } from "@/types/database"

export const PAGE_SIZE = 24

/** 목록 정렬 기준 */
export type SongSort = "recent" | "rating" | "popular"

export type SongWithAuthor = Tables<"songs"> & {
  profiles: { display_name: string | null } | null
}

export type RatingWithAuthor = Tables<"song_ratings"> & {
  profiles: { display_name: string | null } | null
}

export type CommentWithLike = RatingWithAuthor & { liked_by_me: boolean }

export type SongDetail = {
  song: SongWithAuthor
  /** 현재 사용자의 내 평가(없으면 null) */
  myRating: Tables<"song_ratings"> | null
  /** 모든 한줄평 (인기순 → 최신순) + 내 좋아요 여부 */
  comments: CommentWithLike[]
  /** "0.5".."5.0" → 인원수 */
  distribution: Record<string, number>
}

export type SongQuery = {
  q?: string
  genre?: string
  country?: string
  /** 일본 곡 한정 씹덕/비씹덕 필터 */
  otaku?: string
  /** 누적 페이지 수 (1 = 첫 PAGE_SIZE개) */
  page?: number
  /** 정렬 (기본 최신순) */
  sort?: SongSort
}

/** 0.5 단위 평점 버킷(분포 그래프용) */
const RATING_BUCKETS = [
  "0.5",
  "1.0",
  "1.5",
  "2.0",
  "2.5",
  "3.0",
  "3.5",
  "4.0",
  "4.5",
  "5.0",
] as const

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
  sort = "recent",
}: SongQuery): Promise<{ songs: SongWithAuthor[]; hasMore: boolean }> {
  const supabase = await createClient()
  const limit = Math.max(1, page) * PAGE_SIZE

  // song_ratings(songs↔profiles 정션) 때문에 profiles 임베드가 모호 → FK 명시
  let query = supabase
    .from("songs")
    .select("*, profiles!songs_created_by_fkey(display_name)")
    .range(0, limit - 1)

  if (sort === "rating") {
    // 평점순: 평점 있는 곡 먼저(nulls last), 동점은 최신순
    query = query
      .order("rating_avg", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
  } else if (sort === "popular") {
    // 인기순: 평가 많은 순, 동점은 최신순
    query = query
      .order("rating_count", { ascending: false })
      .order("created_at", { ascending: false })
  } else {
    query = query.order("created_at", { ascending: false })
  }

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

/**
 * 히어로 "이주의 선곡" — 평점 가장 높은 곡 1개(평가 있는 곡 우선, 동점은 최신).
 * 평가가 하나도 없으면 가장 최근 추가된 곡으로 폴백. 실패해도 페이지를 막지 않는다.
 */
export async function getFeaturedSong(): Promise<SongWithAuthor | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("songs")
    .select("*, profiles!songs_created_by_fkey(display_name)")
    .order("rating_avg", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data as unknown as SongWithAuthor
}

/**
 * 마스트헤드 콜로폰용 — 공유 리스트의 실제 상태(전체 곡 수 + 마지막 추가 시각).
 * count:"exact" + limit(1) 로 한 번의 쿼리에서 총 개수와 최신 행을 함께 얻는다.
 */
export async function getSongsMeta(): Promise<{
  total: number
  lastAddedAt: string | null
}> {
  const supabase = await createClient()
  const { data, count, error } = await supabase
    .from("songs")
    .select("created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(1)

  if (error) {
    // 콜로폰은 부가 정보이므로 실패해도 페이지를 막지 않는다.
    return { total: 0, lastAddedAt: null }
  }
  return { total: count ?? 0, lastAddedAt: data?.[0]?.created_at ?? null }
}

/**
 * 상세 페이지용 — 곡 + 집계 + 내 평가 + 모든 한줄평(+내 좋아요 여부) + 점수 분포.
 * 잘못된 uuid(22P02) / 미존재 → null 반환(page 에서 notFound()).
 */
export async function getSong(id: string): Promise<SongDetail | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 1) 곡 + 작성자 + 집계 (정션 테이블로 인한 모호성 → FK 명시)
  const songPromise = supabase
    .from("songs")
    .select("*, profiles!songs_created_by_fkey(display_name)")
    .eq("id", id)
    .maybeSingle()

  // 2) 모든 한줄평 + 작성자 (인기순 → 최신순). comment_likes 정션으로 모호 → FK 명시
  const commentsPromise = supabase
    .from("song_ratings")
    .select("*, profiles!song_ratings_user_id_fkey(display_name)")
    .eq("song_id", id)
    .order("like_count", { ascending: false })
    .order("created_at", { ascending: false })

  // 3) 현재 사용자가 좋아요한 한줄평 id 집합(전체) — JS 에서 교집합
  const myLikesPromise = user
    ? supabase.from("comment_likes").select("song_rating_id").eq("user_id", user.id)
    : Promise.resolve({ data: [], error: null })

  const [songRes, commentsRes, likesRes] = await Promise.all([
    songPromise,
    commentsPromise,
    myLikesPromise,
  ])

  if (songRes.error) {
    // 잘못된 uuid 형식 등은 404 로 처리
    if (songRes.error.code === "22P02") return null
    throw new Error(songRes.error.message)
  }
  if (!songRes.data) return null
  if (commentsRes.error) throw new Error(commentsRes.error.message)

  const song = songRes.data as unknown as SongWithAuthor
  const allComments = (commentsRes.data ?? []) as unknown as RatingWithAuthor[]
  const likedIds = new Set(
    ((likesRes.data ?? []) as unknown as { song_rating_id: string }[]).map(
      (l) => l.song_rating_id
    )
  )

  const comments: CommentWithLike[] = allComments.map((c) => ({
    ...c,
    liked_by_me: likedIds.has(c.id),
  }))
  const myRating = user
    ? (allComments.find((c) => c.user_id === user.id) ?? null)
    : null

  // 분포: 0.5 단위 10버킷
  const distribution: Record<string, number> = {}
  for (const b of RATING_BUCKETS) distribution[b] = 0
  for (const c of allComments) {
    const key = Number(c.rating).toFixed(1)
    if (key in distribution) distribution[key] += 1
  }

  return { song, myRating, comments, distribution }
}
