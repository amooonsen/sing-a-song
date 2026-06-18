/**
 * 장르 캐노니컬 목록 — 단일 출처(single source of truth).
 * 이 배열이 Select 옵션 · zod enum · SQL CHECK 제약과 모두 일치해야 한다.
 * 값을 추가/변경하면 migration 의 songs_genre_check 도 함께 수정할 것.
 */
export const GENRES = [
  "발라드",
  "댄스",
  "힙합",
  "R&B",
  "록",
  "인디",
  "재즈",
  "클래식",
  "트로트",
  "OST",
  "K-팝",
  "팝",
] as const

export type Genre = (typeof GENRES)[number]

/** 장르 필터의 "전체" 옵션 값 */
export const ALL_GENRES = "all" as const
