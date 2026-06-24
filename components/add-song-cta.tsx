"use client"

import * as React from "react"
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
  type HTMLMotionProps,
} from "motion/react"
import { HiOutlinePlus, HiOutlineMusicalNote } from "react-icons/hi2"

import { cn } from "@/lib/utils"

/**
 * 메인 CTA — "Magnetic Aurora".
 * 흐르는 핑크→바이올렛 그라데이션 + 커서 추종 마그네틱 + 호버 시 광택 스윕·글로우 번짐·
 * 음표(♪) 파티클 + `+` 아이콘 회전. 실제 <button> 이라 키보드/클릭 접근성을 유지한다.
 *
 * `DialogTrigger asChild` 가 onClick·aria-*·data-state·ref 를 주입하므로,
 * forwardRef + {...props} 스프레드로 그대로 루트 motion.button 에 흘려보낸다.
 */

const BASE_CLASS =
  "group relative isolate inline-flex h-14 cursor-pointer items-center justify-center gap-2.5 rounded-2xl px-7 text-base font-bold text-white outline-none select-none [text-shadow:0_1px_2px_rgba(0,0,0,0.35)] shadow-[0_12px_34px_-10px_color-mix(in_oklab,var(--g1)_70%,transparent)] focus-visible:ring-3 focus-visible:ring-brand/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 sm:h-16 sm:px-9 sm:text-lg"

/** 위로 떠오르는 음표 파티클 설정(좌표·딜레이를 분산해 끊김 없는 흐름) */
const NOTES = [
  { left: "14%", delay: 0, duration: 1.5, className: "size-3" },
  { left: "34%", delay: 0.45, duration: 1.7, className: "size-4" },
  { left: "56%", delay: 0.9, duration: 1.4, className: "size-3" },
  { left: "78%", delay: 0.3, duration: 1.8, className: "size-4" },
  { left: "90%", delay: 1.1, duration: 1.5, className: "size-3" },
] as const

export const AddSongCta = React.forwardRef<
  HTMLButtonElement,
  HTMLMotionProps<"button">
>(function AddSongCta({ className, style, ...props }, ref) {
  const reduce = useReducedMotion()

  // 마그네틱 — 커서 오프셋을 스프링으로 감쇠해 버튼에 적용. 내부 콘텐츠는 더 크게 움직여 깊이감.
  const mvX = useMotionValue(0)
  const mvY = useMotionValue(0)
  const x = useSpring(mvX, { stiffness: 150, damping: 15, mass: 0.1 })
  const y = useSpring(mvY, { stiffness: 150, damping: 15, mass: 0.1 })
  const contentX = useTransform(x, (v) => v * 0.4)
  const contentY = useTransform(y, (v) => v * 0.4)

  function handlePointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    mvX.set((e.clientX - (rect.left + rect.width / 2)) * 0.25)
    mvY.set((e.clientY - (rect.top + rect.height / 2)) * 0.3)
  }
  function resetPointer() {
    mvX.set(0)
    mvY.set(0)
  }

  // 동작 줄이기 — 정적 대형 그라데이션 버튼으로 폴백(애니메이션 레이어 전부 비활성).
  if (reduce) {
    return (
      <motion.button
        ref={ref}
        type="button"
        className={cn(BASE_CLASS, "bg-grad transition-opacity hover:opacity-90", className)}
        style={style}
        {...props}
      >
        <HiOutlinePlus className="size-5 sm:size-6" />곡 추가하기
      </motion.button>
    )
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      className={cn(BASE_CLASS, className)}
      style={{ x, y, ...style }}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      initial="initial"
      animate="initial"
      whileHover="hover"
      whileTap={{ scale: 0.97 }}
      {...props}
    >
      {/* 글로우 번짐 — 버튼 뒤(블러). overflow 없이 바깥으로 퍼지게 둔다. */}
      <motion.span
        aria-hidden
        className="absolute -inset-3 -z-10 rounded-[2rem] blur-xl"
        style={{ backgroundImage: "var(--grad)" }}
        variants={{
          initial: { opacity: 0.45, scale: 0.95 },
          hover: { opacity: 0.85, scale: 1.06 },
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      />

      {/* 그라데이션 채움 + 광택 스윕 — 둥근 모서리로 클립 */}
      <span
        aria-hidden
        className="absolute inset-0 -z-0 overflow-hidden rounded-2xl"
      >
        <motion.span
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(115deg, var(--g1), var(--g2), var(--g1))",
            backgroundSize: "200% 100%",
          }}
          animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "linear",
          }}
        />
        <motion.span
          className="absolute inset-y-0 left-0 w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent"
          variants={{
            initial: { x: "-200%", opacity: 0 },
            hover: { x: "560%", opacity: 1 },
          }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
        />
      </span>

      {/* 음표 파티클 — 호버 시 위로 떠오르며 페이드. pointer-events 없음. */}
      <span aria-hidden className="pointer-events-none absolute inset-0 z-20">
        {NOTES.map((n, i) => (
          <motion.span
            key={i}
            className="absolute top-1/2 text-white/80"
            style={{ left: n.left }}
            variants={{
              initial: { opacity: 0, y: 0 },
              hover: { opacity: [0, 1, 0], y: -44 },
            }}
            transition={{
              duration: n.duration,
              delay: n.delay,
              repeat: Infinity,
              ease: "easeOut",
            }}
          >
            <HiOutlineMusicalNote className={n.className} />
          </motion.span>
        ))}
      </span>

      {/* 라벨 + 아이콘 — 마그네틱 패럴랙스, 호버 시 + 회전 */}
      <motion.span
        className="relative z-10 flex items-center gap-2.5"
        style={{ x: contentX, y: contentY }}
      >
        <motion.span
          className="flex"
          variants={{ initial: { rotate: 0 }, hover: { rotate: 90 } }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
        >
          <HiOutlinePlus className="size-5 sm:size-6" />
        </motion.span>
        곡 추가하기
      </motion.span>
    </motion.button>
  )
})
