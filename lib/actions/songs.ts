"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/lib/supabase/server"
import { songSchema } from "@/lib/validations/song"

export type ActionResult = { ok: true } | { ok: false; message: string }

function normalizeDescription(description?: string): string | null {
  const trimmed = description?.trim()
  return trimmed ? trimmed : null
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

  const { title, artist, genre, description, rating } = parsed.data
  const { error } = await supabase.from("songs").insert({
    title,
    artist,
    genre,
    description: normalizeDescription(description),
    rating,
    created_by: user.id,
  })
  if (error) {
    return { ok: false, message: "등록에 실패했습니다. 잠시 후 다시 시도해 주세요" }
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

  const { title, artist, genre, description, rating } = parsed.data
  const { error } = await supabase
    .from("songs")
    .update({
      title,
      artist,
      genre,
      description: normalizeDescription(description),
      rating,
      updated_by: user.id,
    })
    .eq("id", id)
  if (error) {
    return { ok: false, message: "수정에 실패했습니다. 잠시 후 다시 시도해 주세요" }
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
    return { ok: false, message: "삭제에 실패했습니다. 잠시 후 다시 시도해 주세요" }
  }

  revalidatePath("/")
  return { ok: true }
}
