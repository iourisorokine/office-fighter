import { VIEW_W } from '../../constants'
import { drawText } from '../font'
import {
  baseboard,
  ceilingTiles,
  CEIL_H,
  checkerFloor,
  disc,
  drawBanner,
  drawClock,
  drawMug,
  newCanvas,
  rect,
  WALL_BOTTOM,
  type Ctx,
} from './kit'

/** "The Cafeteria": vending machines, the chalkboard menu, a foosball table. */

function tiles(ctx: Ctx, y0: number, y1: number, base: string, grout: string, size: number) {
  rect(ctx, 0, y0, VIEW_W, y1 - y0, base)
  ctx.fillStyle = grout
  for (let y = y0; y < y1; y += size) ctx.fillRect(0, y, VIEW_W, 1)
  for (let y = y0; y < y1; y += size) {
    const off = ((y - y0) / size) % 2 ? size / 2 : 0
    for (let x = off; x < VIEW_W; x += size) ctx.fillRect(x, y, 1, size)
  }
}

function vending(ctx: Ctx, x: number, y: number, body: string, cans: string[], label: string) {
  const w = 40
  const h = WALL_BOTTOM + 4 - y
  rect(ctx, x, y, w, h, '#10101c')
  rect(ctx, x + 1, y + 1, w - 2, h - 2, body)
  rect(ctx, x + w - 8, y + 1, 7, h - 2, '#00000033')
  // glass with rows of drinks / snacks
  rect(ctx, x + 4, y + 12, 24, 44, '#1a2030')
  for (let row = 0; row < 5; row++) {
    for (let i = 0; i < 5; i++) {
      rect(ctx, x + 6 + i * 4, y + 15 + row * 8, 3, 5, cans[(row + i) % cans.length])
      rect(ctx, x + 6 + i * 4, y + 15 + row * 8, 1, 5, '#ffffff66')
    }
    rect(ctx, x + 5, y + 21 + row * 8, 22, 1, '#8a90a0')
  }
  rect(ctx, x + 4, y + 12, 1, 44, '#ffffff55')
  drawText(ctx, label, x + 16, y + 3, { color: '#ffffff', align: 'center' })
  // buttons + coin slot + tray
  for (let i = 0; i < 4; i++) rect(ctx, x + 31, y + 16 + i * 6, 5, 3, '#e8e0c8')
  rect(ctx, x + 32, y + 42, 3, 6, '#10101c')
  rect(ctx, x + 6, y + 62, 20, 7, '#10101c')
  rect(ctx, x + 7, y + 63, 18, 2, '#40404a')
}

function roundTable(ctx: Ctx, cx: number, top: number) {
  // chairs behind
  for (const dx of [-16, 12]) {
    rect(ctx, cx + dx, top - 12, 5, 26, '#10101c')
    rect(ctx, cx + dx + 1, top - 11, 3, 12, '#e8742a')
  }
  rect(ctx, cx - 18, top, 36, 5, '#10101c')
  rect(ctx, cx - 17, top + 1, 34, 2, '#f0ece0')
  rect(ctx, cx - 17, top + 3, 34, 1, '#b8b4a8')
  rect(ctx, cx - 2, top + 5, 4, WALL_BOTTOM + 4 - top - 5, '#5a5a64')
  rect(ctx, cx - 8, WALL_BOTTOM + 3, 16, 2, '#3a3a44')
  drawMug(ctx, cx - 10, top - 7, '#3a7bd5')
  // tray with a sad lunch
  rect(ctx, cx + 1, top - 3, 12, 3, '#a8584a')
  rect(ctx, cx + 3, top - 5, 5, 2, '#7a5a3a')
}

function foosball(ctx: Ctx, cx: number, top: number) {
  const w = 56
  const x = cx - w / 2
  rect(ctx, x, top, w, 12, '#10101c')
  rect(ctx, x + 1, top + 1, w - 2, 10, '#6b4a2e')
  rect(ctx, x + 4, top + 2, w - 8, 6, '#2f8a3f')
  rect(ctx, cx, top + 2, 1, 6, '#e8f4e8')
  // rods and little players
  for (let i = 0; i < 6; i++) {
    const rx = x + 8 + i * 8
    rect(ctx, rx, top - 4, 1, 20, '#c8ccd4')
    rect(ctx, rx - 1, top + 4, 3, 3, i % 2 ? '#d62828' : '#3a7bd5')
    rect(ctx, rx - 1, top - 6, 3, 2, '#10101c')
  }
  for (const lx of [x + 3, x + w - 6]) rect(ctx, lx, top + 12, 3, WALL_BOTTOM + 4 - top - 12, '#4a3220')
  disc(ctx, cx + 6, top + 5, 1, '#ffffff')
}

function coffeeCorner(ctx: Ctx, x: number) {
  const top = 128
  rect(ctx, x, top, VIEW_W - x, WALL_BOTTOM + 4 - top, '#10101c')
  rect(ctx, x + 1, top + 1, VIEW_W - x - 1, 4, '#c8ccd4')
  rect(ctx, x + 1, top + 5, VIEW_W - x - 1, WALL_BOTTOM - top - 2, '#7a8a9a')
  for (let dx = 20; dx < VIEW_W - x; dx += 24) rect(ctx, x + dx, top + 8, 1, WALL_BOTTOM - top - 6, '#5a6a7a')
  // chrome coffee machine
  rect(ctx, x + 14, top - 34, 26, 34, '#10101c')
  rect(ctx, x + 15, top - 33, 24, 32, '#b8c0c8')
  rect(ctx, x + 17, top - 30, 20, 8, '#2a2a34')
  drawText(ctx, 'JAVA', x + 27, top - 29, { color: '#ff8a1e', align: 'center' })
  rect(ctx, x + 24, top - 18, 6, 4, '#2a2a34')
  rect(ctx, x + 23, top - 8, 8, 7, '#f4f4ee')
  rect(ctx, x + 36, top - 33, 3, 32, '#8a929a')
  // microwave with a glowing clock
  rect(ctx, x + 48, top - 20, 32, 20, '#10101c')
  rect(ctx, x + 49, top - 19, 30, 18, '#e8e4d8')
  rect(ctx, x + 51, top - 17, 18, 14, '#2a3a3a')
  rect(ctx, x + 71, top - 16, 6, 3, '#1a1a1a')
  rect(ctx, x + 72, top - 15, 4, 1, '#5fe08a')
  // stack of cups
  for (let i = 0; i < 4; i++) rect(ctx, x + 3, top - 4 - i * 3, 6, 3, i % 2 ? '#f4f4ee' : '#e0dccc')
}

function menuBoard(ctx: Ctx, x: number, y: number) {
  rect(ctx, x, y, 84, 52, '#5a3a22')
  rect(ctx, x + 3, y + 3, 78, 46, '#23302a')
  drawText(ctx, "TODAY'S", x + 42, y + 7, { color: '#f4f4ee', align: 'center' })
  drawText(ctx, 'MEATLOAF', x + 42, y + 18, { color: '#ffe135', align: 'center' })
  drawText(ctx, 'AGAIN', x + 42, y + 29, { color: '#ffe135', align: 'center' })
  drawText(ctx, '$4.99', x + 42, y + 40, { color: '#ff8a8a', align: 'center' })
}

export function createCafeteria(): HTMLCanvasElement {
  const [canvas, ctx] = newCanvas()
  ceilingTiles(ctx, '#d8d6cc', '#b4b2a6')
  tiles(ctx, CEIL_H, 104, '#e6ece2', '#c4d0c4', 8)
  tiles(ctx, 104, WALL_BOTTOM, '#8fc4a8', '#6fa488', 8)
  rect(ctx, 0, 103, VIEW_W, 2, '#4f8a6e')

  drawBanner(ctx, VIEW_W / 2, 32, 'WORK HARD, PLAY HARDER', '#d62828', '#ffffff')
  drawClock(ctx, 112, 56)
  menuBoard(ctx, 150, 50)

  vending(ctx, 12, 62, '#c0202a', ['#f4f4ee', '#d62828', '#3a7bd5', '#ffd23c'], 'COLA')
  vending(ctx, 56, 62, '#2a5aa8', ['#e8742a', '#ffd23c', '#8a4a2a', '#5fe08a'], 'SNAX')

  roundTable(ctx, 128, 132)
  foosball(ctx, 200, 134)
  roundTable(ctx, 268, 132)
  coffeeCorner(ctx, 296)

  baseboard(ctx, '#3f6a56', '#6fa488')
  checkerFloor(ctx, '#cfc6ae', '#a8997c')
  return canvas
}
