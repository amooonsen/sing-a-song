"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { deleteSong } from "@/lib/actions/songs"
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
  const router = useRouter()
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
    router.refresh()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
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
            삭제
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
