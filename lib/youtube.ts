import { unstable_cache } from "next/cache"

import { getYouTubeApiKey } from "@/lib/env"

/**
 * YouTube Data API v3 조회 모듈 (서버 전용).
 *
 * 최적화 핵심:
 *  - 읽기 경로(브라우즈/상세)는 API 를 절대 호출하지 않는다. 등록 시점에 받은
 *    썸네일/제목/가수/videoId 를 DB(songs)에 저장해두고, 썸네일은 i.ytimg.com
 *    CDN 에서 <img> 로 직접 로드 → API 쿼터 0.
 *  - 검색(search.list, 100유닛)은 정규화 쿼리 기준 24h unstable_cache → 동일
 *    검색은 사용자/요청 무관하게 캐시 히트. URL/ID 입력은 videos.list(1유닛)로 전환.
 *  - 실패 결과는 캐시하지 않는다(캐시 함수 내부에서 throw → unstable_cache 미저장).
 */

const SEARCH_MAX_RESULTS = 5
const REVALIDATE_SECONDS = 86400 // 24h — 음악 메타데이터는 사실상 불변
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

export type YouTubeMatch = {
  videoId: string
  title: string
  channelTitle: string
  thumbnailUrl: string
  url: string
}

export type YouTubeErrorReason = "config" | "quota" | "network"

export type YouTubeSearchResult =
  | { ok: true; matches: YouTubeMatch[] }
  | { ok: false; message: string; reason: YouTubeErrorReason }

class YouTubeError extends Error {
  constructor(public reason: YouTubeErrorReason) {
    super(reason)
  }
}

function thumbUrl(videoId: string) {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}
function watchUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`
}
function stripTopic(name: string) {
  return name.replace(/\s*-\s*Topic$/i, "").trim()
}
function decodeEntities(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

/** 다양한 YouTube URL/ID 입력에서 11자 video id 추출 (없으면 null). */
export function extractVideoId(input: string): string | null {
  const s = input.trim()
  if (VIDEO_ID_RE.test(s)) return s
  try {
    const u = new URL(s)
    const host = u.hostname.replace(/^www\./, "")
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0]
      return VIDEO_ID_RE.test(id) ? id : null
    }
    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "music.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      const v = u.searchParams.get("v")
      if (v && VIDEO_ID_RE.test(v)) return v
      const m = u.pathname.match(/\/(?:shorts|embed|v)\/([A-Za-z0-9_-]{11})/)
      if (m) return m[1]
    }
  } catch {
    // URL 이 아니면 아래 폴백
  }
  const m = s.match(/(?:v=|\/)([A-Za-z0-9_-]{11})(?:[?&/]|$)/)
  return m ? m[1] : null
}

/** YouTube API 호출 → 매치 배열. 실패 시 throw(YouTubeError) → 캐시되지 않음. */
async function callYouTube(
  path: "search" | "videos",
  params: Record<string, string>
): Promise<YouTubeMatch[]> {
  let key: string
  try {
    key = getYouTubeApiKey()
  } catch {
    throw new YouTubeError("config")
  }

  const qs = new URLSearchParams({ ...params, key }).toString()
  let res: Response
  try {
    res = await fetch(`https://www.googleapis.com/youtube/v3/${path}?${qs}`)
  } catch (e) {
    console.error("[youtube] network", e)
    throw new YouTubeError("network")
  }
  if (!res.ok) {
    if (res.status === 403) throw new YouTubeError("quota")
    console.error(
      "[youtube] http",
      res.status,
      await res.text().catch(() => "")
    )
    throw new YouTubeError("network")
  }

  const data = (await res.json()) as { items?: unknown[] }
  const items = data.items ?? []
  return items
    .map((raw): YouTubeMatch | null => {
      const it = raw as {
        id?: string | { videoId?: string }
        snippet?: { title?: string; channelTitle?: string }
      }
      const id = typeof it.id === "string" ? it.id : it.id?.videoId
      if (!id || !VIDEO_ID_RE.test(id)) return null
      return {
        videoId: id,
        title: decodeEntities(it.snippet?.title ?? ""),
        channelTitle: stripTopic(decodeEntities(it.snippet?.channelTitle ?? "")),
        thumbnailUrl: thumbUrl(id),
        url: watchUrl(id),
      }
    })
    .filter((m): m is YouTubeMatch => m !== null)
}

// search.list(100유닛) — 정규화 쿼리 기준 24h 캐시(성공만 저장)
const cachedSearch = unstable_cache(
  (q: string) =>
    callYouTube("search", {
      part: "snippet",
      type: "video",
      maxResults: String(SEARCH_MAX_RESULTS),
      q,
    }),
  ["youtube-search"],
  { revalidate: REVALIDATE_SECONDS, tags: ["youtube-search"] }
)

// videos.list(1유닛) — videoId 기준 캐시
const cachedVideo = unstable_cache(
  (id: string) => callYouTube("videos", { part: "snippet", id }),
  ["youtube-video"],
  { revalidate: REVALIDATE_SECONDS, tags: ["youtube-search"] }
)

// 콜드 윈도우(캐시 미적재) 동안 동일 쿼리 동시호출 합치기
const inflight = new Map<string, Promise<YouTubeMatch[]>>()

function dedupe(key: string, run: () => Promise<YouTubeMatch[]>) {
  const existing = inflight.get(key)
  if (existing) return existing
  const p = run().finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}

export type YouTubeLookup =
  | { matches: YouTubeMatch[] }
  | { error: YouTubeErrorReason }

/**
 * 검색 텍스트 또는 YouTube 링크 하나를 받아 매치 목록 반환.
 * URL/ID 면 videos.list(1유닛), 아니면 search.list(100유닛) 사용.
 */
export async function findVideos(input: string): Promise<YouTubeLookup> {
  const raw = input.trim()
  if (!raw) return { matches: [] }
  const videoId = extractVideoId(raw)
  const key = videoId ? `id:${videoId}` : `q:${raw.toLowerCase()}`
  try {
    const matches = await dedupe(key, () =>
      videoId ? cachedVideo(videoId) : cachedSearch(raw.toLowerCase())
    )
    return { matches }
  } catch (e) {
    const reason = e instanceof YouTubeError ? e.reason : "network"
    return { error: reason }
  }
}
