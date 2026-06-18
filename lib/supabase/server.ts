import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { getSupabaseEnv } from "@/lib/env"
import type { Database } from "@/types/database"

/** 서버 컴포넌트·서버 액션에서 사용하는 Supabase 클라이언트 (Next 15/16 async cookies) */
export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = getSupabaseEnv()

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // 서버 컴포넌트 렌더 중에는 쿠키를 쓸 수 없다.
          // 세션 갱신은 미들웨어(updateSession)가 담당하므로 안전하게 무시.
        }
      },
    },
  })
}
