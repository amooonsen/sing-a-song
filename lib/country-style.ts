import type { Country } from "@/lib/constants/countries"

/**
 * 국적 → 의미색 CSS 변수 매핑 (표시 레이어 전용).
 * 도메인 단일 출처(lib/constants/countries.ts)와 분리해, 색은 UI에서만 결정한다.
 * globals.css 의 --country-* 토큰을 가리키므로 라이트/다크가 자동 대응된다.
 */
export const COUNTRY_COLOR_VAR: Record<Country, string> = {
  한국: "var(--country-kr)",
  일본: "var(--country-jp)",
  서양: "var(--country-west)",
  기타: "var(--country-etc)",
}

/** 알 수 없는 값이 와도 안전하게 중립색으로 폴백. */
export function countryColorVar(country: string): string {
  return COUNTRY_COLOR_VAR[country as Country] ?? "var(--muted-foreground)"
}
