import { cache } from "react"

import { createClient } from "@/lib/supabase/server"

/**
 * 요청 스코프로 캐시된 현재 사용자 조회.
 *
 * React `cache` 는 한 서버 요청(렌더) 안에서 결과를 메모이즈한다 — 같은 요청에서
 * AppHeader·getSong·markScrapped 등이 각각 부르던 auth.getUser() 왕복(JWT 검증 네트워크)을
 * 1회로 합친다. 교차 요청 캐시가 아니라 요청마다 새로 평가되므로 RSC 에서 안전.
 *
 * 주의: 쓰기 경로(서버 액션)의 getUser() 는 그대로 둔다(액션은 별도 요청 컨텍스트).
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})
