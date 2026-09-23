import { VIEW_W } from '../../constants'
import { drawText } from '../font'
import {
  baseboard,
  carpet,
  ceilingTiles,
  CEIL_H,
  disc,
  dither,
  drawBanner,
  drawMug,
  drawPoster,
  drawWindow,
  newCanvas,
  rect,
  WALL_BOTTOM,
  type Ctx,
} from './kit'

/** "Meeting Room B": the hockey-stick whiteboard, DREAM BIG, FULL SPEED NO BRAKES. */

function whiteboard(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rect(ctx, x, y, w, h, '#8a929a')
  rect(ctx, x + 2, y + 2, w - 4, h - 4, '#f8f8f4')
  dither(ctx, x + 2, y + 2, w - 4, 3, '#e8ece8')
  rect(ctx, x + 4, y + h, w - 8, 3, '#8a929a')
  // markers on the tray
  rect(ctx, x + 10, y + h - 1, 6, 2, '#d62828')
  rect(ctx, x + 18, y + h - 1, 6, 2, '#3a7bd5')
  // axes + the famous hockey stick
  const ox = x + 12
  const oy = y + h - 12
  rect(ctx, ox, y + 14, 1, oy - y - 14, '#2a2a34')
  rect(ctx, ox, oy, 70, 1, '#2a2a34')
  ctx.fillStyle = '#d62828'
  for (let i = 0; i < 66; i++) {
    const t = i / 66
    const v = t < 0.6 ? 6 - t * 6 : 2 + Math.pow((t - 0.6) / 0.4, 2) * 34
    ctx.fillRect(ox + 2 + i, Math.round(oy - 3 - v), 2, 1)
  }
  // arrow tip
  rect(ctx, ox + 66, oy - 40, 3, 1, '#d62828')
  rect(ctx, ox + 67, oy - 39, 1, 3, '#d62828')
  drawText(ctx, 'Q4', ox + 4, y + 6, { color: '#3a7bd5' })
  drawText(ctx, '10X!!', x + w - 36, y + 8, { color: '#d62828' })
  // sticky notes
  rect(ctx, x + w - 26, y + 24, 9, 9, '#f7e36a')
  rect(ctx, x + w - 15, y + 30, 9, 9, '#ff9ac0')
  rect(ctx, x + w - 24, y + 36, 9, 9, '#9ae0ff')
}

function dreamBigPicture(ctx: Ctx, x: number, y: number, w: number, h: number) {
  rect(ctx, x, y, w, h, '#f8b84a')
  rect(ctx, x, y, w, 8, '#e87a4a')
  dither(ctx, x, y + 7, w, 2, '#f8b84a')
  disc(ctx, x + w / 2, y + h - 4, 8, '#fff4c0')
  // mountains
  ctx.fillStyle = '#4a2a5a'
  for (let i = 0; i < w; i++) {
    const hgt = Math.max(0, 16 - Math.abs(i - w * 0.3) * 0.9, 12 - Math.abs(i - w * 0.75) * 0.8)
    ctx.fillRect(x + i, y + h - hgt, 1, hgt)
  }
}

function conferenceTable(ctx: Ctx) {
  const top = 132
  // chairs peeking above the table
  for (let cx = 56; cx < 340; cx += 38) {
    rect(ctx, cx, top - 20, 18, 22, '#10101c')
    rect(ctx, cx + 1, top - 19, 16, 20, '#2e2e3a')
    rect(ctx, cx + 3, top - 17, 12, 2, '#44445a')
  }
  // long polished table
  rect(ctx, 30, top, 324, 7, '#10101c')
  rect(ctx, 31, top + 1, 322, 3, '#8a5230')
  rect(ctx, 31, top + 1, 322, 1, '#b07048')
  rect(ctx, 31, top + 4, 322, 2, '#5e341c')
  for (const lx of [50, 332]) rect(ctx, lx, top + 7, 5, WALL_BOTTOM + 4 - top - 7, '#3a2012')
  // laptops, speakerphone, bottles, cups
  for (const lx of [70, 150, 250, 320]) {
    rect(ctx, lx, top - 9, 14, 9, '#10101c')
    rect(ctx, lx + 1, top - 8, 12, 7, '#9aa4b8')
    rect(ctx, lx + 2, top - 7, 10, 5, '#3a6ab8')
    rect(ctx, lx - 1, top - 1, 16, 1, '#5a5a64')
  }
  rect(ctx, 186, top - 3, 14, 3, '#10101c')
  rect(ctx, 188, top - 5, 10, 2, '#2a2a34')
  rect(ctx, 192, top - 4, 2, 1, '#5fe08a')
  for (const bx of [118, 230, 290]) {
    rect(ctx, bx, top - 8, 3, 8, '#9ae0ff')
    rect(ctx, bx, top - 9, 3, 1, '#3a7bd5')
  }
  drawMug(ctx, 104, top - 7, '#f4f4ee')
  drawMug(ctx, 272, top - 7, '#ffd23c')
}

export function createMeetingRoom(): HTMLCanvasElement {
  const [canvas, ctx] = newCanvas()
  ceilingTiles(ctx)
  rect(ctx, 0, CEIL_H, VIEW_W, WALL_BOTTOM - CEIL_H, '#b4bccb')
  dither(ctx, 0, CEIL_H, VIEW_W, 8, '#a4acbc')
  // wood panelling on the lower wall
  rect(ctx, 0, 104, VIEW_W, WALL_BOTTOM - 104, '#7a4a2a')
  for (let x = 0; x < VIEW_W; x += 16) rect(ctx, x, 106, 1, WALL_BOTTOM - 106, '#5e341c')
  rect(ctx, 0, 104, VIEW_W, 2, '#a86a40')

  drawWindow(ctx, 18, 34, 70, 56, 5)
  drawBanner(ctx, VIEW_W / 2, 32, 'FULL SPEED NO BRAKES', '#1f3b8c', '#ffe135')
  whiteboard(ctx, 124, 50, 136, 52)
  drawPoster(ctx, 292, 40, 64, 52, 'DREAM BIG', (x, y, w, h) => dreamBigPicture(ctx, x, y, w, h), '#c8a040')

  conferenceTable(ctx)
  baseboard(ctx, '#3a2012', '#5e341c')
  carpet(ctx, '#3f5a5e', '#34494d', '#4b686c', '#364e52', 19)
  return canvas
}
