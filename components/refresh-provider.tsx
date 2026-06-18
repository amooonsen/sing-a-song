"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"

type RefreshContextValue = {
  /** 서버 컴포넌트 데이터 재조회 + 상단 로딩바 표시 */
  refresh: () => void
  isRefreshing: boolean
}

const RefreshContext = React.createContext<RefreshContextValue | null>(null)

/**
 * CRUD(등록/수정/삭제) 후 목록 재조회 시 상단 프로그레스 바로 로딩을 표시한다.
 * router.refresh() 를 transition 으로 감싸 재조회가 끝날 때까지 isRefreshing 을 유지.
 */
export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isRefreshing, startTransition] = React.useTransition()

  const refresh = React.useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  const value = React.useMemo(
    () => ({ refresh, isRefreshing }),
    [refresh, isRefreshing]
  )

  return (
    <RefreshContext.Provider value={value}>
      <TopProgressBar active={isRefreshing} />
      {children}
    </RefreshContext.Provider>
  )
}

export function useRefresh() {
  const ctx = React.useContext(RefreshContext)
  if (!ctx) {
    throw new Error("useRefresh must be used within RefreshProvider")
  }
  return ctx
}

function TopProgressBar({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden={!active}
      role="progressbar"
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-60 h-0.5 overflow-hidden transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0"
      )}
    >
      {active && (
        <div className="loading-bar-indicator h-full w-1/3 bg-primary" />
      )}
    </div>
  )
}
