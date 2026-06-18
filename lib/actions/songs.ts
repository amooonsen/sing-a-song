"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { JAPAN } from "@/lib/constants/countries"
import { songSchema, type SongFormValues } from "@/lib/validations/song"

export type ActionResult = { ok: true } | { ok: false; message: string }

function normalizeDescription(description?: string): string | null {
  const trimmed = description?.trim()
  return trimmed ? trimmed : null
}

/** 일본 곡일 때만 씹덕/비씹덕 저장, 그 외 국가는 null (DB CHECK 와 일치) */
function resolveOtakuType(
  country: SongFormValues["country"],
  otakuType: SongFormValues["otakuType"]
): string | null {
  return country === JAPAN ? (otakuType ?? null) : null
}

export async function createSong(values: unknown): Promise<ActionResult> {
  const parsed = songSchema.safeParse(values)
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

  // FK(songs.created_by -> profiles.id) 보장: 가입 트리거 누락 대비 본인 프로필 self-heal
  await supabase.from("profiles").upsert(
    { id: user.id, display_name: user.email?.split("@")[0] ?? "사용자" },
    { onConflict: "id", ignoreDuplicates: true }
  )

  const { title, artist, genre, country, otakuType, description, rating } =
    parsed.data
  const { error } = await supabase.from("songs").insert({
    title,
    artist,
    genre,
    country,
    otaku_type: resolveOtakuType(country, otakuType),
    description: normalizeDescription(description),
    rating,
    created_by: user.id,
  })
  if (error) {
    console.error("[createSong]", error)
    return { ok: false, message: `등록 실패: ${error.message}` }
  }

  revalidatePath("/")
  return { ok: true }
}

export async function updateSong(
  id: string,
  values: unknown
): Promise<ActionResult> {
  const parsed = songSchema.safeParse(values)
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

  const { title, artist, genre, country, otakuType, description, rating } =
    parsed.data
  const { error } = await supabase
    .from("songs")
    .update({
      title,
      artist,
      genre,
      country,
      otaku_type: resolveOtakuType(country, otakuType),
      description: normalizeDescription(description),
      rating,
      updated_by: user.id,
    })
    .eq("id", id)
  if (error) {
    console.error("[updateSong]", error)
    return { ok: false, message: `수정 실패: ${error.message}` }
  }

  revalidatePath("/")
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

  const { error } = await supabase.from("songs").delete().eq("id", id)
  if (error) {
    console.error("[deleteSong]", error)
    return { ok: false, message: `삭제 실패: ${error.message}` }
  }

  revalidatePath("/")
  return { ok: true }
}
