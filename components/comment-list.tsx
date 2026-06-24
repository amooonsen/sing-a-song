"use client"

import * as React from "react"
import { HiHeart, HiOutlineHeart } from "react-icons/hi2"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { CommentWithLike } from "@/lib/data/songs"
import { toggleCommentLike } from "@/lib/actions/ratings"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StarRating } from "@/components/star-rating"

function formatDate(iso: string) {
  const d = new Date(iso)
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}.${m}.${day}`
}

type CommentListProps = {
  comments: CommentWithLike[]
  songId: string
}

export function CommentList({ comments, songId }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        아직 한줄평이 없어요 — 첫 한줄평을 남겨보세요.
      </p>
    )
  }
  return (
    <ul className="space-y-3">
      {comments.map((c) => (
        // 안정 key(id) — 서버 재조회로 좋아요 수/하트가 바뀌어도 리마운트하지 않는다.
        // (값 동기화는 CommentItem 이 렌더 중 props 비교로 처리 → 펼침/스포일러 상태 보존)
        <li key={c.id}>
          <CommentItem comment={c} songId={songId} />
        </li>
      ))}
    </ul>
  )
}

function CommentItem({
  comment,
  songId,
}: {
  comment: CommentWithLike
  songId: string
}) {
  const [liked, setLiked] = React.useState(comment.liked_by_me)
  const [count, setCount] = React.useState(comment.like_count)
  const [revealed, setRevealed] = React.useState(!comment.is_spoiler)
  const [expanded, setExpanded] = React.useState(false)
  const [pending, startTransition] = React.useTransition()

  // 서버 truth 가 바뀌면(다른 사용자 좋아요 등으로 재조회) 리마운트 없이 로컬 상태를 재동기화한다.
  // React 권장 "렌더 중 state 조정" 패턴 — 펼침(expanded)·스포일러 공개(revealed) 상태는 보존된다.
  const [serverLike, setServerLike] = React.useState({
    liked: comment.liked_by_me,
    count: comment.like_count,
  })
  if (
    serverLike.liked !== comment.liked_by_me ||
    serverLike.count !== comment.like_count
  ) {
    setServerLike({ liked: comment.liked_by_me, count: comment.like_count })
    setLiked(comment.liked_by_me)
    setCount(comment.like_count)
  }

  const name = comment.profiles?.display_name ?? "탈퇴한 사용자"
  const text = comment.comment ?? ""
  const isLong = text.length > 120

  function onToggleLike() {
    // 낙관적 업데이트 → 실패 시 롤백
    const prevLiked = liked
    const prevCount = count
    setLiked(!prevLiked)
    setCount(prevCount + (prevLiked ? -1 : 1))
    startTransition(async () => {
      const res = await toggleCommentLike(comment.id, songId)
      if (!res.ok) {
        setLiked(prevLiked)
        setCount(prevCount)
        toast.error(res.message)
        return
      }
      // 좋아요를 새로 누른 경우에만(취소 제외) 토스트. 연타 시 같은 id 로 갱신해 스팸 방지.
      if (!prevLiked) {
        toast.success("이 한줄평을 좋아합니다", {
          id: `like-${comment.id}`,
          description: `${name} 님의 한줄평`,
        })
      }
    })
  }

  return (
    <article className="rounded-xl border border-border bg-secondary/40 p-4 transition-colors hover:border-foreground/15">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar size="sm">
            <AvatarFallback>{name.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-medium">{name}</span>
          <StarRating value={comment.rating} readOnly size="sm" />
        </div>
        <time
          dateTime={comment.created_at}
          className="shrink-0 font-mono text-[0.7rem] text-muted-foreground tabular-nums"
        >
          {formatDate(comment.created_at)}
        </time>
      </div>

      {text && (
        <div className="mt-2">
          {revealed ? (
            <>
              <p
                className={cn(
                  "text-[0.95rem] leading-relaxed text-foreground/90",
                  !expanded && isLong && "line-clamp-3"
                )}
              >
                {text}
              </p>
              {isLong && (
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1 cursor-pointer rounded text-xs font-medium text-brand transition-colors hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  {expanded ? "접기" : "더 보기"}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="cursor-pointer rounded text-sm text-muted-foreground italic transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              스포일러가 포함된 한줄평이에요 — 보기
            </button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onToggleLike}
        disabled={pending}
        aria-pressed={liked}
        aria-label="좋아요"
        className={cn(
          "mt-2 inline-flex cursor-pointer items-center gap-1 rounded text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-70",
          liked ? "text-brand" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {liked ? (
          <HiHeart className="size-4" />
        ) : (
          <HiOutlineHeart className="size-4" />
        )}
        <span className="font-mono tabular-nums">{count}</span>
      </button>
    </article>
  )
}
