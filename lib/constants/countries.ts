/**
 * 노래 국적 캐노니컬 목록 — 단일 출처(single source of truth).
 * Select 옵션 · zod enum · SQL CHECK(songs_country_check) 와 모두 일치해야 한다.
 */
export const COUNTRIES = ["한국", "일본", "서양", "기타"] as const

export type Country = (typeof COUNTRIES)[number]

/** 씹덕/비씹덕 분류가 적용되는 국가 */
export const JAPAN = "일본" satisfies Country

/**
 * 일본 곡 전용 분류: 씹덕(애니/보컬로/성우/아이돌 등) vs 비씹덕(일반 J-POP 등).
 * SQL CHECK(songs_otaku_check) 와 일치해야 한다.
 */
export const OTAKU_TYPES = ["씹덕", "비씹덕"] as const

export type OtakuType = (typeof OTAKU_TYPES)[number]

/** 필터의 "전체" 옵션 값 */
export const ALL_COUNTRIES = "all" as const
export const ALL_OTAKU = "all" as const
