import { type NextRequest } from "next/server"

import { updateSession } from "@/lib/supabase/middleware"

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 다음을 제외한 모든 요청 경로에 매칭:
     * - _next/static, _next/image (정적 자산)
     * - favicon.ico, public/assets/* (3D 모델 등 정적 에셋 — 인증 게이트 금지)
     * - 이미지/모델 파일 확장자
     */
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb|gltf|ico)$).*)",
  ],
}
