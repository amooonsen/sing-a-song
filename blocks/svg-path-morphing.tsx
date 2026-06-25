"use client";

import { useState } from "react";
import { motion } from "motion/react";

// Both icons are built from two 4-point shapes (M, L, L, L, Z) so the path
// command structure stays identical and motion can interpolate `d` smoothly.
// The play triangle is split down its vertical midline into two quadrilaterals,
// so each pause bar morphs into one half of the triangle.
export const PAUSE = {
  left: "M5 5L9 5L9 19L5 19Z",
  right: "M15 5L19 5L19 19L15 19Z",
} as const;

export const PLAY = {
  // top-left, top-mid, bottom-mid, bottom-left
  left: "M7 5L13 8.5L13 15.5L7 19Z",
  // top-mid, apex, apex, bottom-mid (two corners collapse to the apex)
  right: "M13 8.5L19 12L19 12L13 15.5Z",
} as const;

export type SpringConfig = {
  type: "spring";
  stiffness?: number;
  damping?: number;
  mass?: number;
  bounce?: number;
  visualDuration?: number;
};

export const DEFAULT_SPRING: SpringConfig = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.9,
};

export type PathMorphProps = {
  /** true → 일시정지 막대(재생 중), false → 재생 삼각형 */
  playing: boolean;
  size?: number;
  strokeWidth?: number;
  spring?: SpringConfig;
  className?: string;
};

/**
 * 재생 ↔ 일시정지 모핑 아이콘(제어형). 버튼/상태 없이 svg 만 그린다 —
 * 호출부가 playing 을 소유하고 클릭/스타일을 입힌다.
 */
export function PathMorph({
  playing,
  size = 100,
  strokeWidth = 1.5,
  spring = DEFAULT_SPRING,
  className,
}: PathMorphProps) {
  const target = playing ? PAUSE : PLAY;

  // 유휴 카드는 motion.path 대신 정적 <path> 로 그린다 — 그리드(최대 24장)에서 카드마다
  // motion.path 2개(=약 48개)를 마운트하던 비용을 첫 재생 전까지 제거. 한 번이라도 재생하면
  // motion 으로 승격(latch)하고, 그때의 initial(=PLAY)에서 PAUSE 로 첫 모핑도 그대로 재생된다.
  // prop 변화에 따른 상태 조정은 렌더 중 setState(React 공식 패턴) — effect 가 아니라 cascading 없음.
  const [animated, setAnimated] = useState(playing);
  if (playing && !animated) setAnimated(true);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
    >
      {animated ? (
        <>
          <motion.path initial={{ d: PLAY.left }} animate={{ d: target.left }} transition={spring} />
          <motion.path initial={{ d: PLAY.right }} animate={{ d: target.right }} transition={spring} />
        </>
      ) : (
        <>
          <path d={target.left} />
          <path d={target.right} />
        </>
      )}
    </svg>
  );
}

export type SvgPathMorphingProps = {
  size?: number;
  strokeWidth?: number;
  startPlaying?: boolean;
  spring?: SpringConfig;
  className?: string;
};

export function SvgPathMorphing({
  size = 100,
  strokeWidth = 1.5,
  startPlaying = false,
  spring = DEFAULT_SPRING,
  className,
}: SvgPathMorphingProps) {
  const [isPlaying, setIsPlaying] = useState(startPlaying);

  return (
    <button
      type="button"
      onClick={() => setIsPlaying((prev) => !prev)}
      aria-label={isPlaying ? "Pause" : "Play"}
      className={`group text-black dark:text-white ${className ?? ""}`}
    >
      <PathMorph
        playing={isPlaying}
        size={size}
        strokeWidth={strokeWidth}
        spring={spring}
      />
    </button>
  );
}

export const controls = {
  size: [100, 16, 120, 2],
  strokeWidth: [1.5, 0, 4, 0.5],
  startPlaying: false,
  spring: { type: "spring", stiffness: 260, damping: 26, mass: 0.9 },
};

export default function SvgPathMorphingDemo(props: SvgPathMorphingProps) {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-white dark:bg-black">
      <SvgPathMorphing {...props} />
    </div>
  );
}
