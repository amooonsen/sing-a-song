"use client"

import * as React from "react"
import { CgSpinner } from "react-icons/cg"
import { toast } from "sonner"

import { deleteSong } from "@/lib/actions/songs"
import { useRefresh } from "@/components/refresh-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type DeleteSongDialogProps = {
  songId: string
  songTitle: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteSongDialog({
  songId,
  songTitle,
  open,
  onOpenChange,
}: DeleteSongDialogProps) {
  const { refresh } = useRefresh()
  const [pending, setPending] = React.useState(false)

  async function onConfirm() {
    setPending(true)
    const res = await deleteSong(songId)
    setPending(false)
    if (!res.ok) {
      toast.error(res.message)
      return
    }
    toast.success("삭제되었어요")
    onOpenChange(false)
    refresh()
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && pending) return // 삭제 중에는 닫기 방지
        onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>곡을 삭제할까요?</AlertDialogTitle>
          <AlertDialogDescription>
            ‘{songTitle}’ 곡이 영구히 삭제됩니다. 되돌릴 수 없습니다.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>취소</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending && <CgSpinner className="size-4 animate-spin" />}
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
