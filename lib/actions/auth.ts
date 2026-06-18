"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  displayNameSchema,
  loginSchema,
  signupSchema,
} from "@/lib/validations/auth"

export type AuthResult = { ok: true } | { ok: false; message: string }

export async function login(values: unknown): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, message: "입력값을 확인하세요" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) {
    return { ok: false, message: "이메일 또는 비밀번호가 올바르지 않습니다" }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}

export async function signup(values: unknown): Promise<AuthResult> {
  const parsed = signupSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, message: "입력값을 확인하세요" }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.name } },
  })
  if (error) {
    return { ok: false, message: error.message }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}

export async function updateDisplayName(values: unknown): Promise<AuthResult> {
  const parsed = displayNameSchema.safeParse(values)
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "입력값을 확인하세요",
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { ok: false, message: "로그인이 필요합니다" }
  }

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name: parsed.data.name }, { onConflict: "id" })
  if (error) {
    console.error("[updateDisplayName]", error)
    return { ok: false, message: `이름 변경 실패: ${error.message}` }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
