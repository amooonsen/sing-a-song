"use client"

import * as React from "react"
import Link from "next/link"
import {
  HiOutlineArrowRightOnRectangle,
  HiOutlineBookmark,
  HiOutlinePencil,
} from "react-icons/hi2"

import { signout } from "@/lib/actions/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProfileNameDialog } from "@/components/profile-name-dialog"

export function UserMenu({ displayName }: { displayName: string }) {
  const [nameOpen, setNameOpen] = React.useState(false)
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            aria-label={`${displayName} 메뉴`}
          >
            <Avatar className="size-8">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="truncate">
            {displayName}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/me">
              <HiOutlineBookmark className="size-4" /> 내 스크랩
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setNameOpen(true)}>
            <HiOutlinePencil className="size-4" /> 이름 변경
          </DropdownMenuItem>
          <form action={signout}>
            <DropdownMenuItem variant="destructive" asChild>
              <button type="submit" className="w-full">
                <HiOutlineArrowRightOnRectangle className="size-4" /> 로그아웃
              </button>
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProfileNameDialog
        open={nameOpen}
        onOpenChange={setNameOpen}
        currentName={displayName}
      />
    </>
  )
}
