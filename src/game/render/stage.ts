import { VIEW_H, VIEW_W } from '../constants'
import { drawText } from './font'

/**
 * "Open-Plan Floor 3": the office stage, painted once into an offscreen
 * canvas with flat colours and checkerboard dithering, like a 90s backdrop.
 */

const CEIL_H = 16
const WALL_BOTTOM = 160

type Ctx = CanvasRenderingContext2D

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c
  ctx.fillRect(x, y, w, h)
}

/** checkerboard dither of colour c2 over whatever is there */
function dither(ctx: Ctx, x: number, y: number, w: number, h: number, c2: string, density = 2) {
  ctx.fillStyle = c2
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (density === 2 ? (xx + yy) % 2 === 0 : (xx % 2 === 0 && yy % 2 === 0)) ctx.fillRect(xx, yy, 1, 1)
    }
  }
}

/** deterministic pseudo random so the stage looks the same every time */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function drawWindow(ctx: Ctx, x: number, y: number, w: number, h: number, seed: number) {
  const r = rng(seed)
  rect(ctx, x - 3, y - 3, w + 6, h + 6, '#5c6360')
  rect(ctx, x - 2, y - 2, w + 4, h + 4, '#d7dbd9')
  // sky gradient in bands + dither
  const sky = ['#6fa6de', '#7db3e4', '#8fc0ea', '#a4cff0', '#b9dcf4']
  const band = Math.ceil(h / sky.length)
  sky.forEach((c, i) => rect(ctx, x, y + i * band, w, Math.min(band, h - i * band), c))
  for (let i = 1; i < sky.length; i++) {
    ctx.fillStyle = sky[i]
    for (let xx = x; xx < x + w; xx += 2) ctx.fillRect(xx + (i % 2), y + i * band - 1, 1, 1)
  }
  // skyline
  let bx = x
  while (bx < x + w) {
    const bw = 8 + Math.floor(r() * 14)
    const bh = 14 + Math.floor(r() * (h - 22))
    const top = y + h - bh
    const col = r() > 0.5 ? '#50698a' : '#5d7898'
    rect(ctx, bx, top, Math.min(bw, x + w - bx), bh, col)
    ctx.fillStyle = '#3f5573'
    ctx.fillRect(bx, top, 1, bh)
    for (let wy = top + 3; wy < y + h - 2; wy += 4) {
      for (let wx = bx + 2; wx < Math.min(bx + bw - 1, x + w - 1); wx += 3) {
        ctx.fillStyle = r() > 0.8 ? '#f4e39a' : '#8aa4c4'
        ctx.fillRect(wx, wy, 1, 2)
      }
    }
    bx += bw + 1
  }
  // venetian blinds, half down
  const blindsH = Math.floor(h * 0.42)
  for (let by = y; by < y + blindsH; by += 3) {
    rect(ctx, x, by, w, 2, '#ecebe2')
    rect(ctx, x, by + 1, w, 1, '#c9c7ba')
  }
  rect(ctx, x, y + blindsH, w, 2, '#9f9d90')
  // window mullion
  rect(ctx, x + Math.floor(w / 2) - 1, y, 2, h, '#d7dbd9')
  rect(ctx, x + Math.floor(w / 2), y, 1, h, '#a9aeac')
  // sill
  rect(ctx, x - 5, y + h + 2, w + 10, 3, '#c9cdca')
  rect(ctx, x - 5, y + h + 5, w + 10, 1, '#6e7471')
}

function drawClock(ctx: Ctx, cx: number, cy: number) {
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

function drawPoster(ctx: Ctx, x: number, y: number) {
  const w = 60
  const h = 42
  rect(ctx, x, y, w, h, '#3b2618')
  rect(ctx, x + 2, y + 2, w - 4, h - 4, '#20315a')
  // sunset + mountain
  rect(ctx, x + 2, y + 2, w - 4, 10, '#e8904a')
  rect(ctx, x + 2, y + 12, w - 4, 6, '#b8567a')
  dither(ctx, x + 2, y + 11, w - 4, 2, '#b8567a')
  ctx.fillStyle = '#0f1a33'
  for (let i = 0; i < 16; i++) ctx.fillRect(x + 14 + i, y + 22 - Math.floor(i * 0.8), 1, Math.floor(i * 0.8) + 1)
  for (let i = 0; i < 20; i++) ctx.fillRect(x + 30 + i, y + 10 + Math.floor(i * 0.6), 1, 13 - Math.floor(i * 0.6))
  rect(ctx, x + 2, y + 22, w - 4, 1, '#0f1a33')
  drawText(ctx, 'SYNERGY', x + w / 2, y + 27, { color: '#f4e39a', align: 'center' })
  rect(ctx, x + 10, y + h - 6, w - 20, 1, '#6c7fa8')
}

function drawMonitor(ctx: Ctx, x: number, y: number) {
  // chunky beige CRT
  rect(ctx, x, y, 22, 17, '#2a2522')
  rect(ctx, x + 1, y + 1, 20, 15, '#d8cfb2')
  rect(ctx, x + 1, y + 13, 20, 3, '#b8ae90')
  rect(ctx, x + 3, y + 3, 16, 10, '#123056')
  ctx.fillStyle = '#5fe08a'
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 5, y + 5 + i * 2, 4 + ((i * 5) % 9), 1)
  rect(ctx, x + 8, y + 17, 6, 2, '#b8ae90')
  rect(ctx, x + 5, y + 19, 12, 1, '#2a2522')
}

function drawPlant(ctx: Ctx, x: number, y: number) {
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

function drawWaterCooler(ctx: Ctx, x: number, y: number) {
  // jug
  rect(ctx, x + 2, y, 14, 18, '#1d3f5e')
  rect(ctx, x + 3, y + 1, 12, 16, '#7ec8f0')
  rect(ctx, x + 4, y + 2, 2, 12, '#d8f1ff')
  rect(ctx, x + 3, y + 5, 12, 1, '#5aa6d6')
  rect(ctx, x + 6, y + 18, 6, 2, '#1d3f5e')
  // body
  rect(ctx, x, y + 20, 18, 30, '#2a2a2e')
  rect(ctx, x + 1, y + 21, 16, 28, '#e4e4de')
  rect(ctx, x + 13, y + 21, 4, 28, '#bdbdb5')
  rect(ctx, x + 5, y + 27, 3, 3, '#3a7bd5')
  rect(ctx, x + 10, y + 27, 3, 3, '#d62828')
  rect(ctx, x + 4, y + 32, 10, 2, '#8a8a84')
}

function drawCubicle(ctx: Ctx, x: number, w: number, top: number) {
  const h = WALL_BOTTOM + 6 - top
  rect(ctx, x, top, w, h, '#2a2e3a')
  rect(ctx, x + 1, top + 1, w - 2, h - 1, '#6b7c98')
  dither(ctx, x + 1, top + 4, w - 2, h - 5, '#62728d')
  rect(ctx, x, top, w, 3, '#c3c6cc')
  rect(ctx, x, top + 3, w, 1, '#8a8e96')
  // posts
  rect(ctx, x, top, 2, h, '#9aa0aa')
  rect(ctx, x + w - 2, top, 2, h, '#9aa0aa')
  // pinned memos
  rect(ctx, x + 8, top + 10, 7, 8, '#f4f1e6')
  rect(ctx, x + 9, top + 12, 5, 1, '#9a9a9a')
  rect(ctx, x + 9, top + 14, 4, 1, '#9a9a9a')
  rect(ctx, x + 11, top + 10, 1, 1, '#d62828')
  rect(ctx, x + w - 18, top + 14, 6, 6, '#f7e36a')
}

export function createStage(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = VIEW_W
  canvas.height = VIEW_H
  const ctx = canvas.getContext('2d')!
  const r = rng(7)

  // ceiling tiles
  rect(ctx, 0, 0, VIEW_W, CEIL_H, '#c9c8bd')
  for (let x = 0; x < VIEW_W; x += 32) rect(ctx, x, 0, 1, CEIL_H, '#a7a699')
  rect(ctx, 0, 7, VIEW_W, 1, '#a7a699')
  dither(ctx, 0, 0, VIEW_W, CEIL_H, '#bdbcb0', 4)
  rect(ctx, 0, CEIL_H - 1, VIEW_W, 1, '#7c7b70')

  // wall
  rect(ctx, 0, CEIL_H, VIEW_W, WALL_BOTTOM - CEIL_H, '#a3ab94')
  dither(ctx, 0, CEIL_H, VIEW_W, 10, '#939b85')
  rect(ctx, 0, CEIL_H, VIEW_W, 2, '#8a917c')

  drawWindow(ctx, 22, 30, 96, 66, 11)
  drawWindow(ctx, 266, 30, 96, 66, 23)
  drawClock(ctx, 192, 32)
  drawPoster(ctx, 162, 48)

  // cubicle row with gear on top
  drawCubicle(ctx, -2, 98, 118)
  drawCubicle(ctx, 290, 96, 118)
  drawCubicle(ctx, 104, 70, 124)
  drawCubicle(ctx, 212, 70, 124)
  drawMonitor(ctx, 30, 99)
  drawMonitor(ctx, 120, 105)
  drawMonitor(ctx, 330, 99)
  drawPlant(ctx, 250, 113)
  // coffee mug + paper stack
  rect(ctx, 70, 111, 6, 7, '#2a2a2e')
  rect(ctx, 71, 112, 4, 5, '#d62828')
  rect(ctx, 76, 113, 2, 3, '#2a2a2e')
  rect(ctx, 304, 110, 14, 8, '#2a2a2e')
  for (let i = 0; i < 4; i++) rect(ctx, 305, 111 + i * 2, 12, 1, i % 2 ? '#e4e4de' : '#f4f4ee')
  drawWaterCooler(ctx, 183, 110)

  // baseboard
  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 6, '#4a4e44')
  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 1, '#6c7064')

  // carpet
  const floorTop = WALL_BOTTOM + 6
  rect(ctx, 0, floorTop, VIEW_W, VIEW_H - floorTop, '#4d5a70')
  dither(ctx, 0, floorTop, VIEW_W, 6, '#3f4a5e')
  for (let i = 0; i < 900; i++) {
    const x = Math.floor(r() * VIEW_W)
    const y = floorTop + Math.floor(r() * (VIEW_H - floorTop))
    ctx.fillStyle = r() > 0.5 ? '#56647c' : '#445167'
    ctx.fillRect(x, y, 1, 1)
  }
  // perspective seams
  ctx.fillStyle = '#414d62'
  for (let i = -8; i <= 8; i++) {
    for (let y = floorTop; y < VIEW_H; y++) {
      const t = (y - floorTop) / (VIEW_H - floorTop)
      const x = Math.round(VIEW_W / 2 + i * (24 + t * 34))
      ctx.fillRect(x, y, 1, 1)
    }
  }
  // a suspicious coffee stain
  for (let y = -3; y <= 3; y++) {
    for (let x = -7; x <= 7; x++) {
      if ((x * x) / 49 + (y * y) / 9 <= 1 && (x + y) % 2 === 0) {
        ctx.fillStyle = '#5b4a3a'
        ctx.fillRect(300 + x, 205 + y, 1, 1)
      }
    }
  }
  return canvas
}

/** Ceiling fluorescent tubes (drawn every frame so one can flicker). */
export function drawLights(ctx: Ctx, frame: number) {
  const tubes = [56, 176, 296]
  tubes.forEach((x, i) => {
    const flickering = i === 2 && (frame % 240 < 6 || (frame % 240 > 12 && frame % 240 < 15))
    rect(ctx, x, 2, 36, 9, '#7c7b70')
    rect(ctx, x + 1, 3, 34, 7, flickering ? '#8e9aa3' : '#f2fbff')
    if (!flickering) {
      rect(ctx, x + 1, 3, 34, 1, '#ffffff')
      rect(ctx, x + 1, 9, 34, 1, '#bfe0f2')
    }
  })
}
