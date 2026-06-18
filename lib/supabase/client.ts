import { createBrowserClient } from "@supabase/ssr"

import { getSupabaseEnv } from "@/lib/env"
import type { Database } from "@/types/database"

/** 클라이언트 컴포넌트에서 사용하는 브라우저 Supabase 클라이언트 */
export function createClient() {
  const { url, anonKey } = getSupabaseEnv()
  return createBrowserClient<Database>(url, anonKey)
}
