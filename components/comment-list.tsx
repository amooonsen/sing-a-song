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
        // 키에 like_count/liked_by_me 포함 → 서버 재조회(refresh)로 값이 바뀌면
        // 리마운트되어 낙관적 로컬 상태(좋아요 수/하트)가 최신 props 로 갱신된다.
        <li key={`${c.id}-${c.like_count}-${c.liked_by_me}`}>
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
                  className="mt-1 text-xs font-medium text-brand hover:underline"
                >
                  {expanded ? "접기" : "더 보기"}
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="text-sm text-muted-foreground italic hover:text-foreground"
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
          "mt-2 inline-flex items-center gap-1 text-xs font-medium transition-colors",
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
