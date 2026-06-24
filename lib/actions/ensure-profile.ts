import type { User } from "@supabase/supabase-js"

import type { createClient } from "@/lib/supabase/server"

type ServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * FK(songs.created_by · song_ratings.user_id · comment_likes.user_id → profiles.id) 보장.
 * 가입 트리거 누락/이전 가입으로 프로필이 없는 사용자 대비 본인 프로필 self-heal upsert.
 * (곡 작성자뿐 아니라 평가/좋아요를 남기는 모든 사용자에게 필요 — FK 23503 재발 방지)
 */
export async function ensureProfile(
  supabase: ServerClient,
  user: User
): Promise<void> {
  await supabase.from("profiles").upsert(
    { id: user.id, display_name: user.email?.split("@")[0] ?? "사용자" },
    { onConflict: "id", ignoreDuplicates: true }
  )
}
