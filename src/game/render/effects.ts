import { FLOOR_Y } from '../constants'

export type EffectKind = 'hit' | 'heavy' | 'block' | 'dust'

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
}

export function spawnEffect(kind: EffectKind, x: number, y: number): Effect {
  const n = kind === 'heavy' ? 10 : kind === 'hit' ? 6 : kind === 'dust' ? 5 : 4
  const parts: Particle[] = []
  for (let i = 0; i < n; i++) {
    const a = kind === 'dust' ? Math.PI * (0.1 + 0.8 * (i / (n - 1))) : Math.random() * Math.PI * 2
    const sp = kind === 'dust' ? 0.6 : 1.5 + Math.random() * 2
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp })
  }
  return { kind, x, y, t: 0, dur: kind === 'dust' ? 18 : kind === 'heavy' ? 16 : 12, parts }
}

export function updateEffects(list: Effect[]): Effect[] {
  for (const e of list) {
    e.t++
    for (const p of e.parts) {
      p.x += p.vx
      p.y += p.vy
      if (e.kind === 'dust') p.vy *= 0.9
      else p.vy -= 0.15
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
    if (e.kind === 'dust') {
      for (const p of e.parts) {
        const s = e.t < 8 ? 3 : 2
        px(ctx, p.x, FLOOR_Y - p.y - 1, s, e.t < 10 ? '#c9c3b4' : '#8e8a80')
      }
      continue
    }
    const blue = e.kind === 'block'
    const core = blue ? '#e6f4ff' : '#ffffff'
    const ring = blue ? '#62b6ff' : e.kind === 'heavy' ? '#ff8a1e' : '#ffd23c'
    const big = e.kind === 'heavy' ? 1.6 : 1
    if (e.t < 6) {
      // star burst: grows then shrinks
      const r = Math.round((e.t < 3 ? 4 + e.t * 3 : 13 - (e.t - 3) * 3) * big)
      ctx.fillStyle = ring
      for (let i = -r; i <= r; i++) {
        ctx.fillRect(sx + i, sy, 1, 1)
        ctx.fillRect(sx, sy + i, 1, 1)
        if (Math.abs(i) < r * 0.65) {
          ctx.fillRect(sx + i, sy + i, 1, 1)
          ctx.fillRect(sx + i, sy - i, 1, 1)
        }
      }
      const c = Math.max(2, Math.round(r / 3))
      ctx.fillStyle = core
      ctx.fillRect(sx - c, sy - c, c * 2 + 1, c * 2 + 1)
    }
    for (const p of e.parts) {
      px(ctx, p.x, FLOOR_Y - p.y, e.t < 6 ? 2 : 1, e.t % 4 < 2 ? core : ring)
    }
  }
}

/** A soft pixel ellipse under each fighter. */
export function drawShadow(ctx: CanvasRenderingContext2D, x: number, height: number) {
  const k = Math.max(0.4, 1 - height / 110)
  const rw = Math.round(15 * k)
  ctx.fillStyle = 'rgba(10, 12, 30, 0.35)'
  const cx = Math.round(x)
  ctx.fillRect(cx - rw, FLOOR_Y - 1, rw * 2, 3)
  ctx.fillRect(cx - rw + 3, FLOOR_Y - 2, rw * 2 - 6, 1)
  ctx.fillRect(cx - rw + 3, FLOOR_Y + 2, rw * 2 - 6, 1)
}
