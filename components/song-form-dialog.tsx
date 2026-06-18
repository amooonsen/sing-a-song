"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CgSpinner } from "react-icons/cg"
import { HiOutlinePlus } from "react-icons/hi2"
import { toast } from "sonner"

import { GENRES } from "@/lib/constants/genres"
import { COUNTRIES, JAPAN, OTAKU_TYPES } from "@/lib/constants/countries"
import { songSchema, type SongFormValues } from "@/lib/validations/song"
import { createSong, updateSong } from "@/lib/actions/songs"
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

export type SongFormData = {
  id: string
  title: string
  artist: string
  genre: string
  country: string
  otakuType: string | null
  description: string | null
  rating: number
}

type SongFormDialogProps = {
  /** edit 모드면 기존 곡 데이터 */
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

  const form = useForm<SongFormValues>({
    resolver: zodResolver(songSchema),
    defaultValues: {
      title: "",
      artist: "",
      description: "",
      rating: 0,
    },
  })

  const watchedCountry = useWatch({ control: form.control, name: "country" })

  // 다이얼로그가 열릴 때 폼 초기화(create=빈 값, edit=기존 값)
  React.useEffect(() => {
    if (!isOpen) return
    if (song) {
      form.reset({
        title: song.title,
        artist: song.artist,
        genre: song.genre as SongFormValues["genre"],
        country: song.country as SongFormValues["country"],
        otakuType: (song.otakuType ?? undefined) as SongFormValues["otakuType"],
        description: song.description ?? "",
        rating: song.rating,
      })
    } else {
      form.reset({ title: "", artist: "", description: "", rating: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, song])

  async function onSubmit(values: SongFormValues) {
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
          <Button>
            <HiOutlinePlus className="size-4" /> 곡 추가
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "곡 수정" : "곡 추가"}</DialogTitle>
          <DialogDescription>
            함께 보는 추천 리스트에 곡 정보를 입력하세요.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                          {c}
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
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
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

            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>별점</FormLabel>
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
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>추천 사유 (선택)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="이 곡을 추천하는 이유를 적어주세요"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
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
