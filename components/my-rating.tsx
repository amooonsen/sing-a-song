"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CgSpinner } from "react-icons/cg"
import { toast } from "sonner"

import { ratingSchema, type RatingFormValues } from "@/lib/validations/rating"
import { rateSong, deleteMyRating } from "@/lib/actions/ratings"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form"
import { StarRating } from "@/components/star-rating"
import { useRefresh } from "@/components/refresh-provider"

type MyRatingProps = {
  songId: string
  /** 이미 평가했다면 기존 값(prefill) */
  mine: { rating: number; comment: string | null; is_spoiler: boolean } | null
}

export function MyRating({ songId, mine }: MyRatingProps) {
  const { refresh } = useRefresh()
  const [deleting, setDeleting] = React.useState(false)

  const form = useForm<RatingFormValues>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      rating: mine?.rating ?? 0,
      comment: mine?.comment ?? "",
      isSpoiler: mine?.is_spoiler ?? false,
    },
  })

  async function onSubmit(values: RatingFormValues) {
    const res = await rateSong(songId, values)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success(mine ? "평가를 수정했어요" : "평가를 남겼어요")
    refresh()
  }

  async function onDelete() {
    setDeleting(true)
    const res = await deleteMyRating(songId)
    setDeleting(false)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success("평가를 삭제했어요")
    form.reset({ rating: 0, comment: "", isSpoiler: false })
    refresh()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="rating"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <StarRating
                  size="lg"
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
              <FormControl>
                <Textarea
                  rows={2}
                  placeholder="한줄평을 남겨보세요 (선택)"
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

        <div className="flex items-center gap-2">
          <Button
            type="submit"
            variant="brand"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && (
              <CgSpinner className="size-4 animate-spin" />
            )}
            {mine ? "평가 수정" : "평가 남기기"}
          </Button>
          {mine && (
            <Button
              type="button"
              variant="destructive"
              onClick={onDelete}
              disabled={deleting}
            >
              {deleting && <CgSpinner className="size-4 animate-spin" />}
              삭제
            </Button>
          )}
        </div>
      </form>
    </Form>
  )
}
