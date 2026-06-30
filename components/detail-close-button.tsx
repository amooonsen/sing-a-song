"use client"

import { useRouter } from "next/navigation"
import { HiXMark } from "react-icons/hi2"

import { Button } from "@/components/ui/button"

/**
 * 곡 상세 닫기(X). 히스토리가 있으면 직전 화면으로 돌아가고,
 * 딥링크로 바로 들어온 경우(히스토리 없음)엔 선곡집 홈으로 보낸다.
 */
export function DetailCloseButton() {
  const router = useRouter()
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label="닫기"
      className="rounded-full"
      onClick={() => {
        if (window.history.length > 1) router.back()
        else router.push("/")
      }}
    >
      <HiXMark className="size-5" />
    </Button>
  )
}
