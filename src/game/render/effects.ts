import { CHARACTER_SIZE_MULTIPLIER, HIT_EFFECT_SIZE_MULTIPLIER } from '../tuning'
import { FLOOR_Y } from '../constants'
import { drawText } from './font'

export type EffectKind = 'hit' | 'heavy' | 'block' | 'dust' | 'splash' | 'paper' | 'text' | 'cash' | 'ko' | 'shock'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

export interface Effect {
  kind: EffectKind
  /** world position (y up from floor) */
  x: number
  y: number
  t: number
  dur: number
  parts: Particle[]
  text?: string
  color?: string
}

/** Floating text ("COMPLAINT FILED!", special move names...). */
export function spawnText(text: string, x: number, y: number, color = '#ffe135', dur = 55): Effect {
  return { kind: 'text', x, y, t: 0, dur, parts: [], text, color }
}

export function spawnEffect(kind: EffectKind, x: number, y: number): Effect {
  const n =
    kind === 'ko'
      ? 22
      : kind === 'heavy'
        ? 14
        : kind === 'hit'
          ? 8
          : kind === 'dust' || kind === 'shock'
            ? 8
            : kind === 'splash' || kind === 'paper'
              ? 16
              : kind === 'cash'
                ? 3
                : 6
  const parts: Particle[] = []
  for (let i = 0; i < n; i++) {
    const a = kind === 'dust' || kind === 'shock' ? Math.PI * (0.05 + 0.9 * (i / (n - 1))) : Math.random() * Math.PI * 2
    const sp =
      kind === 'dust'
        ? 0.6
        : kind === 'shock'
          ? 1.2 + Math.random()
          : kind === 'cash'
            ? 0.5 + Math.random()
            : (kind === 'ko' ? 2.5 : kind === 'heavy' ? 2 : 1.5) + Math.random() * 2
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp })
  }
  const dur =
    kind === 'dust'
      ? 18
      : kind === 'ko'
        ? 34
        : kind === 'shock'
          ? 24
          : kind === 'heavy'
            ? 20
            : kind === 'splash' || kind === 'paper'
              ? 28
              : kind === 'cash'
                ? 60
                : 14
  return { kind, x, y, t: 0, dur, parts }
}

export function updateEffects(list: Effect[]): Effect[] {
  for (const e of list) {
    e.t++
    for (const p of e.parts) {
      p.x += p.vx
      p.y += p.vy
      if (e.kind === 'dust' || e.kind === 'shock') p.vy *= 0.88
      else if (e.kind === 'cash') {
        // banknotes flutter down slowly
        p.vy = Math.max(-0.6, p.vy - 0.05)
        p.vx = Math.sin((e.t + p.x) * 0.2) * 0.5
        if (p.y < 1) p.y = 1
      } else if (e.kind === 'paper') {
        p.vy -= 0.05
        p.vx *= 0.95
      } else p.vy -= 0.15
    }
  }
  return list.filter((e) => e.t < e.dur)
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), s, s)
}

export function drawEffects(ctx: CanvasRenderingContext2D, list: Effect[]) {
  for (const e of list) {
    const sx = Math.round(e.x)
    const sy = Math.round(FLOOR_Y - e.y)
    if (e.kind === 'text') {
      const rise = Math.min(e.t, 20) * 0.6
      // pops in big, then settles and floats up
      const scale = e.t < 4 ? 2 : 1
      if (e.t < e.dur - 10 || e.t % 4 < 2)
        drawText(ctx, e.text ?? '', sx, Math.round(sy - rise - (scale - 1) * 4), {
          scale,
          color: e.color,
          outline: '#10101c',
          align: 'center',
        })
      continue
    }
    if (e.kind === 'splash' || e.kind === 'paper') {
      for (const [i, p] of e.parts.entries()) {
        const c = e.kind === 'splash' ? (i % 3 ? '#6b3a1e' : '#c89060') : i % 2 ? '#ffffff' : '#d8d8e0'
        px(ctx, p.x, FLOOR_Y - p.y, e.kind === 'paper' ? 3 : 2, c)
        if (e.kind === 'paper') px(ctx, p.x, FLOOR_Y - p.y + 1, 1, '#8a8aa0')
      }
      continue
    }
    if (e.kind === 'cash') {
      for (const p of e.parts) {
        const flip = Math.floor((e.t + p.x) / 5) % 2
        const x = Math.round(p.x)
        const y = Math.round(FLOOR_Y - p.y)
        ctx.fillStyle = '#1e5a2a'
        ctx.fillRect(x - 3, y - 2, flip ? 7 : 5, flip ? 4 : 5)
        ctx.fillStyle = '#6cc05a'
        ctx.fillRect(x - 2, y - 1, flip ? 5 : 3, flip ? 2 : 3)
        ctx.fillStyle = '#d8f0c0'
        ctx.fillRect(x, y - 1, 1, 1)
      }
      continue
    }
    if (e.kind === 'dust') {
      for (const p of e.parts) {
        const s = e.t < 8 ? 3 : 2
        px(ctx, p.x, FLOOR_Y - p.y - 1, s, e.t < 10 ? '#c9c3b4' : '#8e8a80')
      }
      continue
    }
    if (e.kind === 'shock') {
      drawGroundShock(ctx, e, sx)
      continue
    }
    drawImpact(ctx, e, sx, sy)
  }
}

/** a pixel ring (circle outline), optionally squashed vertically */
function ring(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, c: string, squash = 1, thick = 1) {
  ctx.fillStyle = c
  const steps = Math.max(12, Math.round(r * 5))
  for (let i = 0; i < steps; i++) {
    const a = (i / steps) * Math.PI * 2
    ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * squash), thick, thick)
  }
}

/** a thick ray from the centre outwards */
function ray(ctx: CanvasRenderingContext2D, cx: number, cy: number, a: number, r0: number, r1: number, w: number, c: string) {
  ctx.fillStyle = c
  for (let r = r0; r <= r1; r++) {
    const taper = Math.max(1, Math.round(w * (1 - (r - r0) / Math.max(1, r1 - r0 + 1))))
    ctx.fillRect(Math.round(cx + Math.cos(a) * r - taper / 2), Math.round(cy + Math.sin(a) * r - taper / 2), taper, taper)
  }
}

/**
 * Hit sparks: a rotating starburst with a white core, an expanding shock
 * ring (two for heavy hits and KOs), speed lines and flying sparks.
 * Blocks get a blue shield flash instead.
 */
function drawImpact(ctx: CanvasRenderingContext2D, e: Effect, sx: number, sy: number) {
  const S = HIT_EFFECT_SIZE_MULTIPLIER
  const kind = e.kind
  const blue = kind === 'block'
  const core = blue ? '#e6f4ff' : '#ffffff'
  const hot = blue ? '#62b6ff' : kind === 'hit' ? '#ffd23c' : '#ff8a1e'
  const deep = blue ? '#2a6ad5' : kind === 'hit' ? '#ff8a1e' : '#d62828'
  const size = (kind === 'ko' ? 2.2 : kind === 'heavy' ? 1.6 : 1) * S
  const t = e.t

  if (blue) {
    // shield: a hexagon that snaps out then fades
    if (t < 10) {
      const r = Math.round((6 + Math.min(t, 4) * 2) * S)
      ctx.fillStyle = t < 5 ? core : hot
      for (let i = 0; i < 6; i++) {
        const a0 = (i / 6) * Math.PI * 2 + Math.PI / 6
        const a1 = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6
        for (let k = 0; k <= r; k++) {
          const u = k / r
          ctx.fillRect(
            Math.round(sx + (Math.cos(a0) * (1 - u) + Math.cos(a1) * u) * r),
            Math.round(sy + (Math.sin(a0) * (1 - u) + Math.sin(a1) * u) * r),
            2,
            2,
          )
        }
      }
      if (t < 3) {
        ctx.fillStyle = core
        ctx.fillRect(sx - 3, sy - 3, 7, 7)
      }
    }
  } else {
    // starburst: 8 rays that grow, spin a notch every frame, then shrink
    const life = kind === 'ko' ? 14 : kind === 'heavy' ? 10 : 7
    if (t < life) {
      const grow = t < 3 ? (t + 1) / 3 : 1 - (t - 3) / (life - 3)
      const len = Math.round((kind === 'hit' ? 12 : 18) * size * grow)
      const spin = t * 0.12
      for (let i = 0; i < 8; i++) {
        const a = spin + (i / 8) * Math.PI * 2
        const long = i % 2 === 0 ? len : Math.round(len * 0.55)
        ray(ctx, sx, sy, a, 2, long, i % 2 === 0 ? 4 : 3, i % 2 === 0 ? hot : deep)
      }
      const c = Math.max(2, Math.round(len / 4))
      ctx.fillStyle = core
      ctx.fillRect(sx - c, sy - c, c * 2 + 1, c * 2 + 1)
      ctx.fillRect(sx - c - 2, sy - 1, c * 2 + 5, 3)
      ctx.fillRect(sx - 1, sy - c - 2, 3, c * 2 + 5)
    }
    // shock rings
    const rings = kind === 'hit' ? 1 : 2
    for (let k = 0; k < rings; k++) {
      const rt = t - k * 3
      if (rt < 0 || rt > 12) continue
      const r = Math.round((5 + rt * (kind === 'hit' ? 1.4 : 2.4)) * S)
      ring(ctx, sx, sy, r, rt < 6 ? core : hot, 0.8, rt < 4 ? 2 : 1)
    }
    // speed lines for heavy hits and KOs
    if (kind !== 'hit' && t < 8) {
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.3
        const r0 = (22 + t * 4) * size * 0.6
        ray(ctx, sx, sy, a, Math.round(r0), Math.round(r0 + 8), 1, '#ffffff')
      }
    }
  }
  for (const p of e.parts) {
    const s = t < 6 ? (kind === 'hit' || blue ? 2 : 3) : 2
    px(ctx, p.x, FLOOR_Y - p.y, s, t % 4 < 2 ? core : hot)
  }
}

/** a flat shockwave running along the floor, with dust thrown up */
function drawGroundShock(ctx: CanvasRenderingContext2D, e: Effect, sx: number) {
  const t = e.t
  const r = Math.round((8 + t * 3.2) * HIT_EFFECT_SIZE_MULTIPLIER)
  ring(ctx, sx, FLOOR_Y, r, t < 8 ? '#ffffff' : '#c9c3b4', 0.18, t < 10 ? 2 : 1)
  if (t > 3) ring(ctx, sx, FLOOR_Y, Math.round(r * 0.7), '#8e8a80', 0.18)
  for (const p of e.parts) px(ctx, p.x, FLOOR_Y - p.y - 1, t < 10 ? 3 : 2, t < 12 ? '#c9c3b4' : '#8e8a80')
}

/** A soft pixel ellipse under each fighter. */
export function drawShadow(ctx: CanvasRenderingContext2D, x: number, height: number) {
  const k = Math.max(0.4, 1 - height / 110)
  const rw = Math.round(15 * k * CHARACTER_SIZE_MULTIPLIER)
  ctx.fillStyle = 'rgba(10, 12, 30, 0.35)'
  const cx = Math.round(x)
  ctx.fillRect(cx - rw, FLOOR_Y - 1, rw * 2, 3)
  ctx.fillRect(cx - rw + 3, FLOOR_Y - 2, rw * 2 - 6, 1)
  ctx.fillRect(cx - rw + 3, FLOOR_Y + 2, rw * 2 - 6, 1)
}
