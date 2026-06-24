/**
 * Supabase 환경변수 런타임 가드.
 * 클라이언트 생성 시점(요청 시)에만 호출되어, 빌드/프리렌더를 막지 않으면서
 * 변수 누락 시 명확한 에러를 던진다.
 */
export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error(
      "환경변수 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 가 설정되지 않았습니다. " +
        ".env.local 을 확인하세요 (.env.local.example 참고)."
    )
  }

  return { url, anonKey }
}

/**
 * YouTube Data API v3 키(서버 전용). 곡 등록 다이얼로그의 검색/링크 조회에만 사용.
 * 미설정 시 호출부에서 잡아 "직접 입력" 으로 우아하게 폴백한다(앱이 죽지 않음).
 */
export function getYouTubeApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY
  if (!key) {
    throw new Error(
      "환경변수 YOUTUBE_API_KEY 가 설정되지 않았습니다. .env.local 을 확인하세요 (.env.local.example 참고)."
    )
  }
  return key
}
