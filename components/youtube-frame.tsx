import { cn } from "@/lib/utils"

type YouTubeFrameProps = {
  videoId: string
  title: string
  className?: string
}

/** 자동재생 인라인 임베드(개인정보 보호 도메인). 부모는 position:relative + 크기 지정. */
export function YouTubeFrame({ videoId, title, className }: YouTubeFrameProps) {
  return (
    <iframe
      src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen
      className={cn("absolute inset-0 size-full", className)}
    />
  )
}
