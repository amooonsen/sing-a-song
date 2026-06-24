"use client"

import * as THREE from "three"
import {
  Component,
  memo,
  Suspense,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber"
import {
  MeshTransmissionMaterial,
  useFBO,
  useGLTF,
  useTexture,
} from "@react-three/drei"
import { easing } from "maath"

/**
 * react-bits FluidGlass(lens) 기반 유리 렌즈 — "썸네일 전용".
 *
 * WebGL 굴절(MeshTransmissionMaterial)은 캔버스 내부 콘텐츠만 굴절할 수 있어 DOM은 굴절 못 한다
 * (배경/UI 위에선 검은 디스크가 됨). 그래서 썸네일(캔버스에 직접 그려 넣는 이미지) 위에서만
 * 렌즈를 띄워 그 이미지를 굴절·확대하고, 그 외 영역에선 일반 OS 커서를 쓴다.
 *
 * - 페이지에 캔버스 1개만 영구 마운트 → WebGL 컨텍스트 1개(카드별 마운트 churn 없음).
 * - 커서가 썸네일(data-thumb-url) 위에 있을 때만 렌즈 표시 + 네이티브 커서 숨김(body.glass-active).
 * - 좌표는 CSS px → 월드(z평면별 viewport 배율)로 변환해 화면상의 커서·썸네일과 정렬.
 */

const LENS_Z = 12
const LENS_PX = 92
const BG = 0x0b0a12 // 썸네일 가장자리 바깥(색수차 블리드) 배경 — 사이트 다크와 근사

type Hover = { url: string; rect: DOMRect }
type Shared = {
  pointer: { x: number; y: number }
  hover: Hover | null
  active: boolean // 현재 커서가 썸네일 위인가(트랜지션 타깃)
  seen: boolean
}

function useFactor() {
  const { size, viewport, camera } = useThree()
  return (z: number) => {
    const v = viewport.getCurrentViewport(camera, [0, 0, z])
    return { f: v.width / size.width, W: size.width, H: size.height }
  }
}

/** 호버 중인 썸네일을 화면 rect 에 맞춰 z=0 평면에 그린다(렌즈 굴절 소스). */
function ThumbPlane({
  shared,
  url,
}: {
  shared: React.RefObject<Shared>
  url: string
}) {
  const tex = useTexture(url)
  const ref = useRef<THREE.Mesh>(null!)
  const factor = useFactor()

  // 텍스처를 정사각 커버로 크롭(DOM의 object-cover와 일치). three.js 텍스처 변형은 정상 패턴.
  /* eslint-disable react-hooks/immutability */
  useEffect(() => {
    const img = tex.image as { width: number; height: number } | undefined
    if (!img) return
    const ta = img.width / img.height
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
    if (ta > 1) {
      tex.repeat.set(1 / ta, 1)
      tex.offset.set((1 - 1 / ta) / 2, 0)
    } else {
      tex.repeat.set(1, ta)
      tex.offset.set(0, (1 - ta) / 2)
    }
    tex.needsUpdate = true
  }, [tex])
  /* eslint-enable react-hooks/immutability */

  useFrame(() => {
    const hover = shared.current.hover
    if (!hover) {
      ref.current.visible = false
      return
    }
    const { f, W, H } = factor(0)
    const r = hover.rect
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    ref.current.position.set((cx - W / 2) * f, (H / 2 - cy) * f, 0)
    ref.current.scale.set(r.width * f, r.height * f, 1)
    ref.current.visible = true
  })

  return (
    <mesh ref={ref}>
      <planeGeometry />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  )
}

function LensScene({
  shared,
  url,
}: {
  shared: React.RefObject<Shared>
  url: string | null
}) {
  const { nodes } = useGLTF("/assets/3d/lens.glb")
  const buffer = useFBO()
  const [scene] = useState(() => new THREE.Scene())
  const lens = useRef<THREE.Mesh>(null!)
  const placed = useRef(false)
  const intensity = useRef(0) // 0→1 진입/이탈 트랜지션
  const factor = useFactor()
  const geoWidth = useRef(1)

  const geometry = (nodes.Cylinder as THREE.Mesh | undefined)?.geometry

  useEffect(() => {
    if (!geometry) return
    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    geoWidth.current = box ? box.max.x - box.min.x || 1 : 1
  }, [geometry])

  useFrame((state, delta) => {
    const { gl, camera } = state
    const target = shared.current.seen && shared.current.active ? 1 : 0
    // 인텐시티를 타깃으로 부드럽게 이징 → 확대+페이드 트랜지션.
    easing.damp(intensity, "current", target, 0.2, delta)
    const i = intensity.current
    const visible = i > 0.004
    lens.current.visible = visible
    const m = lens.current.material as THREE.Material & { opacity: number }
    if (m) m.opacity = i

    if (!visible) {
      placed.current = false // 다음 등장 시 커서 위치로 순간 배치
      return
    }

    const { f, W, H } = factor(LENS_Z)
    // 진입(active) 중에만 커서를 추적, 이탈(페이드아웃) 중엔 마지막 위치에서 제자리 축소.
    if (shared.current.active) {
      const p = shared.current.pointer
      const tx = (p.x - W / 2) * f
      const ty = (H / 2 - p.y) * f
      if (!placed.current) {
        lens.current.position.set(tx, ty, LENS_Z)
        placed.current = true
      } else {
        easing.damp3(lens.current.position, [tx, ty, LENS_Z], 0.08, delta)
      }
    }
    // 작게 시작해 확 커지며 등장(0.45→1) — 트랜지션을 또렷하게.
    const grow = 0.45 + 0.55 * i
    lens.current.scale.setScalar((LENS_PX * f * grow) / geoWidth.current)

    // 썸네일을 버퍼에 렌더 → 굴절 소스.
    gl.setRenderTarget(buffer)
    gl.setClearColor(BG, 1)
    gl.clear()
    gl.render(scene, camera)
    gl.setRenderTarget(null)
    gl.setClearColor(0x000000, 0) // 메인 패스는 투명(렌즈 밖은 페이지가 그대로)
  })

  return (
    <>
      {createPortal(
        url ? (
          <Suspense fallback={null}>
            <ThumbPlane shared={shared} url={url} />
          </Suspense>
        ) : null,
        scene
      )}

      {geometry && (
        <mesh ref={lens} rotation-x={Math.PI / 2} geometry={geometry} visible={false}>
          <MeshTransmissionMaterial
            buffer={buffer.texture}
            transparent
            opacity={0}
            ior={1.2}
            thickness={3}
            anisotropy={0.02}
            chromaticAberration={0.12}
            roughness={0}
          />
        </mesh>
      )}
    </>
  )
}

/**
 * 장식용 커서이므로, WebGL 컨텍스트 생성 실패·GLB 로드 실패·컨텍스트 손실 등
 * 어떤 렌더 에러가 나도 절대 앱 전체를 죽이지 않게 격리한다(에러 시 커서만 사라짐).
 */
class CursorBoundary extends Component<{ children: ReactNode }, { dead: boolean }> {
  state = { dead: false }
  static getDerivedStateFromError() {
    return { dead: true }
  }
  componentDidCatch(err: unknown) {
    console.warn("[GlassCursor] disabled after error:", err)
  }
  render() {
    return this.state.dead ? null : this.props.children
  }
}

/** 정밀 포인터(마우스) 환경 여부 — SSR에선 false, 클라이언트에서 matchMedia 구독. */
function usePrecisePointer() {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia("(pointer: fine)")
      mq.addEventListener("change", onChange)
      return () => mq.removeEventListener("change", onChange)
    },
    () => window.matchMedia("(pointer: fine)").matches,
    () => false
  )
}

function GlassCursor() {
  const shared = useRef<Shared>({
    pointer: { x: 0, y: 0 },
    hover: null,
    active: false,
    seen: false,
  })
  const enabled = usePrecisePointer()
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    let raf = 0

    // 이탈: active만 끄고 hover/url 은 유지 → 렌즈가 마지막 썸네일을 굴절하며 페이드아웃.
    function deactivate() {
      shared.current.active = false
      document.body.classList.remove("glass-active")
    }

    /** 커서가 iframe(YouTube 플레이어 등) 위인가. iframe은 부모 mousemove를 삼켜
     * 렌즈가 따라갈 수 없으므로, 그 위에선 렌즈를 끄고 일반 커서를 쓴다. */
    function overIframe(px: number, py: number) {
      const frames = document.querySelectorAll("iframe")
      for (const f of frames) {
        const r = f.getBoundingClientRect()
        if (
          r.width &&
          px >= r.left &&
          px <= r.right &&
          py >= r.top &&
          py <= r.bottom
        )
          return true
      }
      return false
    }

    function onMove(e: MouseEvent) {
      const s = shared.current
      s.pointer.x = e.clientX
      s.pointer.y = e.clientY
      s.seen = true
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const px = s.pointer.x
        const py = s.pointer.y
        // iframe(영상 재생) 위 → 렌즈 끄고 일반 커서.
        if (overIframe(px, py)) {
          deactivate()
          return
        }
        // rect 기반 히트 테스트 — 커버 div가 카드의 pointer-events-none 를 상속해
        // elementFromPoint 로는 잡히지 않으므로, 썸네일 요소들의 화면 사각형으로 직접 판정.
        let found: Hover | null = null
        const covers = document.querySelectorAll<HTMLElement>("[data-thumb-url]")
        for (const c of covers) {
          const r = c.getBoundingClientRect()
          if (px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
            const u = c.dataset.thumbUrl
            if (u) {
              found = { url: u, rect: r }
              break
            }
          }
        }
        if (found) {
          s.hover = found
          s.active = true
          const u = found.url
          document.body.classList.add("glass-active") // 썸네일 위 → 네이티브 커서 숨김
          setUrl((prev) => (prev === u ? prev : u))
        } else {
          deactivate()
        }
      })
    }

    // iframe 이 포커스를 가져가면(클릭/재생) 부모는 mousemove를 못 받으니 즉시 일반 커서로.
    function onBlur() {
      if (document.activeElement?.tagName === "IFRAME") deactivate()
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    document.addEventListener("mouseleave", deactivate)
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseleave", deactivate)
      window.removeEventListener("blur", onBlur)
      document.body.classList.remove("glass-active")
      if (raf) cancelAnimationFrame(raf)
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <CursorBoundary>
      <div
        aria-hidden
        className="glass-cursor-root pointer-events-none fixed inset-0 z-[9999]"
        style={{ contain: "strict" }}
      >
        <Canvas
          camera={{ position: [0, 0, 20], fov: 15 }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 1.5]}
          style={{ pointerEvents: "none" }}
        >
          <LensScene shared={shared} url={url} />
        </Canvas>
      </div>
    </CursorBoundary>
  )
}

// props 없음 → 라우트 RSC 리프레시 시 부모가 reconcile돼도 bail-out(리렌더/WebGL 리마운트 0).
export default memo(GlassCursor)

useGLTF.preload("/assets/3d/lens.glb")
