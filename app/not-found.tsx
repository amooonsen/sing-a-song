import Link from "next/link"

import { Fuzzy404 } from "@/components/fuzzy-404"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <div role="img" aria-label="404">
        <Fuzzy404 />
      </div>
      <h2 className="text-lg font-semibold">페이지를 찾을 수 없어요</h2>
      <Button asChild variant="brand">
        <Link href="/">홈으로</Link>
      </Button>
    </div>
  )
}
