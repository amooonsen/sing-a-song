"use server"

import { findVideos, type YouTubeSearchResult } from "@/lib/youtube"

/** 검색 텍스트가 너무 짧으면 호출하지 않는다(쿼터 절약). */
const MIN_QUERY_LENGTH = 2

const MESSAGES: Record<"config" | "quota" | "network", string> = {
  config: "YouTube 검색이 설정되지 않았어요. 제목·가수를 직접 입력해 주세요.",
  quota:
    "YouTube 검색 한도를 초과했어요. 잠시 후 다시 시도하거나 직접 입력해 주세요.",
  network: "YouTube 검색에 실패했어요. 제목·가수를 직접 입력해 주세요.",
}

/**
 * 등록 다이얼로그의 YouTube 파인더용. 검색어 또는 링크를 받아 매치 반환.
 * 링크/ID 면 1유닛(videos.list), 아니면 100유닛(search.list, 24h 캐시).
 */
export async function searchYouTube(
  input: string
): Promise<YouTubeSearchResult> {
  const q = input.trim()
  // 링크 붙여넣기는 짧아도 통과시킨다(11자 id 자체가 의미)
  if (q.length < MIN_QUERY_LENGTH) return { ok: true, matches: [] }

  const res = await findVideos(q)
  if ("error" in res) {
    return { ok: false, message: MESSAGES[res.error], reason: res.error }
  }
  return { ok: true, matches: res.matches }
}
