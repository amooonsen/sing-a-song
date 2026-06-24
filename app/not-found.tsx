import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="text-7xl font-black tracking-tight text-brand">404</p>
      <h2 className="text-lg font-semibold">페이지를 찾을 수 없어요</h2>
      <Button asChild variant="brand">
        <Link href="/">홈으로</Link>
      </Button>
    </div>
  )
}
