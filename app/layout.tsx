import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"
import localFont from "next/font/local"
import "./globals.css"

import { ThemeProvider } from "@/components/theme-provider"
import { RefreshProvider } from "@/components/refresh-provider"
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
  title: "노래 추천",
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
      suppressHydrationWarning
      className={`${pretendard.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <RefreshProvider>
            {children}
            <Toaster richColors position="top-center" />
          </RefreshProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
