"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <p className="text-6xl font-black tracking-tight text-brand">!</p>
      <h2 className="text-lg font-semibold">문제가 발생했어요</h2>
      <p className="text-sm text-muted-foreground">
        잠시 후 다시 시도해 주세요.
      </p>
      <Button onClick={reset} variant="brand">
        다시 시도
      </Button>
    </div>
  )
}
