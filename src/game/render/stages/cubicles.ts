import { VIEW_W } from '../../constants'
import {
  baseboard,
  carpet,
  ceilingTiles,
  CEIL_H,
  disc,
  dither,
  drawClock,
  drawMonitor,
  drawMug,
  drawPlant,
  drawPoster,
  drawWindow,
  newCanvas,
  rect,
  WALL_BOTTOM,
  type Ctx,
} from './kit'

/** "Open Space, Floor 3": cubicles, beige CRTs, and the MOONSHOT poster. */

function drawCubicle(ctx: Ctx, x: number, w: number, top: number) {
  const h = WALL_BOTTOM + 6 - top
  rect(ctx, x, top, w, h, '#2a2e3a')
  rect(ctx, x + 1, top + 1, w - 2, h - 1, '#6b7c98')
  dither(ctx, x + 1, top + 4, w - 2, h - 5, '#62728d')
  rect(ctx, x, top, w, 3, '#c3c6cc')
  rect(ctx, x, top + 3, w, 1, '#8a8e96')
  rect(ctx, x, top, 2, h, '#9aa0aa')
  rect(ctx, x + w - 2, top, 2, h, '#9aa0aa')
  // pinned memos
  rect(ctx, x + 8, top + 10, 7, 8, '#f4f1e6')
  rect(ctx, x + 9, top + 12, 5, 1, '#9a9a9a')
  rect(ctx, x + 9, top + 14, 4, 1, '#9a9a9a')
  rect(ctx, x + 11, top + 10, 1, 1, '#d62828')
  rect(ctx, x + w - 18, top + 14, 6, 6, '#f7e36a')
}

function drawWaterCooler(ctx: Ctx, x: number, y: number) {
  rect(ctx, x + 2, y, 14, 18, '#1d3f5e')
  rect(ctx, x + 3, y + 1, 12, 16, '#7ec8f0')
  rect(ctx, x + 4, y + 2, 2, 12, '#d8f1ff')
  rect(ctx, x + 3, y + 5, 12, 1, '#5aa6d6')
  rect(ctx, x + 6, y + 18, 6, 2, '#1d3f5e')
  rect(ctx, x, y + 20, 18, 30, '#2a2a2e')
  rect(ctx, x + 1, y + 21, 16, 28, '#e4e4de')
  rect(ctx, x + 13, y + 21, 4, 28, '#bdbdb5')
  rect(ctx, x + 5, y + 27, 3, 3, '#3a7bd5')
  rect(ctx, x + 10, y + 27, 3, 3, '#d62828')
  rect(ctx, x + 4, y + 32, 10, 2, '#8a8a84')
}

/** night sky, a big moon and a rocket going for it */
function moonshotPicture(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rect(ctx, x, y, w, h, '#101a3a')
  ctx.fillStyle = '#ffffff'
  for (const [sx, sy] of [[4, 3], [12, 9], [21, 4], [44, 6], [50, 14], [8, 18], [30, 2], [38, 20]]) {
    if (sx < w && sy < h) ctx.fillRect(x + sx, y + sy, 1, 1)
  }
  disc(ctx, x + w - 12, y + 9, 7, '#e8e4c8')
  disc(ctx, x + w - 10, y + 7, 2, '#c8c2a0')
  disc(ctx, x + w - 15, y + 12, 1, '#c8c2a0')
  // rocket, flying up to the right
  for (let i = 0; i < 12; i++) {
    const rx = x + 10 + i
    const ry = y + h - 6 - i
    rect(ctx, rx, ry, 3, 3, i > 9 ? '#d62828' : '#f4f4ee')
  }
  rect(ctx, x + 9, y + h - 4, 3, 2, '#d62828')
  rect(ctx, x + 13, y + h - 8, 2, 2, '#3a7bd5')
  // flame
  rect(ctx, x + 6, y + h - 3, 3, 2, '#ffae1e')
  rect(ctx, x + 4, y + h - 2, 2, 1, '#ff4a2a')
}

export function createCubicles(): HTMLCanvasElement {
  const [canvas, ctx] = newCanvas()
  ceilingTiles(ctx)
  rect(ctx, 0, CEIL_H, VIEW_W, WALL_BOTTOM - CEIL_H, '#a3ab94')
  dither(ctx, 0, CEIL_H, VIEW_W, 10, '#939b85')
  rect(ctx, 0, CEIL_H, VIEW_W, 2, '#8a917c')

  drawWindow(ctx, 22, 30, 96, 66, 11)
  drawWindow(ctx, 266, 30, 96, 66, 23)
  drawClock(ctx, 192, 30)
  drawPoster(ctx, 160, 46, 64, 48, 'MOONSHOT', (x, y, w, h) => moonshotPicture(ctx, x, y, w, h))

  drawCubicle(ctx, -2, 98, 118)
  drawCubicle(ctx, 290, 96, 118)
  drawCubicle(ctx, 104, 70, 124)
  drawCubicle(ctx, 212, 70, 124)
  drawMonitor(ctx, 30, 99)
  drawMonitor(ctx, 120, 105)
  drawMonitor(ctx, 330, 99)
  drawPlant(ctx, 250, 113)
  drawMug(ctx, 70, 111)
  rect(ctx, 304, 110, 14, 8, '#2a2a2e')
  for (let i = 0; i < 4; i++) rect(ctx, 305, 111 + i * 2, 12, 1, i % 2 ? '#e4e4de' : '#f4f4ee')
  drawWaterCooler(ctx, 183, 110)

  baseboard(ctx)
  carpet(ctx, '#4d5a70', '#3f4a5e', '#56647c', '#414d62')
  // a suspicious coffee stain
  ctx.fillStyle = '#5b4a3a'
  for (let y = -3; y <= 3; y++) {
    for (let x = -7; x <= 7; x++) {
      if ((x * x) / 49 + (y * y) / 9 <= 1 && (x + y) % 2 === 0) ctx.fillRect(300 + x, 205 + y, 1, 1)
    }
  }
  return canvas
}
