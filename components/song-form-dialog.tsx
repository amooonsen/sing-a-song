"use client"

import * as React from "react"
import { useForm, useWatch, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CgSpinner } from "react-icons/cg"
import { toast } from "sonner"

import { GENRES } from "@/lib/constants/genres"
import { COUNTRIES, JAPAN, OTAKU_TYPES } from "@/lib/constants/countries"
import { countryColorVar } from "@/lib/country-style"
import {
  createSongSchema,
  updateSongSchema,
  type CreateSongValues,
} from "@/lib/validations/song"
import { createSong, updateSong } from "@/lib/actions/songs"
import { searchYouTube } from "@/lib/actions/youtube"
import type { YouTubeMatch } from "@/lib/youtube"
import { AddSongCta } from "@/components/add-song-cta"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { StarRating } from "@/components/star-rating"
import { useRefresh } from "@/components/refresh-provider"

/** 수정 다이얼로그가 받는 곡 메타데이터(평점/한줄평 제외 — 평가는 상세 페이지에서) */
export type SongFormData = {
  id: string
  title: string
  artist: string
  genre: string
  country: string
  otakuType: string | null
  url: string | null
  thumbnailUrl: string | null
  youtubeVideoId: string | null
}

type SongFormDialogProps = {
  /** edit 모드면 기존 곡 메타데이터 */
  song?: SongFormData
  /** controlled open (카드 메뉴에서 수정 열 때) */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** create 모드에서 사용할 트리거 (없으면 기본 "곡 추가" 버튼) */
  showTrigger?: boolean
}

export function SongFormDialog({
  song,
  open,
  onOpenChange,
  showTrigger = false,
}: SongFormDialogProps) {
  const { refresh } = useRefresh()
  const isEdit = Boolean(song)
  const [internalOpen, setInternalOpen] = React.useState(false)

  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  const setOpen = (next: boolean) => {
    if (isControlled) onOpenChange?.(next)
    else setInternalOpen(next)
  }

  // 폼 값 타입은 생성 스키마(상위집합)로 통일. 수정 모드에선 rating/comment/isSpoiler 미사용.
  const form = useForm<CreateSongValues>({
    resolver: zodResolver(
      isEdit ? updateSongSchema : createSongSchema
    ) as unknown as Resolver<CreateSongValues>,
    defaultValues: {
      title: "",
      artist: "",
      url: "",
      thumbnailUrl: "",
      youtubeVideoId: "",
      comment: "",
      rating: 0,
      isSpoiler: false,
    },
  })

  const watchedCountry = useWatch({ control: form.control, name: "country" })

  // YouTube 파인더(선택) — 검색어/링크 → 매치 → 선택 시 제목·가수·썸네일 자동 채움.
  // URL/ID 입력이면 1유닛(videos.list), 일반 검색이면 100유닛(search.list, 24h 캐시).
  const pickedThumb = useWatch({ control: form.control, name: "thumbnailUrl" })
  const watchedTitle = useWatch({ control: form.control, name: "title" })
  const [ytText, setYtText] = React.useState("")
  const [ytMatches, setYtMatches] = React.useState<YouTubeMatch[]>([])
  const [ytNote, setYtNote] = React.useState<string | null>(null)
  const [ytPending, startYt] = React.useTransition()
  const ytReq = React.useRef(0)

  // 다이얼로그가 새로 열릴 때 파인더 상태 초기화 (렌더 중 보정 — search-bar 패턴)
  const [finderMark, setFinderMark] = React.useState(isOpen)
  if (isOpen !== finderMark) {
    setFinderMark(isOpen)
    if (isOpen) {
      setYtText("")
      setYtMatches([])
      setYtNote(null)
    }
  }

  // 입력 디바운스(300ms). 오래된 응답은 무시(stale guard).
  React.useEffect(() => {
    const q = ytText.trim()
    if (q.length < 2) return
    const handler = setTimeout(() => {
      const reqId = ++ytReq.current
      startYt(async () => {
        const res = await searchYouTube(q)
        if (reqId !== ytReq.current) return
        if (!res.ok) {
          setYtMatches([])
          setYtNote(res.message)
          return
        }
        setYtNote(null)
        setYtMatches(res.matches)
      })
    }, 300)
    return () => clearTimeout(handler)
  }, [ytText])

  function pickYouTube(m: YouTubeMatch) {
    form.setValue("title", m.title, { shouldValidate: true })
    form.setValue("artist", m.channelTitle, { shouldValidate: true })
    form.setValue("url", m.url)
    form.setValue("thumbnailUrl", m.thumbnailUrl)
    form.setValue("youtubeVideoId", m.videoId)
    setYtMatches([])
    setYtText("")
    setYtNote(null)
  }

  function clearYouTube() {
    form.setValue("url", "")
    form.setValue("thumbnailUrl", "")
    form.setValue("youtubeVideoId", "")
  }

  // 다이얼로그가 열릴 때 폼 초기화(create=빈 값, edit=기존 메타데이터)
  React.useEffect(() => {
    if (!isOpen) return
    if (song) {
      form.reset({
        title: song.title,
        artist: song.artist,
        genre: song.genre as CreateSongValues["genre"],
        country: song.country as CreateSongValues["country"],
        otakuType: (song.otakuType ??
          undefined) as CreateSongValues["otakuType"],
        url: song.url ?? "",
        thumbnailUrl: song.thumbnailUrl ?? "",
        youtubeVideoId: song.youtubeVideoId ?? "",
        rating: 0,
        comment: "",
        isSpoiler: false,
      })
    } else {
      form.reset({
        title: "",
        artist: "",
        url: "",
        thumbnailUrl: "",
        youtubeVideoId: "",
        comment: "",
        rating: 0,
        isSpoiler: false,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, song])

  async function onSubmit(values: CreateSongValues) {
    const res = isEdit
      ? await updateSong(song!.id, values)
      : await createSong(values)

    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(isEdit ? "곡이 수정되었어요" : "곡이 추가되었어요")
    setOpen(false)
    refresh()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(next) => {
        // 저장 중에는 닫기 방지
        if (!next && form.formState.isSubmitting) return
        setOpen(next)
      }}
    >
      {showTrigger && (
        <DialogTrigger asChild>
          <AddSongCta />
        </DialogTrigger>
      )}
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 px-4 pt-4">
          <DialogTitle>{isEdit ? "곡 수정" : "곡 추가"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "곡 정보를 수정하세요. 평점·한줄평은 상세 페이지에서 남길 수 있어요."
              : "곡 정보와 내 첫 평가(별점·한줄평)를 입력하세요."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 min-w-0 flex-1 flex-col"
          >
            {/* 본문만 스크롤 — 헤더/푸터는 고정. min-w-0 로 긴 제목 가로 넘침 방지 */}
            <div className="min-w-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {/* YouTube 파인더 — 선택. 제목·가수·썸네일 자동 채움 */}
            <div className="space-y-2">
              <p className="text-sm font-medium">
                YouTube에서 찾기{" "}
                <span className="font-normal text-muted-foreground">(선택)</span>
              </p>
              {pickedThumb ? (
                <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pickedThumb}
                    alt=""
                    className="size-12 shrink-0 rounded-md object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {watchedTitle || "선택된 영상"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      YouTube 썸네일 연결됨
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={clearYouTube}
                  >
                    지우기
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    value={ytText}
                    onChange={(e) => setYtText(e.target.value)}
                    placeholder="곡 제목 검색 또는 YouTube 링크 붙여넣기"
                  />
                  {ytPending && (
                    <CgSpinner className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                  )}
                  {ytText.trim().length >= 2 && ytMatches.length > 0 && (
                    <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg">
                      {ytMatches.map((m) => (
                        <li key={m.videoId}>
                          <button
                            type="button"
                            onClick={() => pickYouTube(m)}
                            className="flex w-full cursor-pointer items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={m.thumbnailUrl}
                              alt=""
                              className="size-10 shrink-0 rounded object-cover"
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium">
                                {m.title}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">
                                {m.channelTitle}
                              </span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {ytText.trim().length >= 2 && ytNote && (
                    <p className="mt-1 text-xs text-muted-foreground">{ytNote}</p>
                  )}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>제목</FormLabel>
                  <FormControl>
                    <Input placeholder="곡 제목" autoFocus {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="artist"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>가수</FormLabel>
                  <FormControl>
                    <Input placeholder="가수명" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>국적</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => {
                      field.onChange(v)
                      // 일본이 아니면 씹덕/비씹덕 값 초기화
                      if (v !== JAPAN) {
                        form.setValue("otakuType", undefined, {
                          shouldValidate: true,
                        })
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="국적 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          <span className="flex items-center gap-2">
                            <span
                              aria-hidden
                              className="size-2 rounded-full"
                              style={{ background: countryColorVar(c) }}
                            />
                            {c}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {watchedCountry === JAPAN && (
              <FormField
                control={form.control}
                name="otakuType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>씹덕 / 비씹덕</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="분류 선택" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OTAKU_TYPES.map((o) => (
                          <SelectItem key={o} value={o}>
                            {o}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="genre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>장르</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="장르 선택" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENRES.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* create 모드에서만: 내 첫 평가(별점 + 한줄평 + 스포일러) */}
            {!isEdit && (
              <>
                <FormField
                  control={form.control}
                  name="rating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>내 별점</FormLabel>
                      <FormControl>
                        <StarRating
                          value={field.value ?? 0}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>한줄평 (선택)</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="이 곡에 대한 한줄평을 남겨주세요"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isSpoiler"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                          <input
                            type="checkbox"
                            checked={field.value ?? false}
                            onChange={(e) => field.onChange(e.target.checked)}
                            className="size-4"
                            style={{ accentColor: "var(--brand)" }}
                          />
                          스포일러 포함
                        </label>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </>
            )}
            </div>

            <DialogFooter className="mx-0 mb-0 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button
                type="submit"
                variant="brand"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting && (
                  <CgSpinner className="size-4 animate-spin" />
                )}
                저장
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
