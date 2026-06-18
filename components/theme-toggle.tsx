"use client"

import { HiOutlineMoon, HiOutlineSun } from "react-icons/hi2"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="테마 전환"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      <HiOutlineSun className="size-4 dark:hidden" />
      <HiOutlineMoon className="hidden size-4 dark:block" />
    </Button>
  )
}
