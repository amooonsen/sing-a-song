"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { ratingSchema } from "@/lib/validations/rating"
import { ensureProfile } from "@/lib/actions/ensure-profile"
import type { ActionResult } from "@/lib/actions/songs"

/** 곡에 대한 내 평점/한줄평 등록·수정 (UPSERT: 사용자당 1행) */
export async function rateSong(
  songId: string,
  values: unknown
): Promise<ActionResult> {
  const parsed = ratingSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, message: "별점을 확인하세요" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, message: "로그인이 필요합니다" }
  }

  // FK(song_ratings.user_id → profiles.id) 보장 (작성자가 아닌 평가자도 필요)
  await ensureProfile(supabase, user)

  const { rating, comment, isSpoiler } = parsed.data
  const { error } = await supabase.from("song_ratings").upsert(
    {
      song_id: songId,
      user_id: user.id,
      rating,
      comment: comment?.trim() ? comment.trim() : null,
      is_spoiler: isSpoiler ?? false,
    },
    { onConflict: "song_id,user_id" }
  )
  if (error) {
    console.error("[rateSong]", error)
    return { ok: false, message: `평가 실패: ${error.message}` }
  }

  revalidatePath("/") // 평점순/인기순 정렬·평균 변동 → 홈 카드 반영
  revalidatePath(`/songs/${songId}`)
  return { ok: true }
}

/** 내 평점 삭제 */
export async function deleteMyRating(songId: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, message: "로그인이 필요합니다" }
  }

  const { error } = await supabase
    .from("song_ratings")
    .delete()
    .eq("song_id", songId)
    .eq("user_id", user.id) // RLS 도 본인 행만 허용하지만 명시
  if (error) {
    console.error("[deleteMyRating]", error)
    return { ok: false, message: `삭제 실패: ${error.message}` }
  }

  revalidatePath("/")
  revalidatePath(`/songs/${songId}`)
  return { ok: true }
}

/** 한줄평 좋아요 토글 (멱등) */
export async function toggleCommentLike(
  songRatingId: string,
  songId: string
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, message: "로그인이 필요합니다" }
  }

  await ensureProfile(supabase, user)

  // 이미 좋아요면 삭제, 아니면 삽입
  const { data: existing } = await supabase
    .from("comment_likes")
    .select("song_rating_id")
    .eq("song_rating_id", songRatingId)
    .eq("user_id", user.id)
    .maybeSingle()

  // 삭제는 0행이어도 무에러(멱등). 삽입은 동시 요청 시 PK 충돌(23505)이 날 수 있어
  // ignoreDuplicates upsert 로 멱등 처리(다른 탭/기기 동시 좋아요의 거짓 실패 방지).
  const { error } = existing
    ? await supabase
        .from("comment_likes")
        .delete()
        .eq("song_rating_id", songRatingId)
        .eq("user_id", user.id)
    : await supabase
        .from("comment_likes")
        .upsert(
          { song_rating_id: songRatingId, user_id: user.id },
          { onConflict: "song_rating_id,user_id", ignoreDuplicates: true }
        )

  if (error) {
    console.error("[toggleCommentLike]", error)
    return { ok: false, message: `좋아요 실패: ${error.message}` }
  }

  // 홈 카드는 좋아요 수를 표시하지 않으므로 상세 경로만 갱신
  revalidatePath(`/songs/${songId}`)
  return { ok: true }
}
