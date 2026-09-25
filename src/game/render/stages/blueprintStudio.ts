import { VIEW_H, VIEW_W } from '../../constants'
import { drawText } from '../font'
import { CEIL_H, dither, drawPlant, drawPoster, drawWindow, FLOOR_TOP, newCanvas, rect, rng, WALL_BOTTOM, type Ctx } from './kit'

/**
 * "The Blueprint Studio": drafting tables, rolled-up plans, a white scale
 * model of an ivory tower and a huge blueprint on the wall. The architect's lair.
 */

const BLUE = '#1d4e89'
const BLUE_DARK = '#163c6a'
const LINE = '#dce8f6'

function blueprint(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rect(ctx, x - 1, y - 1, w + 2, h + 2, '#10101c')
  rect(ctx, x, y, w, h, BLUE)
  // grid
  ctx.fillStyle = '#2a5e9a'
  for (let gx = x + 4; gx < x + w; gx += 6) ctx.fillRect(gx, y + 1, 1, h - 2)
  for (let gy = y + 4; gy < y + h; gy += 6) ctx.fillRect(x + 1, gy, w - 2, 1)
  // floor plan on the left: rooms, doors, a spiral stair
  const px = x + 8
  const py = y + 10
  ctx.fillStyle = LINE
  const wall = (ax: number, ay: number, bw: number, bh: number) => {
    ctx.fillRect(ax, ay, bw, 1)
    ctx.fillRect(ax, ay + bh, bw + 1, 1)
    ctx.fillRect(ax, ay, 1, bh)
    ctx.fillRect(ax + bw, ay, 1, bh)
  }
  wall(px, py, 60, 40)
  wall(px, py, 26, 20)
  wall(px + 26, py, 34, 20)
  rect(ctx, px + 10, py + 20, 6, 1, BLUE)
  rect(ctx, px + 40, py + 20, 6, 1, BLUE)
  for (let a = 0; a < 24; a++) {
    const ang = (a / 24) * Math.PI * 2
    ctx.fillRect(px + 44 + Math.round(Math.cos(ang) * 7), py + 30 + Math.round(Math.sin(ang) * 7), 1, 1)
  }
  // elevation of a very, very tall tower on the right
  const tx = x + w - 42
  const base = y + h - 8
  wall(tx, base - 60, 22, 60)
  for (let fy = base - 54; fy < base; fy += 6) ctx.fillRect(tx + 1, fy, 21, 1)
  for (let i = 0; i < 10; i++) ctx.fillRect(tx + 11, base - 60 - i, 1, 1)
  ctx.fillRect(tx - 6, base, 34, 1)
  // dimension line + annotation
  ctx.fillRect(tx + 28, base - 60, 1, 60)
  ctx.fillRect(tx + 26, base - 60, 5, 1)
  ctx.fillRect(tx + 26, base - 1, 5, 1)
  drawText(ctx, 'TOO TALL?', x + 10, y + h - 12, { color: LINE })
  // pins in the corners
  for (const [cx, cy] of [[x + 2, y + 2], [x + w - 4, y + 2], [x + 2, y + h - 4], [x + w - 4, y + h - 4]]) {
    rect(ctx, cx, cy, 2, 2, '#d62828')
  }
}

function sketch(ctx: Ctx, x: number, y: number, seed: number) {
  const r = rng(seed)
  rect(ctx, x, y, 22, 28, '#f4efe0')
  rect(ctx, x, y + 27, 22, 1, '#c8c0a8')
  rect(ctx, x + 10, y - 1, 2, 2, '#3a7bd5')
  ctx.fillStyle = '#6a6a78'
  for (let i = 0; i < 6; i++) {
    const lx = x + 3 + Math.floor(r() * 10)
    ctx.fillRect(lx, y + 4 + i * 4, 4 + Math.floor(r() * 8), 1)
  }
}

function draftingTable(ctx: Ctx, x: number, lampLeft: boolean) {
  const top = 116
  // legs
  rect(ctx, x + 6, top + 10, 3, WALL_BOTTOM + 4 - top - 10, '#3a3a44')
  rect(ctx, x + 45, top + 10, 3, WALL_BOTTOM + 4 - top - 10, '#3a3a44')
  rect(ctx, x + 6, WALL_BOTTOM - 8, 42, 2, '#3a3a44')
  // tilted board (a parallelogram leaning toward us)
  for (let i = 0; i < 12; i++) {
    rect(ctx, x + i, top + i, 56 - i, 1, i === 0 ? '#10101c' : i < 2 ? '#c8c0a8' : '#f4efe0')
  }
  rect(ctx, x + 12, top + 12, 44, 2, '#8a6a40')
  // plan on the board + a ruler
  rect(ctx, x + 16, top + 3, 24, 7, '#9ab8e0')
  rect(ctx, x + 4, top + 9, 34, 1, '#d6b040')
  // desk lamp on a bent arm
  const lx = lampLeft ? x + 2 : x + 50
  const dir = lampLeft ? 1 : -1
  rect(ctx, lx, top - 2, 3, 3, '#2a2a34')
  for (let i = 0; i < 16; i++) ctx.fillRect(lx + 1 + dir * Math.floor(i / 3), top - 2 - i, 1, 1)
  for (let i = 0; i < 12; i++) ctx.fillRect(lx + 1 + dir * (5 + i), top - 18 + Math.floor(i / 2), 1, 1)
  const hx = lx + dir * 17
  rect(ctx, hx - 4, top - 13, 9, 5, '#d62828')
  rect(ctx, hx - 3, top - 8, 7, 1, '#fff4c0')
  dither(ctx, hx - 6, top - 7, 13, 8, '#fff4c066')
}

function ivoryTowerModel(ctx: Ctx, x: number) {
  const plinthTop = 124
  rect(ctx, x - 16, plinthTop, 32, WALL_BOTTOM + 4 - plinthTop, '#e8e2d0')
  rect(ctx, x - 16, plinthTop, 32, 2, '#ffffff')
  rect(ctx, x + 10, plinthTop + 2, 6, WALL_BOTTOM + 2 - plinthTop, '#c8c0a8')
  // the model: a slim white tower with a spire, and a tiny tree
  const base = plinthTop
  rect(ctx, x - 7, base - 64, 14, 64, '#10101c')
  rect(ctx, x - 6, base - 63, 12, 63, '#fbf7ea')
  rect(ctx, x + 2, base - 63, 4, 63, '#e0d8c0')
  for (let y = base - 58; y < base - 2; y += 5) rect(ctx, x - 4, y, 8, 1, '#c8c0a8')
  rect(ctx, x - 3, base - 70, 6, 6, '#fbf7ea')
  for (let i = 0; i < 12; i++) ctx.fillRect(x, base - 82 + i, 1, 1)
  rect(ctx, x - 13, base - 6, 4, 4, '#6cc05a')
  rect(ctx, x - 12, base - 2, 2, 2, '#6a4a2a')
  drawText(ctx, '1:500', x, base + 6, { color: '#6a6a78', align: 'center' })
}

function planBin(ctx: Ctx, x: number) {
  const top = 132
  const tubes = ['#9ab8e0', '#f4efe0', '#dce8f6', '#9ab8e0', '#f4efe0']
  tubes.forEach((c, i) => {
    const tx = x + 2 + i * 4
    const h = 18 + ((i * 7) % 9)
    rect(ctx, tx, top - h + 6, 3, h, c)
    rect(ctx, tx, top - h + 6, 3, 1, '#ffffff')
    rect(ctx, tx + 2, top - h + 6, 1, h, '#8a9ab0')
  })
  rect(ctx, x, top, 24, WALL_BOTTOM + 4 - top, '#3a3a44')
  rect(ctx, x + 1, top + 1, 22, 2, '#5a5a66')
}

function pendantLamp(ctx: Ctx, x: number) {
  rect(ctx, x, 0, 1, 26, '#2a2a34')
  rect(ctx, x - 10, 26, 21, 6, '#10101c')
  rect(ctx, x - 9, 26, 19, 5, '#e8e2d0')
  rect(ctx, x - 5, 32, 11, 1, '#fff4c0')
}

/** pale wood planks in perspective */
function woodFloor(ctx: Ctx) {
  const H = VIEW_H - FLOOR_TOP
  const r = rng(77)
  const shades = ['#c89868', '#bc8c5c', '#d0a070', '#c4905e']
  for (let y = FLOOR_TOP; y < VIEW_H; y++) {
    const t = (y - FLOOR_TOP + 1) / H
    const plank = 10 + t * 26
    for (let x = 0; x < VIEW_W; x++) {
      const u = (x - VIEW_W / 2) / plank + 100
      const col = Math.floor(u)
      const seam = u - col < 0.05
      ctx.fillStyle = seam ? '#8a5e3a' : shades[col % shades.length]
      ctx.fillRect(x, y, 1, 1)
    }
  }
  ctx.fillStyle = '#a87850'
  for (let i = 0; i < 400; i++) ctx.fillRect(Math.floor(r() * VIEW_W), FLOOR_TOP + Math.floor(r() * H), 2, 1)
  dither(ctx, 0, FLOOR_TOP, VIEW_W, 4, '#6a4a2a')
}

export function createBlueprintStudio(): HTMLCanvasElement {
  const [canvas, ctx] = newCanvas()
  // exposed concrete ceiling with a track light
  rect(ctx, 0, 0, VIEW_W, CEIL_H, '#9a9890')
  dither(ctx, 0, 0, VIEW_W, CEIL_H, '#8a8880', 4)
  rect(ctx, 0, CEIL_H - 1, VIEW_W, 1, '#6a6860')
  // warm off-white wall with a darker band at the bottom
  rect(ctx, 0, CEIL_H, VIEW_W, WALL_BOTTOM - CEIL_H, '#e8e2d0')
  dither(ctx, 0, CEIL_H, VIEW_W, 6, '#d8d2c0')
  rect(ctx, 0, 110, VIEW_W, WALL_BOTTOM - 110, '#d8d0b8')
  rect(ctx, 0, 110, VIEW_W, 1, '#c0b8a0')

  drawWindow(ctx, 12, 30, 78, 64, 23)
  blueprint(ctx, 112, 26, 150, 76)
  drawPoster(
    ctx,
    290,
    30,
    72,
    54,
    'THINK BIGGER',
    (x, y, w, h) => {
      rect(ctx, x, y, w, h, BLUE_DARK)
      // a compass-drawn arc and a skyscraper silhouette
      ctx.fillStyle = LINE
      for (let a = 0; a <= 20; a++) {
        const ang = Math.PI + (a / 20) * Math.PI
        ctx.fillRect(x + w / 2 + Math.round(Math.cos(ang) * 20), y + h - 2 + Math.round(Math.sin(ang) * 20), 1, 1)
      }
      rect(ctx, x + w / 2 - 3, y + 6, 6, h - 8, LINE)
      rect(ctx, x + w / 2, y + 2, 1, 4, LINE)
    },
    '#10101c',
  )
  sketch(ctx, 96, 40, 3)
  sketch(ctx, 268, 88, 9)

  pendantLamp(ctx, 150)
  pendantLamp(ctx, 250)
  draftingTable(ctx, 30, false)
  ivoryTowerModel(ctx, 196)
  draftingTable(ctx, 290, true)
  planBin(ctx, 240)
  drawPlant(ctx, 366, 138)

  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 6, '#6a4a2a')
  rect(ctx, 0, WALL_BOTTOM, VIEW_W, 1, '#8a6a4a')
  woodFloor(ctx)
  return canvas
}
