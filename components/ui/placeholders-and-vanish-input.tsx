"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { HiOutlineMagnifyingGlass, HiOutlineXMark } from "react-icons/hi2";
import { cn } from "@/lib/utils";

type Particle = { x: number; y: number; r: number; color: string };

export function PlaceholdersAndVanishInput({
  placeholders,
  initialValue = "",
  isPending = false,
  hasActiveSearch = false,
  onSubmit,
  onClear,
  className,
}: {
  placeholders: string[];
  /** 첫 렌더 시 입력값(공유 URL의 ?q= 복원용). 제출 시 디졸브로 비워짐 */
  initialValue?: string;
  isPending?: boolean;
  /** 적용 중인 검색어 존재 여부 — 비어있을 때 초기화(X) 버튼 노출 */
  hasActiveSearch?: boolean;
  onSubmit?: (value: string) => void;
  onClear?: () => void;
  className?: string;
}) {
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startAnimation = () => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current); // Clear the interval when the tab is not visible
      intervalRef.current = null;
    } else if (document.visibilityState === "visible") {
      startAnimation(); // Restart the interval when the tab becomes visible
    }
  };

  useEffect(() => {
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholders]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const newDataRef = useRef<Particle[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(initialValue);
  const [animating, setAnimating] = useState(false);

  const draw = useCallback(() => {
    if (!inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 800;
    ctx.clearRect(0, 0, 800, 800);
    const computedStyles = getComputedStyle(inputRef.current);

    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    // invert 필터로 라이트/다크 모두 대응 — 흰 글자가 라이트에선 검정으로 반전
    ctx.fillStyle = "#FFF";
    ctx.fillText(value, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 800);
    const pixelData = imageData.data;
    const newData: { x: number; y: number; color: number[] }[] = [];

    for (let t = 0; t < 800; t++) {
      const i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        const e = i + 4 * n;
        if (
          pixelData[e] !== 0 &&
          pixelData[e + 1] !== 0 &&
          pixelData[e + 2] !== 0
        ) {
          newData.push({
            x: n,
            y: t,
            color: [
              pixelData[e],
              pixelData[e + 1],
              pixelData[e + 2],
              pixelData[e + 3],
            ],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [value]);

  useEffect(() => {
    draw();
  }, [value, draw]);

  const animate = (start: number) => {
    const animateFrame = (pos: number = 0) => {
      requestAnimationFrame(() => {
        const newArr = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i];
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.05 * Math.random();
            newArr.push(current);
          }
        }
        newDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 800);
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color: color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (newDataRef.current.length > 0) {
          animateFrame(pos - 8);
        } else {
          // 디졸브 완료 — 입력값 비우고 애니메이션 종료
          setValue("");
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  const submit = () => {
    if (animating) return;
    const v = value.trim();
    if (!v) return;

    setAnimating(true);
    draw();
    const maxX = newDataRef.current.reduce(
      (prev, current) => (current.x > prev ? current.x : prev),
      0
    );
    animate(maxX);
    onSubmit?.(v);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submit();
  };

  return (
    <form
      className={cn(
        "relative h-10 w-full overflow-hidden rounded-full border border-input bg-card/60 shadow-sm transition-colors focus-within:border-ring dark:bg-input/30",
        className
      )}
      onSubmit={handleSubmit}
    >
      <HiOutlineMagnifyingGlass className="pointer-events-none absolute top-1/2 left-3.5 z-50 size-4 -translate-y-1/2 text-muted-foreground" />
      <canvas
        className={cn(
          "pointer-events-none absolute top-[20%] left-8 origin-top-left scale-50 transform pr-20 text-base filter invert sm:left-10 dark:invert-0",
          !animating ? "opacity-0" : "opacity-100"
        )}
        ref={canvasRef}
      />
      <input
        onChange={(e) => {
          if (!animating) {
            setValue(e.target.value);
          }
        }}
        onKeyDown={handleKeyDown}
        ref={inputRef}
        value={value}
        type="text"
        aria-label="곡 검색"
        className={cn(
          "relative z-50 h-full w-full rounded-full border-none bg-transparent pr-12 pl-10 text-sm text-foreground transition-colors focus:ring-0 focus:outline-none sm:text-base",
          animating && "text-transparent"
        )}
      />

      <div className="absolute top-1/2 right-1.5 z-50 -translate-y-1/2">
        {isPending ? (
          <span
            className="flex size-7 items-center justify-center"
            aria-label="검색 중"
            role="status"
          >
            <CgSpinner className="size-4 animate-spin text-muted-foreground" />
          </span>
        ) : value ? (
          <button
            type="submit"
            aria-label="검색"
            className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-brand text-brand-foreground transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <motion.path
                d="M5 12l14 0"
                initial={{
                  strokeDasharray: "50%",
                  strokeDashoffset: "50%",
                }}
                animate={{
                  strokeDashoffset: value ? 0 : "50%",
                }}
                transition={{
                  duration: 0.3,
                  ease: "linear",
                }}
              />
              <path d="M13 18l6 -6" />
              <path d="M13 6l6 6" />
            </motion.svg>
          </button>
        ) : hasActiveSearch ? (
          <button
            type="button"
            aria-label="검색 초기화"
            onClick={() => onClear?.()}
            className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition hover:text-foreground"
          >
            <HiOutlineXMark className="size-4" />
          </button>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center rounded-full">
        <AnimatePresence mode="wait">
          {!value && (
            <motion.p
              initial={{
                y: 5,
                opacity: 0,
              }}
              key={`current-placeholder-${currentPlaceholder}`}
              animate={{
                y: 0,
                opacity: 1,
              }}
              exit={{
                y: -15,
                opacity: 0,
              }}
              transition={{
                duration: 0.3,
                ease: "linear",
              }}
              className="w-[calc(100%-3rem)] truncate pl-10 text-left text-sm font-normal text-muted-foreground sm:text-base"
            >
              {placeholders[currentPlaceholder]}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </form>
  );
}
