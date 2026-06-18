import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <h2 className="text-lg font-semibold">페이지를 찾을 수 없어요</h2>
      <Button asChild>
        <Link href="/">홈으로</Link>
      </Button>
    </div>
  )
}
