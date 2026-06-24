import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"
import localFont from "next/font/local"
import NextTopLoader from "nextjs-toploader"
import "./globals.css"

import { SiteBackdrop } from "@/components/site-backdrop"
// 유리 렌즈 커서(fluid-glass) — 일단 비활성화. 다시 켜려면 아래 import 와 <GlassCursor /> 주석 해제.
// import GlassCursor from "@/components/glass-cursor"
import { RefreshProvider } from "@/components/refresh-provider"
import { SmoothScrollProvider } from "@/components/smooth-scroll-provider"
import { Toaster } from "@/components/ui/sonner"

// 본문·UI 한글 서체. 가변 woff2 자가호스팅 → 한글이 더 이상 OS 폴백으로 떨어지지 않는다.
const pretendard = localFont({
  src: "./fonts/PretendardVariable.woff2",
  variable: "--font-sans",
  display: "swap",
  weight: "45 920",
})

// 날짜/메타 등 라이너 노트 디테일용 모노.
const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "OCHU",
  description: "함께 만드는 노래 추천 리스트",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="ko"
      className={`dark ${pretendard.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <SiteBackdrop />
        {/* <GlassCursor /> */}
        <NextTopLoader
          color="#ff4d7d"
          height={3}
          showSpinner={false}
          shadow="0 0 10px #ff4d7d,0 0 5px #9b5de5"
        />
        <SmoothScrollProvider>
          <RefreshProvider>
            {children}
            <Toaster richColors position="top-center" />
          </RefreshProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  )
}
