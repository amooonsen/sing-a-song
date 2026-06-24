"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useTopLoader } from "nextjs-toploader"

type RefreshContextValue = {
  /** 서버 컴포넌트 데이터 재조회 + 상단 로딩바 표시 */
  refresh: () => void
  isRefreshing: boolean
}

const RefreshContext = React.createContext<RefreshContextValue | null>(null)

/**
 * CRUD(등록/수정/삭제) 후 목록 재조회 시 상단 프로그레스 바로 로딩을 표시한다.
 * router.refresh() 를 transition 으로 감싸 재조회가 끝날 때까지 isRefreshing 을 유지하고,
 * nextjs-toploader 의 동일한 바를 start/done 으로 구동해 라우트 이동 로딩바와 시각적으로 일치시킨다.
 */
export function RefreshProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const loader = useTopLoader()
  const [isRefreshing, startTransition] = React.useTransition()

  const refresh = React.useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  // router.refresh() 는 라우트 이동이 아니라 toploader 가 자동 감지하지 못함 → 수동 구동.
  React.useEffect(() => {
    if (isRefreshing) loader.start()
    else loader.done()
    // loader 액션은 매 렌더 새 객체지만 nprogress 싱글턴 래퍼 → isRefreshing 변화에만 반응.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRefreshing])

  const value = React.useMemo(
    () => ({ refresh, isRefreshing }),
    [refresh, isRefreshing]
  )

  return (
    <RefreshContext.Provider value={value}>{children}</RefreshContext.Provider>
  )
}

export function useRefresh() {
  const ctx = React.useContext(RefreshContext)
  if (!ctx) {
    throw new Error("useRefresh must be used within RefreshProvider")
  }
  return ctx
}
