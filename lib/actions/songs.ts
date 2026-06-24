"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { JAPAN } from "@/lib/constants/countries"
import { createSongSchema, updateSongSchema } from "@/lib/validations/song"
import { ensureProfile } from "@/lib/actions/ensure-profile"

export type ActionResult = { ok: true } | { ok: false; message: string }
export type CreateSongResult =
  | { ok: true; id: string }
  | { ok: false; message: string }

/** 일본 곡일 때만 씹덕/비씹덕 저장, 그 외 국가는 null (DB CHECK 와 일치) */
function resolveOtakuType(country: string, otakuType?: string): string | null {
  return country === JAPAN ? (otakuType ?? null) : null
}

export async function createSong(values: unknown): Promise<CreateSongResult> {
  const parsed = createSongSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, message: "입력값을 확인하세요" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, message: "로그인이 필요합니다" }
  }

  // FK(songs.created_by / song_ratings.user_id → profiles.id) 보장
  await ensureProfile(supabase, user)

  const {
    title,
    artist,
    genre,
    country,
    otakuType,
    rating,
    comment,
    isSpoiler,
    url,
    thumbnailUrl,
    youtubeVideoId,
  } = parsed.data
  // 곡 + 작성자의 첫 평점을 한 트랜잭션에 원자적으로 생성(RPC)
  const { data, error } = await supabase.rpc("create_song_with_rating", {
    p_title: title,
    p_artist: artist,
    p_genre: genre,
    p_country: country,
    p_otaku_type: resolveOtakuType(country, otakuType),
    p_rating: rating,
    p_comment: comment ?? null,
    p_is_spoiler: isSpoiler ?? false,
    p_url: url || null,
    p_thumbnail_url: thumbnailUrl || null,
    p_youtube_video_id: youtubeVideoId || null,
  })
  if (error) {
    console.error("[createSong]", error)
    return { ok: false, message: `등록 실패: ${error.message}` }
  }

  revalidatePath("/")
  return { ok: true, id: data as string }
}

export async function updateSong(
  id: string,
  values: unknown
): Promise<ActionResult> {
  const parsed = updateSongSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, message: "입력값을 확인하세요" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, message: "로그인이 필요합니다" }
  }

  const {
    title,
    artist,
    genre,
    country,
    otakuType,
    url,
    thumbnailUrl,
    youtubeVideoId,
  } = parsed.data
  const { data, error } = await supabase
    .from("songs")
    .update({
      title,
      artist,
      genre,
      country,
      otaku_type: resolveOtakuType(country, otakuType),
      url: url || null,
      thumbnail_url: thumbnailUrl || null,
      youtube_video_id: youtubeVideoId || null,
      updated_by: user.id,
    })
    .eq("id", id)
    .select("id")
  if (error) {
    console.error("[updateSong]", error)
    return { ok: false, message: `수정 실패: ${error.message}` }
  }
  // 0행이면(이미 삭제된 곡 등) PostgREST 는 에러 없이 빈 결과 → 거짓 성공 방지
  if (!data || data.length === 0) {
    return { ok: false, message: "곡을 찾을 수 없어요" }
  }

  revalidatePath("/")
  revalidatePath(`/songs/${id}`)
  return { ok: true }
}

export async function deleteSong(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, message: "로그인이 필요합니다" }
  }

  // song_ratings / comment_likes 는 FK on delete cascade 로 함께 삭제됨
  const { data, error } = await supabase
    .from("songs")
    .delete()
    .eq("id", id)
    .select("id")
  if (error) {
    console.error("[deleteSong]", error)
    return { ok: false, message: `삭제 실패: ${error.message}` }
  }
  // 0행이면(이미 삭제됨) 거짓 성공 방지
  if (!data || data.length === 0) {
    return { ok: false, message: "곡을 찾을 수 없어요" }
  }

  revalidatePath("/")
  revalidatePath(`/songs/${id}`)
  return { ok: true }
}
