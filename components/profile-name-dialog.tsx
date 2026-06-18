"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CgSpinner } from "react-icons/cg"
import { toast } from "sonner"

import { updateDisplayName } from "@/lib/actions/auth"
import {
  displayNameSchema,
  type DisplayNameValues,
} from "@/lib/validations/auth"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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

type ProfileNameDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentName: string
}

export function ProfileNameDialog({
  open,
  onOpenChange,
  currentName,
}: ProfileNameDialogProps) {
  const router = useRouter()
  const form = useForm<DisplayNameValues>({
    resolver: zodResolver(displayNameSchema),
    defaultValues: { name: currentName },
  })

  React.useEffect(() => {
    if (open) form.reset({ name: currentName })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, currentName])

  async function onSubmit(values: DisplayNameValues) {
    const res = await updateDisplayName(values)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success("이름이 변경되었어요")
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>이름 변경</DialogTitle>
          <DialogDescription>
            목록과 헤더에 표시되는 이름이에요.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>이름</FormLabel>
                  <FormControl>
                    <Input autoFocus placeholder="표시될 이름" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
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
