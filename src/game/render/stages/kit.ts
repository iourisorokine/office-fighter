import { VIEW_H, VIEW_W } from '../../constants'
import { drawText, textWidth } from '../font'

/**
 * Painting kit shared by all stages: flat rectangles, checkerboard dithering,
 * windows, slogan posters and banners, floors. Everything is drawn once into
 * an offscreen 384x216 canvas, like a 90s backdrop.
 */

export type Ctx = CanvasRenderingContext2D

export const CEIL_H = 16
export const WALL_BOTTOM = 160
export const FLOOR_TOP = WALL_BOTTOM + 6

export function newCanvas(): [HTMLCanvasElement, Ctx] {
  const canvas = document.createElement('canvas')
  canvas.width = VIEW_W
  canvas.height = VIEW_H
  return [canvas, canvas.getContext('2d')!]
}

export function rect(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(x, y, w, h)
}

/** checkerboard dither of colour c2 over whatever is there (density 4 = sparser) */
export function dither(ctx: Ctx, x: number, y: number, w: number, h: number, c2: string, density = 2) {
  ctx.fillStyle = c2
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (density === 2 ? (xx + yy) % 2 === 0 : xx % 2 === 0 && yy % 2 === 0) ctx.fillRect(xx, yy, 1, 1)
    }
  }
}

/** deterministic pseudo random so a stage looks the same every time */
export function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

export function disc(ctx: Ctx, cx: number, cy: number, r: number, c: string) {
  ctx.fillStyle = c
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.8) ctx.fillRect(cx + x, cy + y, 1, 1)
  }
}

export function ceilingTiles(ctx: Ctx, base = '#c9c8bd', line = '#a7a699') {
  rect(ctx, 0, 0, VIEW_W, CEIL_H, base)
  for (let x = 0; x < VIEW_W; x += 32) rect(ctx, x, 0, 1, CEIL_H, line)
  rect(ctx, 0, 7, VIEW_W, 1, line)
  dither(ctx, 0, 0, VIEW_W, CEIL_H, line, 4)
  rect(ctx, 0, CEIL_H - 1, VIEW_W, 1, '#7c7b70')
}

export function baseboard(ctx: Ctx, c = '#4a4e44', hi = '#6c7064') {
  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 6, c)
  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 1, hi)
}

type Sky = 'day' | 'sunset'

export function drawWindow(ctx: Ctx, x: number, y: number, w: number, h: number, seed: number, sky: Sky = 'day', blinds = true) {
  const r = rng(seed)
  rect(ctx, x - 3, y - 3, w + 6, h + 6, '#5c6360')
  rect(ctx, x - 2, y - 2, w + 4, h + 4, sky === 'day' ? '#d7dbd9' : '#3a2418')
  const bands =
    sky === 'day'
      ? ['#6fa6de', '#7db3e4', '#8fc0ea', '#a4cff0', '#b9dcf4']
      : ['#3a2a6a', '#6a3a7a', '#b8506a', '#e87a4a', '#f8b84a']
  const band = Math.ceil(h / bands.length)
  bands.forEach((c, i) => rect(ctx, x, y + i * band, w, Math.min(band, h - i * band), c))
  for (let i = 1; i < bands.length; i++) {
    ctx.fillStyle = bands[i]
    for (let xx = x; xx < x + w; xx += 2) ctx.fillRect(xx + (i % 2), y + i * band - 1, 1, 1)
  }
  if (sky === 'sunset') disc(ctx, x + Math.floor(w * 0.7), y + h - 14, 7, '#ffe08a')
  // skyline
  let bx = x
  while (bx < x + w) {
    const bw = 8 + Math.floor(r() * 14)
    const bh = 14 + Math.floor(r() * (h - 22))
    const top = y + h - bh
    const col = sky === 'day' ? (r() > 0.5 ? '#50698a' : '#5d7898') : r() > 0.5 ? '#241a3a' : '#2e2248'
    rect(ctx, bx, top, Math.min(bw, x + w - bx), bh, col)
    ctx.fillStyle = sky === 'day' ? '#3f5573' : '#181028'
    ctx.fillRect(bx, top, 1, bh)
    for (let wy = top + 3; wy < y + h - 2; wy += 4) {
      for (let wx = bx + 2; wx < Math.min(bx + bw - 1, x + w - 1); wx += 3) {
        const lit = r() > (sky === 'day' ? 0.8 : 0.55)
        ctx.fillStyle = lit ? '#f4e39a' : sky === 'day' ? '#8aa4c4' : '#3a3050'
        ctx.fillRect(wx, wy, 1, 2)
      }
    }
    bx += bw + 1
  }
  if (blinds) {
    const blindsH = Math.floor(h * 0.42)
    for (let by = y; by < y + blindsH; by += 3) {
      rect(ctx, x, by, w, 2, '#ecebe2')
      rect(ctx, x, by + 1, w, 1, '#c9c7ba')
    }
    rect(ctx, x, y + blindsH, w, 2, '#9f9d90')
  }
  // mullions
  const frame = sky === 'day' ? '#d7dbd9' : '#3a2418'
  for (let i = 1; i < Math.round(w / 50) + 1; i++) {
    const mx = x + Math.floor((w * i) / (Math.round(w / 50) + 1))
    rect(ctx, mx - 1, y, 2, h, frame)
  }
  rect(ctx, x - 5, y + h + 2, w + 10, 3, sky === 'day' ? '#c9cdca' : '#6e4228')
  rect(ctx, x - 5, y + h + 5, w + 10, 1, '#2a1a12')
}

export function drawClock(ctx: Ctx, cx: number, cy: number) {
  for (let y = -9; y <= 9; y++) {
    for (let x = -9; x <= 9; x++) {
      const d = Math.hypot(x, y)
      if (d <= 9) {
        ctx.fillStyle = d > 7.6 ? '#2a2a2e' : '#f4f1e6'
        ctx.fillRect(cx + x, cy + y, 1, 1)
      }
    }
  }
  ctx.fillStyle = '#2a2a2e'
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    ctx.fillRect(Math.round(cx + Math.sin(a) * 6), Math.round(cy - Math.cos(a) * 6), 1, 1)
  }
  // 4:45, nearly home time
  for (let i = 0; i <= 4; i++) ctx.fillRect(Math.round(cx + (i * 3.5) / 4), Math.round(cy - i / 4), 1, 1)
  for (let i = 0; i <= 5; i++) ctx.fillRect(Math.round(cx - i), cy, 1, 1)
  ctx.fillStyle = '#d62828'
  for (let i = 0; i <= 5; i++) ctx.fillRect(cx, cy + i, 1, 1)
}

export function drawMonitor(ctx: Ctx, x: number, y: number) {
  rect(ctx, x, y, 22, 17, '#2a2522')
  rect(ctx, x + 1, y + 1, 20, 15, '#d8cfb2')
  rect(ctx, x + 1, y + 13, 20, 3, '#b8ae90')
  rect(ctx, x + 3, y + 3, 16, 10, '#123056')
  ctx.fillStyle = '#5fe08a'
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 5, y + 5 + i * 2, 4 + ((i * 5) % 9), 1)
  rect(ctx, x + 8, y + 17, 6, 2, '#b8ae90')
  rect(ctx, x + 5, y + 19, 12, 1, '#2a2522')
}

export function drawPlant(ctx: Ctx, x: number, y: number) {
  const leaves = [
    [0, -18], [-6, -14], [6, -15], [-9, -8], [9, -9], [-3, -22], [3, -20], [-7, -20], [8, -19],
  ]
  for (const [dx, dy] of leaves) {
    for (let i = 0; i < 7; i++) {
      const px = x + Math.round((dx * i) / 7)
      const py = y + Math.round((dy * i) / 7)
      ctx.fillStyle = i > 4 ? '#6cc05a' : '#3f8a3f'
      ctx.fillRect(px, py, 2, 2)
      ctx.fillStyle = '#244f24'
      ctx.fillRect(px, py + 2, 2, 1)
    }
  }
  rect(ctx, x - 6, y, 13, 11, '#2a1a12')
  rect(ctx, x - 5, y + 1, 11, 9, '#b0582e')
  rect(ctx, x - 5, y + 1, 11, 2, '#cf7444')
  rect(ctx, x + 3, y + 3, 3, 7, '#8c4020')
}

export function drawMug(ctx: Ctx, x: number, y: number, c = '#d62828') {
  rect(ctx, x, y, 6, 7, '#2a2a2e')
  rect(ctx, x + 1, y + 1, 4, 5, c)
  rect(ctx, x + 6, y + 2, 2, 3, '#2a2a2e')
}

/** A framed motivational poster: picture on top, slogan underneath. */
export function drawPoster(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  slogan: string,
  picture: (px: number, py: number, pw: number, ph: number) => void,
  frame = '#3b2618',
) {
  rect(ctx, x, y, w, h, frame)
  rect(ctx, x + 2, y + 2, w - 4, h - 4, '#101830')
  const ph = h - 17
  picture(x + 2, y + 2, w - 4, ph)
  rect(ctx, x + 2, y + 2 + ph, w - 4, 1, '#0a0e1c')
  drawText(ctx, slogan, x + w / 2, y + h - 12, { color: '#f4e39a', align: 'center' })
  rect(ctx, x + 8, y + h - 4, w - 16, 1, '#4a5a80')
}

/** A cloth banner hanging from two strings, big letters. */
export function drawBanner(ctx: Ctx, cx: number, y: number, text: string, bg: string, fg: string, scale = 1) {
  const w = textWidth(text, scale) + 16
  const h = 7 * scale + 8
  const x = Math.round(cx - w / 2)
  ctx.fillStyle = '#2a2a2e'
  for (let i = 0; i < y; i++) {
    ctx.fillRect(x + 4 + Math.floor(i * 0.3), i, 1, 1)
    ctx.fillRect(x + w - 5 - Math.floor(i * 0.3), i, 1, 1)
  }
  rect(ctx, x, y, w, h, '#10101c')
  rect(ctx, x + 1, y + 1, w - 2, h - 2, bg)
  rect(ctx, x + 1, y + h - 3, w - 2, 2, shade(bg))
  // swallowtail ends
  for (let i = 0; i < h; i++) {
    const cut = Math.abs(i - h / 2) < 2 ? 3 : 0
    rect(ctx, x - 4 + cut, y + i, 4 - cut, 1, i === 0 || i === h - 1 ? '#10101c' : bg)
    rect(ctx, x + w, y + i, 4 - cut, 1, i === 0 || i === h - 1 ? '#10101c' : bg)
  }
  drawText(ctx, text, cx, y + 4, { scale, color: fg, shadow: shade(bg), align: 'center' })
}

function shade(hex: string) {
  const n = parseInt(hex.slice(1), 16)
  const f = (v: number) => Math.max(0, Math.floor(v * 0.7))
  const r = f(n >> 16)
  const g = f((n >> 8) & 255)
  const b = f(n & 255)
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`
}

/** Speckled carpet with perspective seams converging to the centre. */
export function carpet(ctx: Ctx, base: string, dark: string, light: string, seam: string, seed = 7) {
  const r = rng(seed)
  rect(ctx, 0, FLOOR_TOP, VIEW_W, VIEW_H - FLOOR_TOP, base)
  dither(ctx, 0, FLOOR_TOP, VIEW_W, 6, dark)
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(r() * VIEW_W)
    const y = FLOOR_TOP + Math.floor(r() * (VIEW_H - FLOOR_TOP))
    ctx.fillStyle = r() > 0.5 ? light : dark
    ctx.fillRect(x, y, 1, 1)
  }
  ctx.fillStyle = seam
  for (let i = -8; i <= 8; i++) {
    for (let y = FLOOR_TOP; y < VIEW_H; y++) {
      const t = (y - FLOOR_TOP) / (VIEW_H - FLOOR_TOP)
      ctx.fillRect(Math.round(VIEW_W / 2 + i * (24 + t * 34)), y, 1, 1)
    }
  }
}

/** Checkerboard linoleum in perspective (cafeteria). */
export function checkerFloor(ctx: Ctx, c1: string, c2: string) {
  const H = VIEW_H - FLOOR_TOP
  for (let y = FLOOR_TOP; y < VIEW_H; y++) {
    const t = (y - FLOOR_TOP + 1) / H
    const depth = 1 / (t + 0.35)
    const row = Math.floor(depth * 3.2)
    const tile = 14 + t * 30
    for (let x = 0; x < VIEW_W; x++) {
      const col = Math.floor((x - VIEW_W / 2) / tile + 100)
      ctx.fillStyle = (row + col) % 2 ? c1 : c2
      ctx.fillRect(x, y, 1, 1)
    }
  }
  dither(ctx, 0, FLOOR_TOP, VIEW_W, 4, '#00000022')
}

/** Ceiling fluorescent tubes; one of them flickers. */
export function fluorescent(ctx: Ctx, frame: number, tubes = [56, 176, 296]) {
  tubes.forEach((x, i) => {
    const flickering = i === tubes.length - 1 && (frame % 240 < 6 || (frame % 240 > 12 && frame % 240 < 15))
    rect(ctx, x, 2, 36, 9, '#7c7b70')
    rect(ctx, x + 1, 3, 34, 7, flickering ? '#8e9aa3' : '#f2fbff')
    if (!flickering) {
      rect(ctx, x + 1, 3, 34, 1, '#ffffff')
      rect(ctx, x + 1, 9, 34, 1, '#bfe0f2')
    }
  })
}
