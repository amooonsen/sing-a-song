import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 클라이언트 라우터 캐시 유지 시간(초).
    // v15+ 기본값이 dynamic:0 이라 getUser()로 동적 렌더되는 페이지가
    // 뒤로가기 때마다 재요청 → loading.tsx 스켈레톤이 매번 떴다.
    // 짧게라도 캐시해 페이지 왕복 시 즉시 복원되게 한다.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
  },
};

export default nextConfig;
