import Link from "next/link"
import { HiOutlineArrowRightOnRectangle } from "react-icons/hi2"

import { signout } from "@/lib/actions/auth"
import { createClient } from "@/lib/supabase/server"
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
import { ThemeToggle } from "@/components/theme-toggle"

export async function AppHeader() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let displayName = user?.email?.split("@")[0] ?? "사용자"
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
    if (profile?.display_name) displayName = profile.display_name
  }
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-base font-bold tracking-tight">
          🎵 노래 추천
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
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
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="truncate">
                {displayName}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <form action={signout}>
                <DropdownMenuItem variant="destructive" asChild>
                  <button type="submit" className="w-full">
                    <HiOutlineArrowRightOnRectangle className="size-4" /> 로그아웃
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
