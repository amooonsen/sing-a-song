import { z } from "zod"

import { GENRES } from "@/lib/constants/genres"

export const songSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "제목을 입력하세요")
    .max(200, "제목은 200자 이하로 입력하세요"),
  artist: z
    .string()
    .trim()
    .min(1, "가수를 입력하세요")
    .max(100, "가수는 100자 이하로 입력하세요"),
  genre: z.enum(GENRES, {
    errorMap: () => ({ message: "장르를 선택하세요" }),
  }),
  description: z
    .string()
    .trim()
    .max(1000, "설명은 1000자 이하로 입력하세요")
    .optional(),
  rating: z.coerce
    .number()
    .int()
    .min(1, "별점을 선택하세요")
    .max(5, "별점은 최대 5점입니다"),
})

export type SongFormValues = z.infer<typeof songSchema>
