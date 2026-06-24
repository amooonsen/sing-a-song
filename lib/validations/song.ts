import { z } from "zod"

import { GENRES } from "@/lib/constants/genres"
import { COUNTRIES, JAPAN, OTAKU_TYPES } from "@/lib/constants/countries"
import { ratingValue, commentValue } from "@/lib/validations/rating"

/** 곡 메타데이터(생성/수정 공통) */
const songMetadata = z.object({
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
  // 일본 곡일 때만 사용. 그 외 국가는 서버 액션/RPC 에서 null 로 정규화.
  otakuType: z.enum(OTAKU_TYPES).optional(),
  // YouTube 연동(선택). 빈 문자열("")도 허용 — 폼이 미입력 시 "" 를 보냄.
  url: z
    .string()
    .trim()
    .url("올바른 URL 이 아니에요")
    .max(500)
    .optional()
    .or(z.literal("")),
  thumbnailUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  youtubeVideoId: z.string().trim().max(20).optional().or(z.literal("")),
})

const otakuRefine = (data: { country: string; otakuType?: string }) =>
  data.country !== JAPAN || Boolean(data.otakuType)
const otakuRefineOpts = {
  message: "씹덕/비씹덕을 선택하세요",
  path: ["otakuType"],
}

/** 수정: 메타데이터만 (평점/한줄평은 상세 페이지 "내 평가"에서) */
export const updateSongSchema = songMetadata.refine(otakuRefine, otakuRefineOpts)
export type UpdateSongValues = z.infer<typeof updateSongSchema>

/**
 * 생성: 메타데이터 + 작성자의 첫 평점 + 한줄평.
 * zod 3: .refine 은 ZodEffects 라 이후 .extend 불가 → 객체에 먼저 extend, 그 뒤 refine.
 */
export const createSongSchema = songMetadata
  .extend({
    rating: ratingValue,
    comment: commentValue,
    isSpoiler: z.boolean().optional(),
  })
  .refine(otakuRefine, otakuRefineOpts)
export type CreateSongValues = z.infer<typeof createSongSchema>
