"use server"

import { revalidatePath } from "next/cache"

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

  // 현재 보고 있는 상세 경로(/songs/[id])는 재검증하지 않는다 — 스크랩은 이미 낙관적
  // 업데이트라 즉시 반영되고, 같은 경로 재검증은 현재 라우트를 동기 리렌더(getSong 재조회)
  // 시켜 배경 WebGL 깜빡임/프레임 끊김을 유발했다. revalidatePath 는 "보고 있는 경로일 때만"
  // 즉시 UI 를 갱신하므로(Next 16 문서), /me 만 갱신해도 현재 페이지는 리렌더되지 않는다.
  revalidatePath("/me") // 내 보관함 목록 갱신(다음 방문 시 신선)
  return { ok: true }
}
