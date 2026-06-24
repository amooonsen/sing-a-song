/**
 * YouTube video id 추출 — 순수 함수(브라우저/서버 공용).
 * lib/youtube.ts 는 서버 전용(next/cache·env)이라 클라이언트에서 임포트할 수 없어
 * id 파싱만 따로 떼어 둔다(카드 인라인 재생 등 클라이언트에서 재사용).
 */

export const VIDEO_ID_RE = /^[A-Za-z0-9_-]{11}$/

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
