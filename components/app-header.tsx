import Link from "next/link"
import { HiMusicalNote } from "react-icons/hi2"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUser } from "@/lib/supabase/user"
import { UserMenu } from "@/components/user-menu"

export async function AppHeader() {
  const user = await getCurrentUser()

  let displayName = user?.email?.split("@")[0] ?? "사용자"
  if (user) {
    const supabase = await createClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
    if (profile?.display_name) displayName = profile.display_name
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          aria-label="OCHU 홈"
          className="group flex items-center gap-2.5"
        >
          <span className="bg-grad flex size-8 items-center justify-center rounded-xl text-white shadow-[0_8px_20px_-6px_color-mix(in_oklab,var(--g1)_75%,transparent)] ring-1 ring-white/20 transition-transform duration-200 group-hover:-rotate-6 group-hover:scale-105">
            <HiMusicalNote className="size-5" />
          </span>
          <span className="text-grad text-lg leading-none font-black tracking-[0.14em]">
            OCHU
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <UserMenu displayName={displayName} />
        </div>
      </div>
    </header>
  )
}
