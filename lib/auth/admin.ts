import { cache } from "react"

import { getCurrentUser } from "@/lib/supabase/user"

/**
 * 실명(추천인·평점 작성자)을 열람할 수 있는 관리자 이메일.
 * DB RLS 의 public.is_admin() 함수와 반드시 동일하게 유지할 것
 * (supabase/migrations/20260626000000_anonymize_profiles.sql).
 */
const ADMIN_EMAILS = new Set(["aqazswsx@etribe.co.kr"])

/**
 * 현재 요청 사용자가 관리자인지 여부.
 * getCurrentUser 와 같은 요청 스코프로 캐시되어 렌더당 1회만 평가된다.
 */
export const getIsAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser()
  const email = user?.email?.toLowerCase()
  return email ? ADMIN_EMAILS.has(email) : false
})
