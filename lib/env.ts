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
