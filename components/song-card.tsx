"use client"

import * as React from "react"
import { MoreVertical, Pencil, Trash2 } from "lucide-react"

import type { SongWithAuthor } from "@/lib/data/songs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { StarRating } from "@/components/star-rating"
import { SongFormDialog, type SongFormData } from "@/components/song-form-dialog"
import { DeleteSongDialog } from "@/components/delete-song-dialog"

function formatDate(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}.${m}.${day}`
}

export function SongCard({ song }: { song: SongWithAuthor }) {
  const [editOpen, setEditOpen] = React.useState(false)
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const author = song.profiles?.display_name ?? "탈퇴한 사용자"

  const formData: SongFormData = {
    id: song.id,
    title: song.title,
    artist: song.artist,
    genre: song.genre,
    description: song.description,
    rating: song.rating,
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate text-base">{song.title}</CardTitle>
            <p className="mt-1 truncate text-sm text-foreground/80">
              {song.artist}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="곡 메뉴">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                <Pencil className="size-4" /> 수정
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteOpen(true)}
              >
                <Trash2 className="size-4" /> 삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{song.genre}</Badge>
          <StarRating value={song.rating} readOnly size="sm" />
        </div>
        {song.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {song.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="text-xs text-muted-foreground">
        등록: {author} · {formatDate(song.created_at)}
      </CardFooter>

      <SongFormDialog
        song={formData}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteSongDialog
        songId={song.id}
        songTitle={song.title}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </Card>
  )
}
