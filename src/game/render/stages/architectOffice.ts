import { VIEW_H, VIEW_W } from '../../constants'
import { drawText } from '../font'
import {
  baseboard,
  carpet,
  ceilingTiles,
  CEIL_H,
  dither,
  drawBanner,
  drawMug,
  FLOOR_TOP,
  newCanvas,
  rect,
  rng,
  WALL_BOTTOM,
  type Ctx,
} from './kit'

/**
 * "The Architect's Office": the lair of a SOFTWARE architect. A whiteboard
 * with the system diagram (v7, final, final), buried under sticky notes, a
 * pinboard of printed diagrams, a microservices flip chart that looks like
 * spaghetti, and desks drowning in paper and coffee cups.
 */

const INK = '#2a2a34'
const BLUE_INK = '#3a7bd5'
const RED_INK = '#d62828'
const GREEN_INK = '#2a9a4a'
const NOTE_COLORS = ['#f7e36a', '#ff9ac0', '#9ae0ff', '#a8f09a', '#ffb86a']

/** a sticky note with a scribble on it */
function stickyNote(ctx: Ctx, x: number, y: number, c: string, r: () => number, size = 8) {
  rect(ctx, x + 1, y + 1, size, size, 'rgba(0, 0, 0, 0.18)')
  rect(ctx, x, y, size, size, c)
  rect(ctx, x, y + size - 1, size, 1, 'rgba(0, 0, 0, 0.14)')
  // scribbles
  ctx.fillStyle = r() > 0.3 ? '#4a4a58' : RED_INK
  const lines = 1 + Math.floor(r() * 3)
  for (let i = 0; i < lines; i++) ctx.fillRect(x + 1, y + 2 + i * 2, 2 + Math.floor(r() * (size - 3)), 1)
  // a curled corner now and then
  if (r() > 0.6) rect(ctx, x + size - 2, y, 2, 2, '#f8f8f4')
}

/** outlined box with a label, whiteboard style */
function node(ctx: Ctx, x: number, y: number, w: number, label: string, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x, y, w, 1)
  ctx.fillRect(x, y + 12, w, 1)
  ctx.fillRect(x, y, 1, 13)
  ctx.fillRect(x + w - 1, y, 1, 13)
  drawText(ctx, label, x + w / 2, y + 3, { color, align: 'center' })
}

/** hand-drawn arrow between two points (straight, with a head) */
function arrow(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, color: string) {
  ctx.fillStyle = color
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    ctx.fillRect(Math.round(x0 + (x1 - x0) * t), Math.round(y0 + (y1 - y0) * t + Math.sin(t * 6) * 0.6), 1, 1)
  }
  const dx = Math.sign(x1 - x0)
  const dy = Math.sign(y1 - y0)
  if (Math.abs(x1 - x0) >= Math.abs(y1 - y0)) {
    ctx.fillRect(x1 - dx * 2, y1 - 2, 1, 1)
    ctx.fillRect(x1 - dx * 2, y1 + 2, 1, 1)
    ctx.fillRect(x1 - dx, y1 - 1, 1, 3)
  } else {
    ctx.fillRect(x1 - 2, y1 - dy * 2, 1, 1)
    ctx.fillRect(x1 + 2, y1 - dy * 2, 1, 1)
    ctx.fillRect(x1 - 1, y1 - dy, 3, 1)
  }
}

/** database cylinder */
function cylinder(ctx: Ctx, x: number, y: number, color: string) {
  ctx.fillStyle = color
  for (let i = 0; i < 16; i++) {
    const dy = Math.round(Math.sin((i / 15) * Math.PI) * 2)
    ctx.fillRect(x + i, y - dy, 1, 1)
    ctx.fillRect(x + i, y + dy, 1, 1)
    ctx.fillRect(x + i, y + 12 + dy, 1, 1)
  }
  ctx.fillRect(x, y, 1, 12)
  ctx.fillRect(x + 15, y, 1, 12)
  drawText(ctx, 'DB', x + 8, y + 4, { color, align: 'center' })
}

function whiteboard(ctx: Ctx) {
  const x = 104
  const y = 42
  const w = 176
  const h = 80
  const r = rng(71)
  rect(ctx, x - 2, y - 2, w + 4, h + 4, '#8a929a')
  rect(ctx, x, y, w, h, '#f8f8f4')
  dither(ctx, x, y, w, 3, '#e8ece8')
  // ghosts of erased diagrams
  ctx.fillStyle = '#e4e6ec'
  for (let i = 0; i < 14; i++) ctx.fillRect(x + 6 + Math.floor(r() * (w - 30)), y + 10 + Math.floor(r() * (h - 20)), 10 + Math.floor(r() * 20), 1)

  drawText(ctx, 'ARCH V7 FINAL (FINAL)', x + 6, y + 5, { color: INK })
  rect(ctx, x + 6, y + 13, 124, 1, INK)

  // the system: WEB -> API -> DB, API -> QUEUE -> WORKER, and a CACHE nobody asked for
  node(ctx, x + 8, y + 22, 26, 'WEB', BLUE_INK)
  arrow(ctx, x + 35, y + 28, x + 48, y + 28, INK)
  node(ctx, x + 50, y + 22, 26, 'API', BLUE_INK)
  arrow(ctx, x + 77, y + 28, x + 92, y + 28, INK)
  cylinder(ctx, x + 94, y + 22, GREEN_INK)
  arrow(ctx, x + 63, y + 36, x + 63, y + 48, INK)
  node(ctx, x + 44, y + 50, 38, 'QUEUE', BLUE_INK)
  arrow(ctx, x + 83, y + 56, x + 96, y + 56, INK)
  node(ctx, x + 98, y + 50, 44, 'WORKER', BLUE_INK)
  node(ctx, x + 8, y + 50, 32, 'CACHE', RED_INK)
  arrow(ctx, x + 36, y + 49, x + 50, y + 36, RED_INK)
  // big red question marks and a circled "SPOF?"
  drawText(ctx, '??', x + 118, y + 26, { color: RED_INK, scale: 2 })
  const cx = x + 30
  const cy = y + 71
  ctx.fillStyle = RED_INK
  for (let a = 0; a < 40; a++) {
    const t = (a / 40) * Math.PI * 2
    ctx.fillRect(Math.round(cx + Math.cos(t) * 20), Math.round(cy + Math.sin(t) * 6), 1, 1)
  }
  drawText(ctx, 'SPOF?', cx, cy - 3, { color: RED_INK, align: 'center' })
  drawText(ctx, 'IT DEPENDS', x + 60, y + 70, { color: GREEN_INK })

  // ...and sticky notes everywhere, mostly on the right, spilling off the board
  for (let i = 0; i < 26; i++) {
    const nx = x + w - 40 + Math.floor(r() * 44)
    const ny = y + 4 + Math.floor(r() * (h - 6))
    stickyNote(ctx, nx, ny, NOTE_COLORS[i % NOTE_COLORS.length], r)
  }
  for (let i = 0; i < 9; i++) stickyNote(ctx, x + 4 + Math.floor(r() * 120), y + 36 + Math.floor(r() * 44), NOTE_COLORS[(i * 3) % 5], r)
  // marker tray
  rect(ctx, x + 6, y + h + 2, w - 12, 3, '#8a929a')
  rect(ctx, x + 14, y + h + 1, 7, 2, RED_INK)
  rect(ctx, x + 24, y + h + 1, 7, 2, BLUE_INK)
  rect(ctx, x + 34, y + h + 1, 7, 2, GREEN_INK)
  rect(ctx, x + 50, y + h + 1, 9, 2, '#e8e8f0')
}

/** cork board with printed diagrams and more sticky notes */
function pinboard(ctx: Ctx) {
  const x = 12
  const y = 30
  const w = 78
  const h = 66
  const r = rng(13)
  rect(ctx, x - 2, y - 2, w + 4, h + 4, '#6a4a2a')
  rect(ctx, x, y, w, h, '#c89a60')
  dither(ctx, x, y, w, h, '#b88a50', 4)
  // printouts: sequence diagrams, UML boxes
  const sheets: [number, number][] = [[4, 4], [30, 8], [54, 3], [8, 34], [40, 36]]
  sheets.forEach(([sx, sy], i) => {
    const px = x + sx
    const py = y + sy
    rect(ctx, px + 1, py + 1, 20, 26, 'rgba(0, 0, 0, 0.2)')
    rect(ctx, px, py, 20, 26, '#f4f4ee')
    ctx.fillStyle = '#6a6a88'
    if (i % 2 === 0) {
      // sequence diagram: lifelines and messages
      for (const lx of [4, 10, 16]) ctx.fillRect(px + lx, py + 5, 1, 19)
      for (let m = 0; m < 4; m++) ctx.fillRect(px + 4 + (m % 2) * 6, py + 8 + m * 4, 6, 1)
      rect(ctx, px + 2, py + 2, 16, 2, '#9ab8e0')
    } else {
      // class diagram: little boxes joined up
      for (const [bx, by] of [[2, 3], [11, 3], [6, 15]]) {
        ctx.fillRect(px + bx, py + by, 7, 1)
        ctx.fillRect(px + bx, py + by + 7, 7, 1)
        ctx.fillRect(px + bx, py + by, 1, 7)
        ctx.fillRect(px + bx + 6, py + by, 1, 8)
      }
      ctx.fillRect(px + 9, py + 10, 1, 5)
    }
    rect(ctx, px + 9, py - 1, 2, 2, i % 2 ? RED_INK : BLUE_INK)
  })
  for (let i = 0; i < 8; i++) stickyNote(ctx, x + 2 + Math.floor(r() * (w - 10)), y + 2 + Math.floor(r() * (h - 10)), NOTE_COLORS[i % 5], r, 7)
}

/** flip chart on an easel: the microservices "architecture" */
function flipChart(ctx: Ctx) {
  const x = 300
  const y = 46
  const w = 62
  const h = 62
  // easel legs
  ctx.fillStyle = '#5a5a66'
  for (let i = 0; i < 60; i++) {
    ctx.fillRect(x + 8 - Math.floor(i / 6), y + h + i * 0.9, 2, 1)
    ctx.fillRect(x + w - 10 + Math.floor(i / 6), y + h + i * 0.9, 2, 1)
  }
  rect(ctx, x + w / 2 - 1, y + h, 2, 40, '#5a5a66')
  rect(ctx, x - 1, y - 3, w + 2, 4, '#3a3a44')
  rect(ctx, x, y, w, h, '#fbfbf6')
  rect(ctx, x, y + h - 2, w, 2, '#e0e0d8')
  drawText(ctx, 'MICRO', x + w / 2, y + 4, { color: INK, align: 'center' })
  drawText(ctx, 'SERVICES', x + w / 2, y + 12, { color: INK, align: 'center' })
  // spaghetti: many little services, everything calls everything
  const r = rng(5)
  const pts: [number, number][] = []
  for (let i = 0; i < 11; i++) pts.push([x + 6 + Math.floor(r() * (w - 12)), y + 24 + Math.floor(r() * (h - 32))])
  ctx.fillStyle = '#8a8aa0'
  for (let i = 0; i < 22; i++) {
    const a = pts[Math.floor(r() * pts.length)]
    const b = pts[Math.floor(r() * pts.length)]
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), 1)
    for (let s = 0; s <= n; s += 2) ctx.fillRect(Math.round(a[0] + ((b[0] - a[0]) * s) / n), Math.round(a[1] + ((b[1] - a[1]) * s) / n), 1, 1)
  }
  pts.forEach(([px, py], i) => {
    rect(ctx, px - 2, py - 2, 5, 5, INK)
    rect(ctx, px - 1, py - 1, 3, 3, [BLUE_INK, GREEN_INK, RED_INK][i % 3])
  })
}

function monitor(ctx: Ctx, x: number, y: number, seed: number) {
  const r = rng(seed)
  rect(ctx, x, y, 28, 20, '#1a1a22')
  rect(ctx, x + 2, y + 2, 24, 15, '#1c3a6a')
  // a diagram on screen
  for (let i = 0; i < 4; i++) rect(ctx, x + 4 + Math.floor(r() * 16), y + 4 + Math.floor(r() * 9), 5, 3, '#dce8f6')
  rect(ctx, x + 6, y + 9, 14, 1, '#9ab8e0')
  rect(ctx, x + 12, y + 20, 4, 4, '#2a2a34')
  rect(ctx, x + 7, y + 24, 14, 2, '#2a2a34')
}

function paperStack(ctx: Ctx, x: number, y: number, n: number) {
  for (let i = 0; i < n; i++) {
    const off = (i * 7) % 3 - 1
    rect(ctx, x + off, y - i * 2, 16, 2, i % 2 ? '#f4f4ee' : '#e0e0d8')
    rect(ctx, x + off, y - i * 2 + 1, 16, 1, '#b8b8b0')
  }
}

function desk(ctx: Ctx, x: number, w: number, seed: number, props: (top: number) => void) {
  const top = 128
  rect(ctx, x, top, w, 5, '#10101c')
  rect(ctx, x + 1, top + 1, w - 2, 3, '#9a8a70')
  rect(ctx, x + 1, top + 1, w - 2, 1, '#b8a888')
  rect(ctx, x + 3, top + 5, 4, WALL_BOTTOM + 4 - top - 5, '#3a3a44')
  rect(ctx, x + w - 7, top + 5, 4, WALL_BOTTOM + 4 - top - 5, '#3a3a44')
  // cable spaghetti hanging under the desk
  const r = rng(seed)
  for (const c of ['#2a2a34', '#3a7bd5', '#d6c040']) {
    ctx.fillStyle = c
    const x0 = x + 10 + Math.floor(r() * (w - 20))
    for (let i = 0; i < 20; i++) ctx.fillRect(x0 + Math.round(Math.sin(i * 0.5) * 3), top + 5 + i, 1, 1)
  }
  props(top)
}

function trashCan(ctx: Ctx, x: number) {
  const top = 140
  rect(ctx, x, top, 16, WALL_BOTTOM + 4 - top, '#10101c')
  rect(ctx, x + 1, top + 1, 14, WALL_BOTTOM + 2 - top, '#5a6272')
  for (let i = 0; i < 3; i++) rect(ctx, x + 3 + i * 4, top + 3, 1, WALL_BOTTOM - top - 2, '#4a5060')
  // overflowing crumpled paper
  for (const [dx, dy] of [[2, -3], [7, -5], [11, -2], [5, -8], [-3, 18], [19, 20]]) {
    rect(ctx, x + dx, top + dy, 5, 4, '#f4f4ee')
    rect(ctx, x + dx + 1, top + dy + 1, 2, 1, '#b8b8b0')
  }
}

/** papers and crumpled balls lying on the carpet */
function floorMess(ctx: Ctx) {
  const r = rng(29)
  for (let i = 0; i < 16; i++) {
    const x = Math.floor(r() * VIEW_W)
    const y = FLOOR_TOP + 4 + Math.floor(r() * (VIEW_H - FLOOR_TOP - 8))
    const t = (y - FLOOR_TOP) / (VIEW_H - FLOOR_TOP)
    const sw = Math.round(6 + t * 8)
    if (r() > 0.4) {
      rect(ctx, x, y, sw, Math.max(2, Math.round(sw / 3)), '#e8e8e0')
      rect(ctx, x + 1, y, sw - 2, 1, '#f8f8f4')
    } else {
      rect(ctx, x, y, 4, 3, '#f4f4ee')
      rect(ctx, x + 1, y + 1, 2, 1, '#b8b8b0')
    }
  }
  // a stray sticky note
  rect(ctx, 250, FLOOR_TOP + 30, 7, 3, '#f7e36a')
}

export function createArchitectOffice(): HTMLCanvasElement {
  const [canvas, ctx] = newCanvas()
  ceilingTiles(ctx)
  rect(ctx, 0, CEIL_H, VIEW_W, WALL_BOTTOM - CEIL_H, '#c4c8c0')
  dither(ctx, 0, CEIL_H, VIEW_W, 8, '#b4b8b0')
  dither(ctx, 0, 110, VIEW_W, WALL_BOTTOM - 110, '#b8bcb4', 4)

  pinboard(ctx)
  whiteboard(ctx)
  flipChart(ctx)
  drawBanner(ctx, VIEW_W / 2, 24, 'DESIGN FOR SCALE', '#1f3b8c', '#ffe135')

  desk(ctx, 8, 96, 3, (top) => {
    monitor(ctx, 14, top - 26, 4)
    monitor(ctx, 44, top - 26, 8)
    paperStack(ctx, 76, top - 2, 6)
    drawMug(ctx, 90, top - 7, '#f4f4ee')
    drawMug(ctx, 8 + 60, top - 7, '#ffd23c')
    // keyboard + a rubber duck for debugging
    rect(ctx, 24, top - 3, 30, 3, '#2a2a34')
    rect(ctx, 25, top - 3, 28, 1, '#5a5a66')
    rect(ctx, 58, top - 6, 5, 4, '#ffd23c')
    rect(ctx, 61, top - 8, 3, 3, '#ffd23c')
    rect(ctx, 64, top - 7, 2, 1, '#ff8a2a')
  })
  desk(ctx, 286, 92, 11, (top) => {
    // laptop, stacked books, a pizza box, more cups
    rect(ctx, 300, top - 14, 22, 13, '#1a1a22')
    rect(ctx, 302, top - 12, 18, 9, '#9ab8e0')
    rect(ctx, 296, top - 2, 30, 2, '#5a5a66')
    const books = ['#d62828', '#1f3b8c', '#2a9a4a', '#ffb86a', '#6a3a8a']
    books.forEach((c, i) => {
      rect(ctx, 332 - (i % 2), top - 4 - i * 4, 22, 4, c)
      rect(ctx, 332 - (i % 2), top - 4 - i * 4, 22, 1, '#ffffff44')
    })
    rect(ctx, 356, top - 3, 18, 3, '#c8a060')
    rect(ctx, 356, top - 3, 18, 1, '#e0c080')
    drawMug(ctx, 324, top - 7, '#5fe08a')
    paperStack(ctx, 288, top - 2, 3)
  })
  trashCan(ctx, 176)

  // sticky notes escape the whiteboard: on the monitors, the walls, the desk
  const loose = rng(88)
  for (const [nx, ny] of [[12, 100], [38, 104], [66, 100], [96, 70], [98, 108], [284, 60], [290, 96], [280, 118], [366, 112]]) {
    stickyNote(ctx, nx, ny, NOTE_COLORS[Math.floor(loose() * NOTE_COLORS.length)], loose, 6)
  }

  baseboard(ctx, '#5a5e56', '#7a7e74')
  carpet(ctx, '#5a6070', '#4a5060', '#6a7080', '#50566a', 41)
  floorMess(ctx)
  return canvas
}

/** the laptop screen on the right desk blinks a cursor */
export function architectAmbient(ctx: Ctx, frame: number) {
  if (frame % 60 < 30) rect(ctx, 305, 118, 3, 1, '#ffffff')
}
