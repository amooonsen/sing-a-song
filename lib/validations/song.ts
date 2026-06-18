import { z } from "zod"

import { GENRES } from "@/lib/constants/genres"
import { COUNTRIES, JAPAN, OTAKU_TYPES } from "@/lib/constants/countries"

export const songSchema = z
  .object({
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
    country: z.enum(COUNTRIES, {
      errorMap: () => ({ message: "국적을 선택하세요" }),
    }),
    // 일본 곡일 때만 사용. 그 외 국가는 서버 액션에서 null 로 정규화.
    otakuType: z.enum(OTAKU_TYPES).optional(),
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
  .refine((data) => data.country !== JAPAN || Boolean(data.otakuType), {
    message: "씹덕/비씹덕을 선택하세요",
    path: ["otakuType"],
  })

export type SongFormValues = z.infer<typeof songSchema>
