import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().trim().email("올바른 이메일을 입력하세요"),
  password: z.string().min(6, "비밀번호는 6자 이상이어야 합니다"),
})

export type LoginValues = z.infer<typeof loginSchema>

export const signupSchema = loginSchema
  .extend({
    name: z
      .string()
      .trim()
      .min(1, "이름을 입력하세요")
      .max(50, "이름은 50자 이하로 입력하세요"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  })

export type SignupValues = z.infer<typeof signupSchema>

export const displayNameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "이름을 입력하세요")
    .max(50, "이름은 50자 이하로 입력하세요"),
})

export type DisplayNameValues = z.infer<typeof displayNameSchema>
