import { z } from "zod"

/** 반별점: 0.5~5.0, 0.5 단위 (왓챠 평가 시스템) */
export const ratingValue = z.coerce
  .number()
  .min(0.5, "별점을 선택하세요")
  .max(5, "별점은 최대 5점입니다")
  .refine((v) => Number.isInteger(v * 2), "0.5 단위로 선택하세요")

/** 한줄평 (선택, 1000자 이하) */
export const commentValue = z
  .string()
  .trim()
  .max(1000, "한줄평은 1000자 이하로 입력하세요")
  .optional()

/** 상세 페이지 "내 평가" 폼 */
export const ratingSchema = z.object({
  rating: ratingValue,
  comment: commentValue,
  isSpoiler: z.boolean().optional(),
})

export type RatingFormValues = z.infer<typeof ratingSchema>
