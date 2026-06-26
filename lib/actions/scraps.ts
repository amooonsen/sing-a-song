"use server"

import { createClient } from "@/lib/supabase/server"
import { ensureProfile } from "@/lib/actions/ensure-profile"
import type { ActionResult } from "@/lib/actions/songs"

/** 곡 스크랩(찜) 토글 (멱등) — 본인 보관함에 추가/제거 */
export async function toggleScrap(songId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, message: "로그인이 필요합니다" }
  }

  // FK(song_scraps.user_id → profiles.id) 보장
  await ensureProfile(supabase, user)

  const { data: existing } = await supabase
    .from("song_scraps")
    .select("song_id")
    .eq("song_id", songId)
    .eq("user_id", user.id)
    .maybeSingle()

  // 삭제는 0행이어도 무에러(멱등). 삽입은 동시 요청 시 PK 충돌(23505) →
  // ignoreDuplicates upsert 로 멱등 처리(다른 탭/기기 동시 스크랩의 거짓 실패 방지).
  const { error } = existing
    ? await supabase
        .from("song_scraps")
        .delete()
        .eq("song_id", songId)
        .eq("user_id", user.id)
    : await supabase
        .from("song_scraps")
        .upsert(
          { song_id: songId, user_id: user.id },
          { onConflict: "song_id,user_id", ignoreDuplicates: true }
        )

  if (error) {
    console.error("[toggleScrap]", error)
    return { ok: false, message: `스크랩 실패: ${error.message}` }
  }

  // 재검증하지 않는다. 스크랩은 호출부에서 낙관적 업데이트라 즉시 반영되고,
  // /me·/ 는 모두 인증(cookies) 기반 동적 렌더라 캐시되지 않아 다음 방문 시 항상 신선하다.
  // 서버 액션 안의 revalidatePath 는 "어떤 경로를 넘기든" 현재 라우트의 RSC 를 다시 렌더링시켜
  // (Next 동작) 목록이 재조정되고 그 위 풀뷰포트 WebGL blend 레이어가 한 프레임 깜빡인다.
  // 신선도 이득이 없는 재검증을 제거해 현재 라우트 리렌더 자체를 막는다 → 배경 깜빡임 해소.
  return { ok: true }
}
