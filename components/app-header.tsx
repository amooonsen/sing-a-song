import Link from "next/link"
import { HiMusicalNote } from "react-icons/hi2"

import { createClient } from "@/lib/supabase/server"
import { UserMenu } from "@/components/user-menu"
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

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="bg-grad flex size-8 items-center justify-center rounded-xl text-white shadow-[0_6px_18px_-4px_color-mix(in_oklab,var(--g1)_70%,transparent)] transition-transform duration-200 group-hover:-rotate-6">
            <HiMusicalNote className="size-5" />
          </span>
          <span className="text-[0.95rem]">노래 추천</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <UserMenu displayName={displayName} />
        </div>
      </div>
    </header>
  )
}
